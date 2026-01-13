import type {
  RepairShop,
  RepairShopSummary,
  ShopSearchParams,
  ShopSearchResult,
  ShopContact,
  ShopContactRequest,
} from '@myautowhiz/shared';
import type { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { getCache, setCache } from '../lib/redis';
import { GooglePlacesError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const CACHE_TTL = 60 * 60; // 1 hour

// Google Places API (New) endpoints
const PLACES_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places';

// Google Places API response types
interface GooglePlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  regularOpeningHours?: { openNow?: boolean };
  types?: string[];
  nationalPhoneNumber?: string;
  websiteUri?: string;
  addressComponents?: unknown[];
}

// Convert Google's price level string to number
function parsePriceLevel(priceLevel?: string): number | null {
  if (!priceLevel) return null;
  const levels: Record<string, number> = {
    'PRICE_LEVEL_UNSPECIFIED': 0,
    'PRICE_LEVEL_FREE': 0,
    'PRICE_LEVEL_INEXPENSIVE': 1,
    'PRICE_LEVEL_MODERATE': 2,
    'PRICE_LEVEL_EXPENSIVE': 3,
    'PRICE_LEVEL_VERY_EXPENSIVE': 4,
  };
  return levels[priceLevel] ?? null;
}

interface GooglePlacesResponse {
  places?: GooglePlaceResult[];
}

class ShopService {
  async searchShops(params: ShopSearchParams): Promise<ShopSearchResult> {
    const {
      latitude,
      longitude,
      radiusMiles = 25,
      specialty,
      minRating,
      openNow,
      sortBy = 'distance',
      limit = 20,
      offset = 0,
    } = params;

    const radiusMeters = radiusMiles * 1609.34; // Convert to meters
    const cacheKey = `shops:${latitude.toFixed(4)}:${longitude.toFixed(4)}:${radiusMiles}:${specialty || 'all'}`;

    // Check cache
    const cached = await getCache<RepairShopSummary[]>(cacheKey);
    let shops: RepairShopSummary[];

    if (cached) {
      shops = cached;
    } else {
      // Fetch from Google Places API
      shops = await this.fetchFromGooglePlaces(latitude, longitude, radiusMeters);
      await setCache(cacheKey, shops, CACHE_TTL);
    }

    // Apply filters
    let filtered = shops;

    if (specialty) {
      filtered = filtered.filter((shop) =>
        shop.specialties.some((s) => s.toLowerCase().includes(specialty.toLowerCase()))
      );
    }

    if (minRating) {
      filtered = filtered.filter((shop) => (shop.googleRating || 0) >= minRating);
    }

    if (openNow !== undefined) {
      filtered = filtered.filter((shop) => shop.isOpen === openNow);
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.googleRating || 0) - (a.googleRating || 0));
        break;
      case 'reviews':
        filtered.sort((a, b) => (b.googleReviewCount || 0) - (a.googleReviewCount || 0));
        break;
      case 'distance':
      default:
        filtered.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    // Paginate
    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);

    return {
      shops: paged,
      total,
      searchLocation: { latitude, longitude },
      radiusMiles,
    };
  }

  async getShopById(shopId: string): Promise<RepairShop> {
    // First check database
    let shop = await prisma.repairShop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      // Try Google Place ID
      shop = await prisma.repairShop.findUnique({
        where: { googlePlaceId: shopId },
      });
    }

    if (!shop) {
      throw NotFoundError('Repair shop');
    }

    return this.mapToRepairShop(shop);
  }

  async getShopByPlaceId(placeId: string): Promise<RepairShop> {
    // Check database cache first
    const cached = await prisma.repairShop.findUnique({
      where: { googlePlaceId: placeId },
    });

    if (cached && cached.cachedUntil && cached.cachedUntil > new Date()) {
      return this.mapToRepairShop(cached);
    }

    // Fetch fresh data from Google
    const details = await this.fetchPlaceDetails(placeId);
    if (!details) {
      throw NotFoundError('Repair shop');
    }

    // Upsert to database
    const shop = await prisma.repairShop.upsert({
      where: { googlePlaceId: placeId },
      create: details,
      update: { ...details, lastUpdated: new Date() },
    });

    return this.mapToRepairShop(shop);
  }

  async contactShop(
    userId: string,
    shopId: string,
    input: ShopContactRequest
  ): Promise<ShopContact> {
    const shop = await prisma.repairShop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      throw NotFoundError('Repair shop');
    }

    // Get vehicle info if provided
    let vehicleInfo: string | null = null;
    if (input.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: input.vehicleId },
        select: { year: true, make: true, model: true },
      });
      if (vehicle) {
        vehicleInfo = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      }
    }

    const contact = await prisma.shopContact.create({
      data: {
        shopId,
        userId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        message: input.message,
        vehicleInfo,
        diagnosticId: input.diagnosticId,
        status: 'pending',
      },
    });

    logger.info('Shop contact submitted', { userId, shopId, contactId: contact.id });

    // TODO: Send notification to shop (email or webhook) if they're a partner

    return {
      id: contact.id,
      shopId: contact.shopId,
      userId: contact.userId,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      message: contact.message,
      status: contact.status as ShopContact['status'],
      createdAt: contact.createdAt,
    };
  }

  private async fetchFromGooglePlaces(
    latitude: number,
    longitude: number,
    radiusMeters: number
  ): Promise<RepairShopSummary[]> {
    if (!GOOGLE_PLACES_API_KEY) {
      logger.warn('Google Places API key not configured');
      return [];
    }

    try {
      const response = await fetch(PLACES_NEARBY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.regularOpeningHours,places.types,places.primaryType',
        },
        body: JSON.stringify({
          includedTypes: ['car_repair', 'auto_repair'],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: { latitude, longitude },
              radius: Math.min(radiusMeters, 50000), // Max 50km
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Google Places API error', { status: response.status, error });
        throw new Error(`Google Places API returned ${response.status}`);
      }

      const data = await response.json() as GooglePlacesResponse;
      const places = data.places || [];

      // Convert to our format and calculate distances
      const shops: RepairShopSummary[] = places.map((place: GooglePlaceResult) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          place.location.latitude,
          place.location.longitude
        );

        // Parse specialties from types
        const specialties = this.parseSpecialties(place.types || []);

        return {
          id: place.id,
          googlePlaceId: place.id,
          name: place.displayName?.text || 'Unknown Shop',
          address: place.formattedAddress ?? null,
          city: null, // Would need to parse from address
          state: null,
          distance,
          googleRating: place.rating ?? null,
          googleReviewCount: place.userRatingCount ?? null,
          priceLevel: parsePriceLevel(place.priceLevel),
          isOpen: place.regularOpeningHours?.openNow ?? null,
          specialties,
          certifications: [],
          isVerified: false,
          isPartner: false,
        };
      });

      // Store in database for caching
      for (const shop of shops) {
        await prisma.repairShop
          .upsert({
            where: { googlePlaceId: shop.googlePlaceId },
            create: {
              googlePlaceId: shop.googlePlaceId,
              name: shop.name,
              address: shop.address,
              latitude: places.find((p: GooglePlaceResult) => p.id === shop.googlePlaceId)?.location.latitude || 0,
              longitude: places.find((p: GooglePlaceResult) => p.id === shop.googlePlaceId)?.location.longitude || 0,
              googleRating: shop.googleRating,
              googleReviewCount: shop.googleReviewCount,
              priceLevel: shop.priceLevel,
              specialties: shop.specialties,
              cachedUntil: new Date(Date.now() + CACHE_TTL * 1000),
            },
            update: {
              name: shop.name,
              address: shop.address,
              googleRating: shop.googleRating,
              googleReviewCount: shop.googleReviewCount,
              priceLevel: shop.priceLevel,
              cachedUntil: new Date(Date.now() + CACHE_TTL * 1000),
              lastUpdated: new Date(),
            },
          })
          .catch((err: Error) => {
            logger.debug('Shop upsert skipped', { placeId: shop.googlePlaceId, error: err.message });
          });
      }

      return shops;
    } catch (error) {
      logger.error('Failed to fetch shops from Google Places', { error });
      throw GooglePlacesError('Unable to search for repair shops');
    }
  }

  private async fetchPlaceDetails(placeId: string): Promise<{
    googlePlaceId: string;
    name: string;
    address?: string | null;
    latitude: number;
    longitude: number;
    phone?: string | null;
    website?: string | null;
    googleRating?: number | null;
    googleReviewCount?: number | null;
    priceLevel?: number | null;
    businessHours?: Prisma.InputJsonValue;
    specialties: string[];
    cachedUntil: Date;
  } | null> {
    if (!GOOGLE_PLACES_API_KEY) {
      return null;
    }

    try {
      const response = await fetch(`${PLACES_DETAILS_URL}/${placeId}`, {
        headers: {
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,priceLevel,regularOpeningHours,types,nationalPhoneNumber,websiteUri,addressComponents',
        },
      });

      if (!response.ok) {
        return null;
      }

      const place = await response.json() as GooglePlaceResult;

      return {
        googlePlaceId: place.id,
        name: place.displayName?.text || 'Unknown',
        address: place.formattedAddress,
        latitude: place.location?.latitude || 0,
        longitude: place.location?.longitude || 0,
        phone: place.nationalPhoneNumber,
        website: place.websiteUri,
        googleRating: place.rating,
        googleReviewCount: place.userRatingCount,
        priceLevel: parsePriceLevel(place.priceLevel),
        businessHours: place.regularOpeningHours as Prisma.InputJsonValue | undefined,
        specialties: this.parseSpecialties(place.types || []),
        cachedUntil: new Date(Date.now() + CACHE_TTL * 1000),
      };
    } catch (error) {
      logger.error('Failed to fetch place details', { placeId, error });
      return null;
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private parseSpecialties(types: string[]): string[] {
    const specialtyMap: Record<string, string> = {
      car_repair: 'general',
      car_dealer: 'dealer',
      auto_repair: 'general',
      car_wash: 'detailing',
      gas_station: 'fuel',
    };

    return types
      .filter((t) => specialtyMap[t])
      .map((t) => specialtyMap[t])
      .filter((v, i, a) => a.indexOf(v) === i); // Unique
  }

  private mapToRepairShop(shop: Awaited<ReturnType<typeof prisma.repairShop.findUnique>> & object): RepairShop {
    return {
      id: shop.id,
      googlePlaceId: shop.googlePlaceId,
      name: shop.name,
      address: shop.address,
      city: shop.city,
      state: shop.state,
      zipCode: shop.zipCode,
      country: shop.country,
      latitude: Number(shop.latitude),
      longitude: Number(shop.longitude),
      phone: shop.phone,
      website: shop.website,
      googleRating: shop.googleRating ? Number(shop.googleRating) : null,
      googleReviewCount: shop.googleReviewCount,
      priceLevel: shop.priceLevel,
      businessHours: shop.businessHours as RepairShop['businessHours'],
      specialties: shop.specialties,
      certifications: shop.certifications,
      isVerified: shop.isVerified,
      isPartner: shop.isPartner,
      lastUpdated: shop.lastUpdated,
    };
  }
}

export const shopService = new ShopService();
