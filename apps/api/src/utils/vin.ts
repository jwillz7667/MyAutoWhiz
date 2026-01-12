// VIN validation and utilities

const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
};

export function isValidVin(vin: string): boolean {
  // Check length
  if (vin.length !== 17) {
    return false;
  }

  // Uppercase
  const upperVin = vin.toUpperCase();

  // Check for invalid characters (I, O, Q are not allowed)
  if (/[IOQ]/.test(upperVin)) {
    return false;
  }

  // Check all characters are alphanumeric
  if (!/^[A-HJ-NPR-Z0-9]+$/.test(upperVin)) {
    return false;
  }

  // Validate check digit (9th position)
  const checkDigit = calculateCheckDigit(upperVin);
  const actualCheckDigit = upperVin[8];

  if (checkDigit === 'X') {
    return actualCheckDigit === 'X';
  }

  return checkDigit === actualCheckDigit;
}

function calculateCheckDigit(vin: string): string {
  let sum = 0;

  for (let i = 0; i < 17; i++) {
    if (i === 8) continue; // Skip check digit position

    const char = vin[i];
    const value = VIN_TRANSLITERATION[char];
    const weight = VIN_WEIGHTS[i];

    sum += value * weight;
  }

  const remainder = sum % 11;

  if (remainder === 10) {
    return 'X';
  }

  return remainder.toString();
}

export function parseVin(vin: string): {
  wmi: string; // World Manufacturer Identifier (positions 1-3)
  vds: string; // Vehicle Descriptor Section (positions 4-9)
  vis: string; // Vehicle Identifier Section (positions 10-17)
  checkDigit: string;
  modelYear: string;
  plantCode: string;
  serialNumber: string;
} {
  const upperVin = vin.toUpperCase();

  return {
    wmi: upperVin.substring(0, 3),
    vds: upperVin.substring(3, 9),
    vis: upperVin.substring(9, 17),
    checkDigit: upperVin[8],
    modelYear: upperVin[9],
    plantCode: upperVin[10],
    serialNumber: upperVin.substring(11, 17),
  };
}

// Model year codes (position 10)
const MODEL_YEAR_CODES: Record<string, number> = {
  A: 2010,
  B: 2011,
  C: 2012,
  D: 2013,
  E: 2014,
  F: 2015,
  G: 2016,
  H: 2017,
  J: 2018,
  K: 2019,
  L: 2020,
  M: 2021,
  N: 2022,
  P: 2023,
  R: 2024,
  S: 2025,
  T: 2026,
  V: 2027,
  W: 2028,
  X: 2029,
  Y: 2030,
  '1': 2031,
  '2': 2032,
  '3': 2033,
  '4': 2034,
  '5': 2035,
  '6': 2036,
  '7': 2037,
  '8': 2038,
  '9': 2039,
};

export function getModelYearFromVin(vin: string): number | null {
  if (vin.length < 10) return null;
  const yearCode = vin[9].toUpperCase();
  return MODEL_YEAR_CODES[yearCode] || null;
}

// Common WMI prefixes for major manufacturers
export const MANUFACTURER_WMI: Record<string, string> = {
  '1G1': 'Chevrolet',
  '1G2': 'Pontiac',
  '1GC': 'Chevrolet Truck',
  '1GT': 'GMC Truck',
  '1HG': 'Honda',
  '1J4': 'Jeep',
  '1FA': 'Ford',
  '1FB': 'Ford',
  '1FC': 'Ford',
  '1FD': 'Ford',
  '1FM': 'Ford',
  '1FT': 'Ford Truck',
  '1N4': 'Nissan',
  '2G1': 'Chevrolet',
  '2HG': 'Honda',
  '2T1': 'Toyota',
  '3FA': 'Ford Mexico',
  '3VW': 'Volkswagen Mexico',
  '4T1': 'Toyota',
  '5FN': 'Honda',
  '5NP': 'Hyundai',
  '5TD': 'Toyota',
  '5YJ': 'Tesla',
  JH4: 'Acura',
  JHM: 'Honda',
  JN1: 'Nissan',
  JT2: 'Toyota',
  JTD: 'Toyota',
  JTE: 'Toyota',
  KM8: 'Hyundai',
  KNA: 'Kia',
  SAJ: 'Jaguar',
  SAL: 'Land Rover',
  SCC: 'Lotus',
  SFZ: 'Ferrari',
  WAU: 'Audi',
  WBA: 'BMW',
  WBS: 'BMW M',
  WDB: 'Mercedes-Benz',
  WDD: 'Mercedes-Benz',
  WF0: 'Ford Europe',
  WP0: 'Porsche',
  WVW: 'Volkswagen',
  YV1: 'Volvo',
  ZAM: 'Maserati',
  ZFA: 'Fiat',
  ZFF: 'Ferrari',
};

export function getManufacturerFromVin(vin: string): string | null {
  if (vin.length < 3) return null;
  const wmi = vin.substring(0, 3).toUpperCase();
  return MANUFACTURER_WMI[wmi] || null;
}
