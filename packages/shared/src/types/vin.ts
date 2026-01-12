import type { VinDecodedData, SafetyRatings, RecallData } from './vehicle';

export interface VinDecodeRequest {
  vin: string;
}

export interface VinDecodeResponse {
  vin: string;
  decoded: VinDecodedData;
  safetyRatings: SafetyRatings | null;
  recalls: RecallData[];
  cached: boolean;
  cachedAt: Date | null;
}

export interface VinLookup {
  id: string;
  userId: string | null;
  vin: string;
  lookupType: 'decode' | 'recalls' | 'safety' | 'full';
  decodedData: VinDecodedData | null;
  safetyData: SafetyRatings | null;
  recallData: RecallData[] | null;
  marketValue: MarketValue | null;
  source: 'web' | 'ios' | 'api';
  cachedUntil: Date | null;
  createdAt: Date;
}

export interface MarketValue {
  estimatedValue: number;
  confidenceScore: number;
  priceRange: {
    low: number;
    high: number;
  };
  comparables: {
    count: number;
    avgPrice: number;
    avgMileage: number;
  };
  factors: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];
  lastUpdated: Date;
}

export interface RecallCheckResponse {
  vin: string;
  vehicleInfo: {
    year: number;
    make: string;
    model: string;
  };
  recalls: RecallData[];
  totalRecalls: number;
  checkedAt: Date;
}

export interface SafetyRatingsResponse {
  vin: string;
  vehicleInfo: {
    year: number;
    make: string;
    model: string;
  };
  ratings: SafetyRatings | null;
  available: boolean;
  checkedAt: Date;
}

// NHTSA API response types
export interface NhtsaDecodeResponse {
  Count: number;
  Message: string;
  SearchCriteria: string;
  Results: NhtsaDecodeResult[];
}

export interface NhtsaDecodeResult {
  Value: string | null;
  ValueId: string | null;
  Variable: string;
  VariableId: number;
}

export interface NhtsaSafetyResponse {
  Count: number;
  Message: string;
  Results: NhtsaSafetyResult[];
}

export interface NhtsaSafetyResult {
  VehicleId: number;
  VehicleDescription: string;
  OverallRating: string;
  OverallFrontCrashRating: string;
  FrontCrashDriversideRating: string;
  FrontCrashPassengersideRating: string;
  OverallSideCrashRating: string;
  SideCrashDriversideRating: string;
  SideCrashPassengersideRating: string;
  RolloverRating: string;
  RolloverPossibility: number;
  SidePoleCrashRating: string;
  ComplaintsCount: number;
  RecallsCount: number;
  InvestigationCount: number;
  NHTSAElectronicStabilityControl: string;
  NHTSAForwardCollisionWarning: string;
  NHTSALaneDepartureWarning: string;
}

export interface NhtsaRecallResponse {
  Count: number;
  Message: string;
  results: NhtsaRecallResult[];
}

export interface NhtsaRecallResult {
  Manufacturer: string;
  NHTSACampaignNumber: string;
  ReportReceivedDate: string;
  Component: string;
  Summary: string;
  Consequence: string;
  Remedy: string;
  Notes: string;
}
