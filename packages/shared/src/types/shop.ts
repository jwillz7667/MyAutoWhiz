export interface RepairShop {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  priceLevel: number | null;
  businessHours: BusinessHours | null;
  specialties: string[];
  certifications: string[];
  isVerified: boolean;
  isPartner: boolean;
  lastUpdated: Date;
}

export interface RepairShopSummary {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  distance: number | null; // miles from search location
  googleRating: number | null;
  googleReviewCount: number | null;
  priceLevel: number | null;
  isOpen: boolean | null;
  specialties: string[];
  certifications: string[];
  isVerified: boolean;
  isPartner: boolean;
}

export interface BusinessHours {
  monday: DayHours | null;
  tuesday: DayHours | null;
  wednesday: DayHours | null;
  thursday: DayHours | null;
  friday: DayHours | null;
  saturday: DayHours | null;
  sunday: DayHours | null;
}

export interface DayHours {
  open: string; // "09:00"
  close: string; // "17:00"
}

export interface ShopSearchParams {
  latitude: number;
  longitude: number;
  radiusMiles?: number;
  specialty?: string;
  certification?: string;
  minRating?: number;
  openNow?: boolean;
  sortBy?: 'distance' | 'rating' | 'reviews';
  limit?: number;
  offset?: number;
}

export interface ShopSearchResult {
  shops: RepairShopSummary[];
  total: number;
  searchLocation: {
    latitude: number;
    longitude: number;
  };
  radiusMiles: number;
}

export interface ShopContact {
  id: string;
  shopId: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'pending' | 'contacted' | 'converted';
  createdAt: Date;
}

export interface ShopContactRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
  vehicleId?: string;
  diagnosticId?: string;
}

export const ShopSpecialties = [
  'general',
  'brakes',
  'transmission',
  'electrical',
  'engine',
  'exhaust',
  'suspension',
  'air_conditioning',
  'tires',
  'body_shop',
  'collision',
  'hybrid_ev',
  'european',
  'asian',
  'domestic',
  'diesel',
  'performance',
] as const;

export type ShopSpecialty = (typeof ShopSpecialties)[number];

export const ShopCertifications = [
  'ASE',
  'AAA_Approved',
  'BBB_Accredited',
  'Dealer_Certified',
  'Manufacturer_Authorized',
  'I-CAR_Gold',
  'Green_Certified',
] as const;

export type ShopCertification = (typeof ShopCertifications)[number];
