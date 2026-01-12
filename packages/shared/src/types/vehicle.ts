export interface Vehicle {
  id: string;
  userId: string;
  vin: string;
  nickname: string | null;

  // Decoded VIN data
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  fuelType: string | null;
  bodyType: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;

  // User-entered data
  currentMileage: number | null;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  licensePlate: string | null;

  // Cached API data
  decodedData: VinDecodedData | null;
  safetyRatings: SafetyRatings | null;
  recallData: RecallData[] | null;
  lastRecallCheck: Date | null;

  // Status
  isPrimary: boolean;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleSummary {
  id: string;
  vin: string;
  nickname: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  currentMileage: number | null;
  isPrimary: boolean;
  hasActiveRecalls: boolean;
  recallCount: number;
  lastRecallCheck: Date | null;
}

export interface VinDecodedData {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  vehicleType: string;
  bodyClass: string;
  driveType: string;
  engineCylinders: number | null;
  engineDisplacementL: number | null;
  engineHP: number | null;
  fuelTypePrimary: string;
  transmissionStyle: string | null;
  transmissionSpeeds: number | null;
  manufacturerName: string;
  plantCity: string | null;
  plantState: string | null;
  plantCountry: string | null;
  gvwr: string | null;
  abs: boolean | null;
  airBagLocCurtain: string | null;
  airBagLocFront: string | null;
  airBagLocSide: string | null;
  blindSpotMon: boolean | null;
  forwardCollisionWarning: boolean | null;
  laneDepartureWarning: boolean | null;
  rearCrossTrafficAlert: boolean | null;
  // Raw NHTSA response stored for reference
  rawResponse: Record<string, unknown>;
}

export interface SafetyRatings {
  vehicleId: number;
  overallRating: number | null;
  overallFrontCrashRating: number | null;
  frontCrashDriversideRating: number | null;
  frontCrashPassengersideRating: number | null;
  overallSideCrashRating: number | null;
  sideCrashDriversideRating: number | null;
  sideCrashPassengersideRating: number | null;
  rolloverRating: number | null;
  rolloverPossibility: number | null;
  sidePoleCrashRating: number | null;
  complaintsCount: number | null;
  recallsCount: number | null;
  investigationsCount: number | null;
  nhtsa5StarSafetyRatings: string | null;
}

export interface RecallData {
  campaignNumber: string;
  recallDate: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  notes: string | null;
  manufacturer: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  userId: string;
  serviceType: string;
  description: string | null;
  serviceDate: Date;
  mileage: number | null;
  shopId: string | null;
  shopName: string | null;
  cost: number | null;
  partsUsed: PartUsed[];
  receiptUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartUsed {
  name: string;
  partNumber: string | null;
  cost: number | null;
}
