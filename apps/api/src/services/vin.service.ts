import type { VinDecodeResponse, VinLookup } from '@myautowhiz/shared';

import { prisma } from '../lib/prisma';
import { InvalidVinError } from '../utils/errors';
import { logger } from '../utils/logger';
import { isValidVin } from '../utils/vin';

import { incrementVinLookupCount } from '../middleware/rateLimit';
import { nhtsaService } from './nhtsa.service';

class VinService {
  async decodeVin(
    vin: string,
    userId?: string,
    options: {
      includeRecalls?: boolean;
      includeSafety?: boolean;
      source?: 'web' | 'ios' | 'api';
    } = {}
  ): Promise<VinDecodeResponse> {
    const { includeRecalls = true, includeSafety = true, source = 'web' } = options;

    // Validate VIN format
    if (!isValidVin(vin)) {
      throw InvalidVinError(vin);
    }

    const normalizedVin = vin.toUpperCase();

    // Check recent cache
    const cached = await prisma.vinLookup.findFirst({
      where: {
        vin: normalizedVin,
        lookupType: 'full',
        cachedUntil: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (cached && cached.decodedData) {
      logger.debug('VIN decode cache hit', { vin: normalizedVin });
      return {
        vin: normalizedVin,
        decoded: (cached.decodedData as unknown) as VinDecodeResponse['decoded'],
        safetyRatings: ((cached.safetyData as unknown) as VinDecodeResponse['safetyRatings']) || null,
        recalls: ((cached.recallData as unknown) as VinDecodeResponse['recalls']) || [],
        cached: true,
        cachedAt: cached.createdAt,
      };
    }

    // Decode VIN from NHTSA
    const decoded = await nhtsaService.decodeVin(normalizedVin);

    // Get safety ratings if requested
    let safetyRatings = null;
    if (includeSafety && decoded.year && decoded.make && decoded.model) {
      safetyRatings = await nhtsaService.getSafetyRatings(
        decoded.year,
        decoded.make,
        decoded.model
      );
    }

    // Get recalls if requested
    let recalls: VinDecodeResponse['recalls'] = [];
    if (includeRecalls && decoded.year && decoded.make && decoded.model) {
      recalls = await nhtsaService.getRecalls(decoded.year, decoded.make, decoded.model);
    }

    // Store lookup record
    const cachedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.vinLookup.create({
      data: {
        userId,
        vin: normalizedVin,
        lookupType: 'full',
        decodedData: JSON.parse(JSON.stringify(decoded)),
        safetyData: safetyRatings ? JSON.parse(JSON.stringify(safetyRatings)) : null,
        recallData: JSON.parse(JSON.stringify(recalls)),
        source,
        cachedUntil,
      },
    });

    // Increment usage counter if user is logged in
    if (userId) {
      await incrementVinLookupCount(userId);
    }

    logger.info('VIN decoded', {
      vin: normalizedVin,
      userId,
      make: decoded.make,
      model: decoded.model,
      recallCount: recalls.length,
    });

    return {
      vin: normalizedVin,
      decoded,
      safetyRatings,
      recalls,
      cached: false,
      cachedAt: null,
    };
  }

  async getRecalls(
    vin: string,
    userId?: string
  ): Promise<{ vin: string; recalls: VinDecodeResponse['recalls']; checkedAt: Date }> {
    if (!isValidVin(vin)) {
      throw InvalidVinError(vin);
    }

    const normalizedVin = vin.toUpperCase();

    // First decode to get year/make/model
    const decoded = await nhtsaService.decodeVin(normalizedVin);

    if (!decoded.year || !decoded.make || !decoded.model) {
      return { vin: normalizedVin, recalls: [], checkedAt: new Date() };
    }

    const recalls = await nhtsaService.getRecalls(decoded.year, decoded.make, decoded.model);

    logger.info('Recalls checked', { vin: normalizedVin, recallCount: recalls.length });

    return {
      vin: normalizedVin,
      recalls,
      checkedAt: new Date(),
    };
  }

  async getSafetyRatings(
    vin: string,
    userId?: string
  ): Promise<{ vin: string; ratings: VinDecodeResponse['safetyRatings']; checkedAt: Date }> {
    if (!isValidVin(vin)) {
      throw InvalidVinError(vin);
    }

    const normalizedVin = vin.toUpperCase();

    // First decode to get year/make/model
    const decoded = await nhtsaService.decodeVin(normalizedVin);

    if (!decoded.year || !decoded.make || !decoded.model) {
      return { vin: normalizedVin, ratings: null, checkedAt: new Date() };
    }

    const ratings = await nhtsaService.getSafetyRatings(
      decoded.year,
      decoded.make,
      decoded.model
    );

    logger.info('Safety ratings checked', {
      vin: normalizedVin,
      hasRatings: !!ratings,
    });

    return {
      vin: normalizedVin,
      ratings,
      checkedAt: new Date(),
    };
  }

  async getRecentLookups(userId: string, limit = 10): Promise<VinLookup[]> {
    const lookups = await prisma.vinLookup.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return lookups.map((l: (typeof lookups)[number]) => ({
      id: l.id,
      userId: l.userId,
      vin: l.vin,
      lookupType: l.lookupType as VinLookup['lookupType'],
      decodedData: l.decodedData as VinLookup['decodedData'],
      safetyData: l.safetyData as VinLookup['safetyData'],
      recallData: l.recallData as VinLookup['recallData'],
      marketValue: l.marketValue as VinLookup['marketValue'],
      source: l.source as VinLookup['source'],
      cachedUntil: l.cachedUntil,
      createdAt: l.createdAt,
    }));
  }
}

export const vinService = new VinService();
