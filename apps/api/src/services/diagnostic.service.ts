import type {
  DiagnosticSession,
  DiagnosticSessionWithVehicle,
  CreateDiagnosticInput,
  AiDiagnosticAnalysis,
  ImageAnalysisResult,
} from '@myautowhiz/shared';
import { DiagnosticStatus, UrgencyLevel } from '@myautowhiz/shared';

import { prisma, Prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

import { incrementImageAnalysisCount } from '../middleware/rateLimit';
import { openaiService } from './openai.service';

class DiagnosticService {
  async listDiagnostics(
    userId: string,
    options: {
      status?: keyof typeof DiagnosticStatus;
      vehicleId?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ diagnostics: DiagnosticSessionWithVehicle[]; total: number }> {
    const { status, vehicleId, page = 1, pageSize = 20 } = options;

    const where = {
      userId,
      ...(status && { status }),
      ...(vehicleId && { vehicleId }),
    };

    const [diagnostics, total] = await Promise.all([
      prisma.diagnosticSession.findMany({
        where,
        include: {
          vehicle: {
            select: { id: true, nickname: true, year: true, make: true, model: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.diagnosticSession.count({ where }),
    ]);

    return {
      diagnostics: diagnostics.map(this.mapToDiagnostic),
      total,
    };
  }

  async getDiagnostic(userId: string, diagnosticId: string): Promise<DiagnosticSessionWithVehicle> {
    const diagnostic = await prisma.diagnosticSession.findFirst({
      where: { id: diagnosticId, userId },
      include: {
        vehicle: {
          select: { id: true, nickname: true, year: true, make: true, model: true },
        },
      },
    });

    if (!diagnostic) {
      throw NotFoundError('Diagnostic session');
    }

    return this.mapToDiagnostic(diagnostic);
  }

  async createDiagnostic(
    userId: string,
    input: CreateDiagnosticInput
  ): Promise<DiagnosticSessionWithVehicle> {
    // Verify vehicle ownership if provided
    if (input.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: input.vehicleId, userId },
      });
      if (!vehicle) {
        throw ForbiddenError('Vehicle not found or not owned by user');
      }
    }

    const diagnostic = await prisma.diagnosticSession.create({
      data: {
        userId,
        vehicleId: input.vehicleId,
        symptoms: input.symptoms,
        obdCodes: input.obdCodes || [],
        status: DiagnosticStatus.OPEN,
      },
      include: {
        vehicle: {
          select: { id: true, nickname: true, year: true, make: true, model: true },
        },
      },
    });

    logger.info('Diagnostic session created', { userId, diagnosticId: diagnostic.id });

    return this.mapToDiagnostic(diagnostic);
  }

  async updateDiagnostic(
    userId: string,
    diagnosticId: string,
    input: {
      symptoms?: string[];
      obdCodes?: string[];
      status?: keyof typeof DiagnosticStatus;
    }
  ): Promise<DiagnosticSessionWithVehicle> {
    const diagnostic = await prisma.diagnosticSession.findFirst({
      where: { id: diagnosticId, userId },
    });

    if (!diagnostic) {
      throw NotFoundError('Diagnostic session');
    }

    const updated = await prisma.diagnosticSession.update({
      where: { id: diagnosticId },
      data: {
        symptoms: input.symptoms,
        obdCodes: input.obdCodes,
        status: input.status,
        resolvedAt: input.status === DiagnosticStatus.RESOLVED ? new Date() : undefined,
      },
      include: {
        vehicle: {
          select: { id: true, nickname: true, year: true, make: true, model: true },
        },
      },
    });

    return this.mapToDiagnostic(updated);
  }

  async addImage(
    userId: string,
    diagnosticId: string,
    imageUrl: string,
    description?: string
  ): Promise<DiagnosticSessionWithVehicle> {
    const diagnostic = await prisma.diagnosticSession.findFirst({
      where: { id: diagnosticId, userId },
    });

    if (!diagnostic) {
      throw NotFoundError('Diagnostic session');
    }

    // Analyze image with AI
    const analysisResult = await this.analyzeImage(userId, imageUrl, description);

    const images = ((diagnostic.images as unknown) as { url: string; description: string | null; analysisResult: ImageAnalysisResult | null; uploadedAt: Date }[]) || [];
    images.push({
      url: imageUrl,
      description: description || null,
      analysisResult,
      uploadedAt: new Date(),
    });

    const updated = await prisma.diagnosticSession.update({
      where: { id: diagnosticId },
      data: { images: JSON.parse(JSON.stringify(images)) },
      include: {
        vehicle: {
          select: { id: true, nickname: true, year: true, make: true, model: true },
        },
      },
    });

    logger.info('Diagnostic image added', { userId, diagnosticId, hasAnalysis: !!analysisResult });

    return this.mapToDiagnostic(updated);
  }

  async analyze(
    userId: string,
    diagnosticId: string
  ): Promise<DiagnosticSessionWithVehicle> {
    const diagnostic = await prisma.diagnosticSession.findFirst({
      where: { id: diagnosticId, userId },
      include: {
        vehicle: {
          select: { year: true, make: true, model: true, vin: true },
        },
      },
    });

    if (!diagnostic) {
      throw NotFoundError('Diagnostic session');
    }

    // Build analysis prompt
    const vehicleInfo = diagnostic.vehicle
      ? `${diagnostic.vehicle.year} ${diagnostic.vehicle.make} ${diagnostic.vehicle.model}`
      : 'Unknown vehicle';

    const symptoms = diagnostic.symptoms.join(', ');
    const obdCodes = diagnostic.obdCodes.length > 0
      ? `OBD codes: ${diagnostic.obdCodes.join(', ')}`
      : '';

    const prompt = `Please analyze the following vehicle diagnostic:

Vehicle: ${vehicleInfo}
Symptoms: ${symptoms}
${obdCodes}

Provide:
1. A summary of the likely issue
2. Possible causes ranked by likelihood
3. Diagnostic steps to confirm
4. Urgency level (low/medium/high/critical)
5. Any safety warnings

Respond in JSON format with: summary, possibleCauses, diagnosticSteps, urgency, safetyWarnings`;

    // Get AI analysis
    const response = await openaiService.chat(
      [{ role: 'user', content: prompt }],
      diagnostic.vehicle
        ? {
            year: diagnostic.vehicle.year || undefined,
            make: diagnostic.vehicle.make || undefined,
            model: diagnostic.vehicle.model || undefined,
            vin: diagnostic.vehicle.vin,
          }
        : undefined
    );

    // Parse AI response
    let aiAnalysis: AiDiagnosticAnalysis;
    try {
      // Try to extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        aiAnalysis = {
          summary: parsed.summary || response.content.substring(0, 500),
          possibleCauses: parsed.possibleCauses || [],
          diagnosticSteps: parsed.diagnosticSteps || [],
          urgency: parsed.urgency || 'medium',
          safetyWarnings: parsed.safetyWarnings || [],
          additionalInfo: null,
        };
      } else {
        // Fallback if no JSON found
        aiAnalysis = {
          summary: response.content.substring(0, 500),
          possibleCauses: [],
          diagnosticSteps: [],
          urgency: 'medium',
          safetyWarnings: [],
          additionalInfo: response.content,
        };
      }
    } catch {
      aiAnalysis = {
        summary: response.content.substring(0, 500),
        possibleCauses: [],
        diagnosticSteps: [],
        urgency: 'medium',
        safetyWarnings: [],
        additionalInfo: response.content,
      };
    }

    // Update diagnostic with analysis
    const updated = await prisma.diagnosticSession.update({
      where: { id: diagnosticId },
      data: {
        aiAnalysis: JSON.parse(JSON.stringify(aiAnalysis)),
        urgencyLevel: aiAnalysis.urgency,
        status: DiagnosticStatus.IN_PROGRESS,
      },
      include: {
        vehicle: {
          select: { id: true, nickname: true, year: true, make: true, model: true },
        },
      },
    });

    logger.info('Diagnostic analyzed', { userId, diagnosticId, urgency: aiAnalysis.urgency });

    return this.mapToDiagnostic(updated);
  }

  async resolveDiagnostic(
    userId: string,
    diagnosticId: string,
    resolution?: string,
    actualCost?: number
  ): Promise<DiagnosticSessionWithVehicle> {
    const diagnostic = await prisma.diagnosticSession.findFirst({
      where: { id: diagnosticId, userId },
    });

    if (!diagnostic) {
      throw NotFoundError('Diagnostic session');
    }

    const updated = await prisma.diagnosticSession.update({
      where: { id: diagnosticId },
      data: {
        status: DiagnosticStatus.RESOLVED,
        resolvedAt: new Date(),
        resolution,
        estimatedCosts: actualCost
          ? JSON.parse(JSON.stringify({ actual: actualCost }))
          : diagnostic.estimatedCosts ?? undefined,
      },
      include: {
        vehicle: {
          select: { id: true, nickname: true, year: true, make: true, model: true },
        },
      },
    });

    logger.info('Diagnostic resolved', { userId, diagnosticId });

    return this.mapToDiagnostic(updated);
  }

  async deleteDiagnostic(userId: string, diagnosticId: string): Promise<void> {
    const diagnostic = await prisma.diagnosticSession.findFirst({
      where: { id: diagnosticId, userId },
    });

    if (!diagnostic) {
      throw NotFoundError('Diagnostic session');
    }

    await prisma.diagnosticSession.delete({ where: { id: diagnosticId } });

    logger.info('Diagnostic deleted', { userId, diagnosticId });
  }

  async uploadImages(
    userId: string,
    diagnosticId: string,
    files: Express.Multer.File[]
  ): Promise<DiagnosticSessionWithVehicle> {
    const diagnostic = await prisma.diagnosticSession.findFirst({
      where: { id: diagnosticId, userId },
    });

    if (!diagnostic) {
      throw NotFoundError('Diagnostic session');
    }

    // Process each uploaded file
    const newImages: Array<{
      url: string;
      description: string | null;
      analysisResult: ImageAnalysisResult | null;
      uploadedAt: Date;
    }> = [];

    for (const file of files) {
      // In production, upload to S3/Cloud storage
      // For now, store base64 or reference
      const base64 = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64}`;

      // Analyze image
      const analysisResult = await this.analyzeImage(userId, dataUrl);

      newImages.push({
        url: dataUrl, // In production, this would be a cloud storage URL
        description: null,
        analysisResult,
        uploadedAt: new Date(),
      });
    }

    // Get existing images
    const existingImages = (diagnostic.images as unknown as typeof newImages) || [];

    // Update diagnostic with new images
    const updated = await prisma.diagnosticSession.update({
      where: { id: diagnosticId },
      data: { images: JSON.parse(JSON.stringify([...existingImages, ...newImages])) },
      include: {
        vehicle: {
          select: { id: true, nickname: true, year: true, make: true, model: true },
        },
      },
    });

    logger.info('Diagnostic images uploaded', { userId, diagnosticId, count: files.length });

    return this.mapToDiagnostic(updated);
  }

  private async analyzeImage(
    userId: string,
    imageUrl: string,
    description?: string
  ): Promise<ImageAnalysisResult | null> {
    try {
      await incrementImageAnalysisCount(userId);

      const result = await openaiService.analyzeImage(
        imageUrl,
        description || 'Analyze this vehicle image and identify any visible issues or concerns.'
      );

      return {
        description: result.description,
        identifiedIssues: result.issues,
        confidence: 0.8, // Default confidence
        recommendations: result.recommendations,
      };
    } catch (error) {
      logger.error('Image analysis failed', { userId, error });
      return null;
    }
  }

  private mapToDiagnostic(
    d: Awaited<ReturnType<typeof prisma.diagnosticSession.findFirst>> & {
      vehicle?: { id: string; nickname: string | null; year: number | null; make: string | null; model: string | null } | null;
    }
  ): DiagnosticSessionWithVehicle {
    return {
      id: d.id,
      userId: d.userId,
      vehicleId: d.vehicleId,
      symptoms: d.symptoms,
      obdCodes: d.obdCodes,
      images: (d.images as unknown) as DiagnosticSession['images'],
      aiAnalysis: d.aiAnalysis as DiagnosticSession['aiAnalysis'],
      suggestedRepairs: d.suggestedRepairs as DiagnosticSession['suggestedRepairs'],
      estimatedCosts: d.estimatedCosts as DiagnosticSession['estimatedCosts'],
      urgencyLevel: d.urgencyLevel as DiagnosticSession['urgencyLevel'],
      status: d.status,
      resolvedAt: d.resolvedAt,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      vehicle: d.vehicle || null,
    };
  }
}

export const diagnosticService = new DiagnosticService();
