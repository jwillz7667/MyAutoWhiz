import type {
  Vehicle,
  VehicleSummary,
  MaintenanceRecord,
  AddVehicleInput,
  UpdateVehicleInput,
  AddMaintenanceRecordInput,
} from '@myautowhiz/shared';
import { UsageLimits } from '@myautowhiz/shared';

import { prisma, Prisma } from '../lib/prisma';
import {
  VehicleNotFoundError,
  VehicleLimitReachedError,
  ValidationError,
  NotFoundError,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { isValidVin } from '../utils/vin';

import { nhtsaService } from './nhtsa.service';

class VehicleService {
  async listVehicles(
    userId: string,
    includeInactive = false
  ): Promise<{ vehicles: VehicleSummary[]; count: number; limit: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    const limit = UsageLimits.vehiclesInGarage[(user?.subscriptionTier || 'FREE') as keyof typeof UsageLimits.vehiclesInGarage];

    const vehicles = await prisma.vehicle.findMany({
      where: {
        userId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    const summaries: VehicleSummary[] = vehicles.map((v: (typeof vehicles)[number]) => ({
      id: v.id,
      vin: v.vin,
      nickname: v.nickname,
      year: v.year,
      make: v.make,
      model: v.model,
      trim: v.trim,
      currentMileage: v.currentMileage,
      isPrimary: v.isPrimary,
      hasActiveRecalls: Array.isArray(v.recallData) && v.recallData.length > 0,
      recallCount: Array.isArray(v.recallData) ? v.recallData.length : 0,
      lastRecallCheck: v.lastRecallCheck,
    }));

    return {
      vehicles: summaries,
      count: vehicles.length,
      limit: limit === -1 ? Infinity : limit,
    };
  }

  async getVehicle(userId: string, vehicleId: string): Promise<Vehicle> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });

    if (!vehicle) {
      throw VehicleNotFoundError();
    }

    return this.mapToVehicle(vehicle);
  }

  async addVehicle(userId: string, input: AddVehicleInput): Promise<Vehicle> {
    // Validate VIN
    if (!isValidVin(input.vin)) {
      throw ValidationError('Invalid VIN format');
    }

    const vin = input.vin.toUpperCase();

    // Check vehicle limit
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    const limit = UsageLimits.vehiclesInGarage[(user?.subscriptionTier || 'FREE') as keyof typeof UsageLimits.vehiclesInGarage];

    if (limit !== -1) {
      const currentCount = await prisma.vehicle.count({
        where: { userId, isActive: true },
      });

      if (currentCount >= limit) {
        throw VehicleLimitReachedError(limit);
      }
    }

    // Check for duplicate
    const existing = await prisma.vehicle.findFirst({
      where: { userId, vin },
    });

    if (existing) {
      if (existing.isActive) {
        throw ValidationError('This vehicle is already in your garage');
      }
      // Reactivate if previously removed
      const reactivated = await prisma.vehicle.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          nickname: input.nickname || existing.nickname,
          currentMileage: input.currentMileage ?? existing.currentMileage,
          purchaseDate: input.purchaseDate,
          purchasePrice: input.purchasePrice,
          licensePlate: input.licensePlate,
          exteriorColor: input.exteriorColor,
          interiorColor: input.interiorColor,
        },
      });
      return this.mapToVehicle(reactivated);
    }

    // Decode VIN
    const decoded = await nhtsaService.decodeVin(vin);

    // Get safety ratings
    let safetyRatings = null;
    if (decoded.year && decoded.make && decoded.model) {
      safetyRatings = await nhtsaService.getSafetyRatings(
        decoded.year,
        decoded.make,
        decoded.model
      );
    }

    // Get recalls
    let recalls: unknown[] = [];
    if (decoded.year && decoded.make && decoded.model) {
      recalls = await nhtsaService.getRecalls(decoded.year, decoded.make, decoded.model);
    }

    // Check if this should be primary (first vehicle)
    const vehicleCount = await prisma.vehicle.count({
      where: { userId, isActive: true },
    });
    const isPrimary = vehicleCount === 0;

    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        userId,
        vin,
        nickname: input.nickname,
        year: decoded.year,
        make: decoded.make,
        model: decoded.model,
        trim: decoded.trim,
        engine: `${decoded.engineDisplacementL || ''}L ${decoded.engineCylinders || ''}-cyl ${decoded.engineHP || ''}hp`.trim(),
        transmission: decoded.transmissionStyle,
        drivetrain: decoded.driveType,
        fuelType: decoded.fuelTypePrimary,
        bodyType: decoded.bodyClass,
        exteriorColor: input.exteriorColor,
        interiorColor: input.interiorColor,
        currentMileage: input.currentMileage,
        purchaseDate: input.purchaseDate,
        purchasePrice: input.purchasePrice,
        licensePlate: input.licensePlate,
        decodedData: JSON.parse(JSON.stringify(decoded)),
        safetyRatings: safetyRatings ? JSON.parse(JSON.stringify(safetyRatings)) : null,
        recallData: JSON.parse(JSON.stringify(recalls)),
        lastRecallCheck: new Date(),
        isPrimary,
      },
    });

    logger.info('Vehicle added', {
      userId,
      vehicleId: vehicle.id,
      vin,
      make: decoded.make,
      model: decoded.model,
    });

    return this.mapToVehicle(vehicle);
  }

  async updateVehicle(
    userId: string,
    vehicleId: string,
    input: UpdateVehicleInput
  ): Promise<Vehicle> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });

    if (!vehicle) {
      throw VehicleNotFoundError();
    }

    // Handle primary flag change
    if (input.isPrimary === true && !vehicle.isPrimary) {
      // Remove primary from other vehicles
      await prisma.vehicle.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        nickname: input.nickname,
        currentMileage: input.currentMileage,
        purchaseDate: input.purchaseDate,
        purchasePrice: input.purchasePrice,
        licensePlate: input.licensePlate,
        exteriorColor: input.exteriorColor,
        interiorColor: input.interiorColor,
        isPrimary: input.isPrimary,
      },
    });

    logger.info('Vehicle updated', { userId, vehicleId });

    return this.mapToVehicle(updated);
  }

  async deleteVehicle(userId: string, vehicleId: string): Promise<void> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });

    if (!vehicle) {
      throw VehicleNotFoundError();
    }

    // Soft delete
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { isActive: false },
    });

    // If was primary, assign new primary
    if (vehicle.isPrimary) {
      const nextVehicle = await prisma.vehicle.findFirst({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      if (nextVehicle) {
        await prisma.vehicle.update({
          where: { id: nextVehicle.id },
          data: { isPrimary: true },
        });
      }
    }

    logger.info('Vehicle removed', { userId, vehicleId });
  }

  async refreshRecalls(userId: string, vehicleId: string): Promise<Vehicle> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });

    if (!vehicle || !vehicle.year || !vehicle.make || !vehicle.model) {
      throw VehicleNotFoundError();
    }

    const recalls = await nhtsaService.getRecalls(vehicle.year, vehicle.make, vehicle.model);

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        recallData: JSON.parse(JSON.stringify(recalls)),
        lastRecallCheck: new Date(),
      },
    });

    logger.info('Recalls refreshed', { userId, vehicleId, recallCount: recalls.length });

    return this.mapToVehicle(updated);
  }

  // Maintenance records
  async getMaintenanceRecords(
    userId: string,
    vehicleId: string
  ): Promise<MaintenanceRecord[]> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });

    if (!vehicle) {
      throw VehicleNotFoundError();
    }

    const records = await prisma.maintenanceRecord.findMany({
      where: { vehicleId },
      orderBy: { serviceDate: 'desc' },
      include: {
        shop: {
          select: { name: true },
        },
      },
    });

    return records.map((r: (typeof records)[number]) => ({
      id: r.id,
      vehicleId: r.vehicleId,
      userId: r.userId,
      serviceType: r.serviceType,
      description: r.description,
      serviceDate: r.serviceDate,
      mileage: r.mileage,
      shopId: r.shopId,
      shopName: r.shop?.name || r.shopName,
      cost: r.cost ? Number(r.cost) : null,
      partsUsed: (r.partsUsed as unknown) as MaintenanceRecord['partsUsed'],
      receiptUrl: r.receiptUrl,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async addMaintenanceRecord(
    userId: string,
    vehicleId: string,
    input: AddMaintenanceRecordInput
  ): Promise<MaintenanceRecord> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });

    if (!vehicle) {
      throw VehicleNotFoundError();
    }

    const record = await prisma.maintenanceRecord.create({
      data: {
        vehicleId,
        userId,
        serviceType: input.serviceType,
        description: input.description,
        serviceDate: input.serviceDate,
        mileage: input.mileage,
        shopId: input.shopId,
        shopName: input.shopName,
        cost: input.cost,
        partsUsed: input.partsUsed || [],
        receiptUrl: input.receiptUrl,
        notes: input.notes,
      },
    });

    // Update vehicle mileage if newer
    if (input.mileage && (!vehicle.currentMileage || input.mileage > vehicle.currentMileage)) {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { currentMileage: input.mileage },
      });
    }

    logger.info('Maintenance record added', { userId, vehicleId, recordId: record.id });

    return {
      id: record.id,
      vehicleId: record.vehicleId,
      userId: record.userId,
      serviceType: record.serviceType,
      description: record.description,
      serviceDate: record.serviceDate,
      mileage: record.mileage,
      shopId: record.shopId,
      shopName: record.shopName,
      cost: record.cost ? Number(record.cost) : null,
      partsUsed: (record.partsUsed as unknown) as MaintenanceRecord['partsUsed'],
      receiptUrl: record.receiptUrl,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async deleteMaintenanceRecord(
    userId: string,
    vehicleId: string,
    recordId: string
  ): Promise<void> {
    const record = await prisma.maintenanceRecord.findFirst({
      where: { id: recordId, vehicleId, userId },
    });

    if (!record) {
      throw NotFoundError('Maintenance record');
    }

    await prisma.maintenanceRecord.delete({ where: { id: recordId } });

    logger.info('Maintenance record deleted', { userId, vehicleId, recordId });
  }

  async getRecalls(userId: string, vehicleId: string): Promise<unknown[]> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });

    if (!vehicle) {
      throw VehicleNotFoundError();
    }

    // Return cached recalls or fetch new ones if stale
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (vehicle.lastRecallCheck && vehicle.lastRecallCheck > oneWeekAgo) {
      return (vehicle.recallData as unknown[]) || [];
    }

    // Fetch fresh data
    if (vehicle.year && vehicle.make && vehicle.model) {
      const recalls = await nhtsaService.getRecalls(vehicle.year, vehicle.make, vehicle.model);

      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          recallData: JSON.parse(JSON.stringify(recalls)),
          lastRecallCheck: new Date(),
        },
      });

      return recalls;
    }

    return [];
  }

  async getSafetyRatings(userId: string, vehicleId: string): Promise<unknown> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });

    if (!vehicle) {
      throw VehicleNotFoundError();
    }

    // Return cached ratings if available
    if (vehicle.safetyRatings) {
      return vehicle.safetyRatings;
    }

    // Fetch from NHTSA if we have the required info
    if (vehicle.year && vehicle.make && vehicle.model) {
      const ratings = await nhtsaService.getSafetyRatings(
        vehicle.year,
        vehicle.make,
        vehicle.model
      );

      if (ratings) {
        await prisma.vehicle.update({
          where: { id: vehicleId },
          data: { safetyRatings: JSON.parse(JSON.stringify(ratings)) },
        });

        return ratings;
      }
    }

    return null;
  }

  private mapToVehicle(
    v: Awaited<ReturnType<typeof prisma.vehicle.findFirst>> & object
  ): Vehicle {
    return {
      id: v.id,
      userId: v.userId,
      vin: v.vin,
      nickname: v.nickname,
      year: v.year,
      make: v.make,
      model: v.model,
      trim: v.trim,
      engine: v.engine,
      transmission: v.transmission,
      drivetrain: v.drivetrain,
      fuelType: v.fuelType,
      bodyType: v.bodyType,
      exteriorColor: v.exteriorColor,
      interiorColor: v.interiorColor,
      currentMileage: v.currentMileage,
      purchaseDate: v.purchaseDate,
      purchasePrice: v.purchasePrice ? Number(v.purchasePrice) : null,
      licensePlate: v.licensePlate,
      decodedData: v.decodedData as Vehicle['decodedData'],
      safetyRatings: v.safetyRatings as Vehicle['safetyRatings'],
      recallData: v.recallData as Vehicle['recallData'],
      lastRecallCheck: v.lastRecallCheck,
      isPrimary: v.isPrimary,
      isActive: v.isActive,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    };
  }
}

export const vehicleService = new VehicleService();
