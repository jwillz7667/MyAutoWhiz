import type {
  VinDecodedData,
  SafetyRatings,
  RecallData,
  NhtsaDecodeResponse,
  NhtsaSafetyResponse,
  NhtsaRecallResponse,
} from '@myautowhiz/shared';

import { getCache, setCache } from '../lib/redis';
import { NhtsaApiError } from '../utils/errors';
import { logger } from '../utils/logger';

const NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api';
const NHTSA_RECALLS_URL = 'https://api.nhtsa.gov/recalls/recallsByVehicle';
const NHTSA_SAFETY_URL = 'https://api.nhtsa.gov/SafetyRatings';

// Cache TTLs in seconds
const VIN_DECODE_CACHE_TTL = 24 * 60 * 60; // 24 hours
const SAFETY_CACHE_TTL = 7 * 24 * 60 * 60; // 7 days
const RECALLS_CACHE_TTL = 60 * 60; // 1 hour

class NhtsaService {
  async decodeVin(vin: string): Promise<VinDecodedData> {
    const cacheKey = `vin:decode:${vin}`;

    // Check cache
    const cached = await getCache<VinDecodedData>(cacheKey);
    if (cached) {
      logger.debug('VIN decode cache hit', { vin });
      return cached;
    }

    try {
      const url = `${NHTSA_BASE_URL}/vehicles/DecodeVinValuesExtended/${vin}?format=json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`NHTSA API returned ${response.status}`);
      }

      const data = await response.json() as NhtsaDecodeResponse;

      if (!data.Results || data.Results.length === 0) {
        throw new Error('No results from VIN decode');
      }

      const decoded = this.parseDecodeResponse(vin, data.Results);

      // Cache result
      await setCache(cacheKey, decoded, VIN_DECODE_CACHE_TTL);

      logger.info('VIN decoded', { vin, make: decoded.make, model: decoded.model });

      return decoded;
    } catch (error) {
      logger.error('NHTSA decode error', { vin, error });
      throw NhtsaApiError('Failed to decode VIN. Please try again.');
    }
  }

  async getSafetyRatings(
    year: number,
    make: string,
    model: string
  ): Promise<SafetyRatings | null> {
    const cacheKey = `safety:${year}:${make}:${model}`.toLowerCase().replace(/\s+/g, '_');

    // Check cache
    const cached = await getCache<SafetyRatings>(cacheKey);
    if (cached) {
      logger.debug('Safety ratings cache hit', { year, make, model });
      return cached;
    }

    try {
      // First, get vehicle ID
      const searchUrl = `${NHTSA_SAFETY_URL}/modelyear/${year}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}?format=json`;
      const searchResponse = await fetch(searchUrl);

      if (!searchResponse.ok) {
        return null;
      }

      const searchData = await searchResponse.json() as NhtsaSafetyResponse;

      if (!searchData.Results || searchData.Results.length === 0) {
        return null;
      }

      // Get detailed ratings for the first matching vehicle
      const vehicleId = searchData.Results[0].VehicleId;
      const ratingsUrl = `${NHTSA_SAFETY_URL}/VehicleId/${vehicleId}?format=json`;
      const ratingsResponse = await fetch(ratingsUrl);

      if (!ratingsResponse.ok) {
        return null;
      }

      const ratingsData = await ratingsResponse.json() as NhtsaSafetyResponse;

      if (!ratingsData.Results || ratingsData.Results.length === 0) {
        return null;
      }

      const ratings = this.parseSafetyRatings(ratingsData.Results[0]);

      // Cache result
      await setCache(cacheKey, ratings, SAFETY_CACHE_TTL);

      logger.info('Safety ratings retrieved', { year, make, model });

      return ratings;
    } catch (error) {
      logger.error('NHTSA safety ratings error', { year, make, model, error });
      return null;
    }
  }

  async getRecalls(
    year: number,
    make: string,
    model: string
  ): Promise<RecallData[]> {
    const cacheKey = `recalls:${year}:${make}:${model}`.toLowerCase().replace(/\s+/g, '_');

    // Check cache
    const cached = await getCache<RecallData[]>(cacheKey);
    if (cached) {
      logger.debug('Recalls cache hit', { year, make, model });
      return cached;
    }

    try {
      const url = `${NHTSA_RECALLS_URL}?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`NHTSA Recalls API returned ${response.status}`);
      }

      const data = await response.json() as NhtsaRecallResponse;

      const recalls = (data.results || []).map(this.parseRecall);

      // Cache result
      await setCache(cacheKey, recalls, RECALLS_CACHE_TTL);

      logger.info('Recalls retrieved', { year, make, model, count: recalls.length });

      return recalls;
    } catch (error) {
      logger.error('NHTSA recalls error', { year, make, model, error });
      return [];
    }
  }

  private parseDecodeResponse(
    vin: string,
    results: { Variable: string; Value: string | null }[]
  ): VinDecodedData {
    const getValue = (variable: string): string | null => {
      const result = results.find((r) => r.Variable === variable);
      return result?.Value || null;
    };

    const getNumericValue = (variable: string): number | null => {
      const value = getValue(variable);
      if (!value) return null;
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    };

    const getBooleanValue = (variable: string): boolean | null => {
      const value = getValue(variable);
      if (!value) return null;
      return value.toLowerCase() === 'yes' || value === '1';
    };

    // Build raw response object
    const rawResponse: Record<string, unknown> = {};
    for (const result of results) {
      if (result.Value) {
        rawResponse[result.Variable] = result.Value;
      }
    }

    return {
      vin,
      year: getNumericValue('Model Year') || 0,
      make: getValue('Make') || '',
      model: getValue('Model') || '',
      trim: getValue('Trim'),
      vehicleType: getValue('Vehicle Type') || '',
      bodyClass: getValue('Body Class') || '',
      driveType: getValue('Drive Type') || '',
      engineCylinders: getNumericValue('Engine Number of Cylinders'),
      engineDisplacementL: getNumericValue('Displacement (L)'),
      engineHP: getNumericValue('Engine Brake (hp) From'),
      fuelTypePrimary: getValue('Fuel Type - Primary') || '',
      transmissionStyle: getValue('Transmission Style'),
      transmissionSpeeds: getNumericValue('Transmission Speeds'),
      manufacturerName: getValue('Manufacturer Name') || '',
      plantCity: getValue('Plant City'),
      plantState: getValue('Plant State'),
      plantCountry: getValue('Plant Country'),
      gvwr: getValue('Gross Vehicle Weight Rating From'),
      abs: getBooleanValue('Anti-lock Braking System (ABS)'),
      airBagLocCurtain: getValue('Curtain Air Bag Locations'),
      airBagLocFront: getValue('Front Air Bag Locations'),
      airBagLocSide: getValue('Side Air Bag Locations'),
      blindSpotMon: getBooleanValue('Blind Spot Monitoring'),
      forwardCollisionWarning: getBooleanValue('Forward Collision Warning'),
      laneDepartureWarning: getBooleanValue('Lane Departure Warning'),
      rearCrossTrafficAlert: getBooleanValue('Rear Cross Traffic Alert'),
      rawResponse,
    };
  }

  private parseSafetyRatings(result: NhtsaSafetyResponse['Results'][0]): SafetyRatings {
    const parseRating = (rating: string): number | null => {
      if (!rating || rating === 'Not Rated') return null;
      const num = parseInt(rating, 10);
      return isNaN(num) ? null : num;
    };

    return {
      vehicleId: result.VehicleId,
      overallRating: parseRating(result.OverallRating),
      overallFrontCrashRating: parseRating(result.OverallFrontCrashRating),
      frontCrashDriversideRating: parseRating(result.FrontCrashDriversideRating),
      frontCrashPassengersideRating: parseRating(result.FrontCrashPassengersideRating),
      overallSideCrashRating: parseRating(result.OverallSideCrashRating),
      sideCrashDriversideRating: parseRating(result.SideCrashDriversideRating),
      sideCrashPassengersideRating: parseRating(result.SideCrashPassengersideRating),
      rolloverRating: parseRating(result.RolloverRating),
      rolloverPossibility: result.RolloverPossibility,
      sidePoleCrashRating: parseRating(result.SidePoleCrashRating),
      complaintsCount: result.ComplaintsCount,
      recallsCount: result.RecallsCount,
      investigationsCount: result.InvestigationCount,
      nhtsa5StarSafetyRatings: result.OverallRating,
    };
  }

  private parseRecall(result: NhtsaRecallResponse['results'][0]): RecallData {
    return {
      campaignNumber: result.NHTSACampaignNumber,
      recallDate: result.ReportReceivedDate,
      component: result.Component,
      summary: result.Summary,
      consequence: result.Consequence,
      remedy: result.Remedy,
      notes: result.Notes || null,
      manufacturer: result.Manufacturer,
    };
  }
}

export const nhtsaService = new NhtsaService();
