import { Job, Worker } from 'bullmq';
import { Prisma } from '@prisma/client';

import { QUEUE_NAMES, emailQueue } from '../queues';
import { createRedisConnection } from '../lib/redis';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

// Type for vehicle with user included
type VehicleWithUser = Prisma.VehicleGetPayload<{ include: { user: true } }>;

// NHTSA Recalls API
const NHTSA_RECALLS_URL = 'https://api.nhtsa.gov/recalls/recallsByVehicle';

interface RecallData {
  Manufacturer: string;
  NHTSACampaignNumber: string;
  ReportReceivedDate: string;
  Component: string;
  Summary: string;
  Remedy: string;
}

interface RecallCheckJobData {
  vehicleId?: string; // If provided, check only this vehicle
  userId?: string; // If provided, check all vehicles for this user
  checkAll?: boolean; // If true, check all vehicles with recallNotifications enabled
}

async function fetchRecalls(make: string, model: string, year: number): Promise<RecallData[]> {
  const url = `${NHTSA_RECALLS_URL}?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NHTSA API error: ${response.status}`);
  }

  const responseData = await response.json() as { results?: RecallData[] };
  return responseData.results || [];
}

async function processRecallCheckJob(job: Job<RecallCheckJobData>): Promise<{ checked: number; alerts: number }> {
  const { data } = job;
  let vehicles: VehicleWithUser[] = [];

  logger.info('Processing recall check job', { jobId: job.id, data });

  if (data.vehicleId) {
    // Check specific vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      include: { user: true },
    });
    vehicles = vehicle ? [vehicle] : [];
  } else if (data.userId) {
    // Check all vehicles for a user
    vehicles = await prisma.vehicle.findMany({
      where: { userId: data.userId },
      include: { user: true },
    });
  } else if (data.checkAll) {
    // Check all vehicles with recall notifications enabled
    vehicles = await prisma.vehicle.findMany({
      where: {
        user: {
          preferences: {
            path: ['recallNotifications'],
            equals: true,
          },
        },
      },
      include: { user: true },
    });
  }
  // else: vehicles remains empty []

  let checkedCount = 0;
  let alertCount = 0;

  for (const vehicle of vehicles) {
    try {
      // Skip vehicles without complete make/model/year data
      if (!vehicle.make || !vehicle.model || !vehicle.year) {
        logger.debug('Skipping vehicle without complete data', { vehicleId: vehicle.id });
        continue;
      }

      // Fetch current recalls
      const recalls = await fetchRecalls(vehicle.make, vehicle.model, vehicle.year);

      if (recalls.length > 0) {
        // Get stored recalls for comparison
        const storedRecalls = (vehicle.recallData as any)?.recalls || [];
        const storedCampaignNumbers = new Set(storedRecalls.map((r: any) => r.campaignNumber));

        // Find new recalls
        const newRecalls = recalls.filter(
          (r) => !storedCampaignNumbers.has(r.NHTSACampaignNumber)
        );

        if (newRecalls.length > 0) {
          // Update vehicle with new recalls
          await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: {
              recallData: {
                recalls: recalls.map((r) => ({
                  campaignNumber: r.NHTSACampaignNumber,
                  component: r.Component,
                  summary: r.Summary,
                  remedy: r.Remedy,
                  reportedDate: r.ReportReceivedDate,
                  manufacturer: r.Manufacturer,
                })),
                lastChecked: new Date().toISOString(),
              },
            },
          });

          // Check user preferences before sending email
          const userPrefs = vehicle.user.preferences as any;
          if (userPrefs?.recallNotifications !== false && userPrefs?.emailNotifications !== false) {
            // Queue email notification
            await emailQueue.add('recall-alert', {
              type: 'recall-alert',
              email: vehicle.user.email,
              name: vehicle.user.fullName || 'Customer',
              vehicleInfo: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
              recallCount: newRecalls.length,
              recallSummaries: newRecalls.slice(0, 5).map((r) => `${r.Component}: ${r.Summary.substring(0, 150)}...`),
            });
            alertCount++;
          }
        }
      }

      // Update last checked timestamp even if no new recalls
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          recallData: {
            ...(vehicle.recallData as object || {}),
            lastChecked: new Date().toISOString(),
          },
        },
      });

      checkedCount++;

      // Rate limit NHTSA API calls
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      logger.error('Error checking recalls for vehicle', {
        vehicleId: vehicle.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logger.info('Recall check job completed', {
    jobId: job.id,
    checked: checkedCount,
    alerts: alertCount,
  });

  return { checked: checkedCount, alerts: alertCount };
}

export function createRecallCheckWorker(): Worker<RecallCheckJobData> {
  const worker = new Worker(QUEUE_NAMES.RECALL_CHECK, processRecallCheckJob, {
    connection: createRedisConnection(),
    concurrency: 2, // Limit concurrency due to API rate limits
    limiter: {
      max: 10,
      duration: 60000, // 10 jobs per minute
    },
  });

  worker.on('completed', (job, result) => {
    logger.info('Recall check job completed', { jobId: job.id, result });
  });

  worker.on('failed', (job, err) => {
    logger.error('Recall check job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
}
