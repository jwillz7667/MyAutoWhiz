import type { DiagnosticStatusType, UrgencyLevelType } from '../constants/api';

export interface DiagnosticSession {
  id: string;
  userId: string;
  vehicleId: string | null;
  symptoms: string[];
  obdCodes: string[];
  images: DiagnosticImage[];
  aiAnalysis: AiDiagnosticAnalysis | null;
  suggestedRepairs: SuggestedRepair[] | null;
  estimatedCosts: EstimatedCosts | null;
  urgencyLevel: UrgencyLevelType | null;
  status: DiagnosticStatusType;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiagnosticSessionWithVehicle extends DiagnosticSession {
  vehicle: {
    id: string;
    nickname: string | null;
    year: number | null;
    make: string | null;
    model: string | null;
  } | null;
}

export interface DiagnosticImage {
  url: string;
  description: string | null;
  analysisResult: ImageAnalysisResult | null;
  uploadedAt: Date;
}

export interface ImageAnalysisResult {
  description: string;
  identifiedIssues: string[];
  confidence: number;
  recommendations: string[];
}

export interface AiDiagnosticAnalysis {
  summary: string;
  possibleCauses: PossibleCause[];
  diagnosticSteps: DiagnosticStep[];
  urgency: UrgencyLevelType;
  safetyWarnings: string[];
  additionalInfo: string | null;
}

export interface PossibleCause {
  cause: string;
  likelihood: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface DiagnosticStep {
  stepNumber: number;
  title: string;
  description: string;
  expectedOutcome: string;
  tools: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'professional';
}

export interface SuggestedRepair {
  repair: string;
  description: string;
  estimatedCost: RepairCostEstimate;
  difficulty: 'diy' | 'intermediate' | 'professional';
  urgency: UrgencyLevelType;
  timeEstimate: string; // e.g., "1-2 hours"
  partsNeeded: string[];
}

export interface RepairCostEstimate {
  laborLow: number;
  laborHigh: number;
  partsLow: number;
  partsHigh: number;
  totalLow: number;
  totalHigh: number;
}

export interface EstimatedCosts {
  laborLow: number;
  laborHigh: number;
  partsLow: number;
  partsHigh: number;
}

export interface CreateDiagnosticRequest {
  vehicleId?: string;
  symptoms: string[];
  obdCodes?: string[];
  description?: string;
}

export interface AddDiagnosticImageRequest {
  imageUrl: string;
  description?: string;
}

export interface ObdCodeInfo {
  code: string;
  description: string;
  category: 'powertrain' | 'chassis' | 'body' | 'network';
  severity: 'critical' | 'warning' | 'info';
  possibleCauses: string[];
  suggestedActions: string[];
}
