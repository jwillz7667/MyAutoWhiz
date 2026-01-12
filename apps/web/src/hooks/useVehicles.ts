'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { Vehicle, VinDecodedData, RecallData, SafetyRatings, MaintenanceRecord } from '@myautowhiz/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Fetch all vehicles for the current user
export function useVehicles(page = 1, limit = 10) {
  return useQuery<PaginatedResponse<Vehicle>>({
    queryKey: ['vehicles', page, limit],
    queryFn: () =>
      api.get<PaginatedResponse<Vehicle>>('/vehicles', {
        params: { page, limit },
      }),
  });
}

// Fetch a single vehicle
export function useVehicle(id: string) {
  return useQuery<Vehicle>({
    queryKey: ['vehicle', id],
    queryFn: () => api.get<Vehicle>(`/vehicles/${id}`),
    enabled: !!id,
  });
}

// Fetch vehicle recalls
export function useVehicleRecalls(vehicleId: string) {
  return useQuery<RecallData[]>({
    queryKey: ['vehicle', vehicleId, 'recalls'],
    queryFn: () => api.get<RecallData[]>(`/vehicles/${vehicleId}/recalls`),
    enabled: !!vehicleId,
  });
}

// Fetch vehicle safety ratings
export function useVehicleSafety(vehicleId: string) {
  return useQuery<SafetyRatings>({
    queryKey: ['vehicle', vehicleId, 'safety'],
    queryFn: () => api.get<SafetyRatings>(`/vehicles/${vehicleId}/safety`),
    enabled: !!vehicleId,
  });
}

// Fetch vehicle maintenance records
export function useVehicleMaintenance(vehicleId: string) {
  return useQuery<MaintenanceRecord[]>({
    queryKey: ['vehicle', vehicleId, 'maintenance'],
    queryFn: () => api.get<MaintenanceRecord[]>(`/vehicles/${vehicleId}/maintenance`),
    enabled: !!vehicleId,
  });
}

// Create vehicle mutation
export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { vin: string; nickname?: string }) =>
      api.post<Vehicle>('/vehicles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

// Update vehicle mutation
export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> }) =>
      api.patch<Vehicle>(`/vehicles/${id}`, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.id] });
    },
  });
}

// Delete vehicle mutation
export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

// Add maintenance record
export function useAddMaintenanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vehicleId,
      data,
    }: {
      vehicleId: string;
      data: Omit<MaintenanceRecord, 'id' | 'createdAt'>;
    }) => api.post<MaintenanceRecord>(`/vehicles/${vehicleId}/maintenance`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['vehicle', variables.vehicleId, 'maintenance'],
      });
    },
  });
}

// VIN Decode
export function useDecodeVin() {
  return useMutation({
    mutationFn: (vin: string) =>
      api.post<VinDecodedData>('/vin/decode', { vin }),
  });
}

// VIN Recalls lookup
export function useVinRecalls(vin: string) {
  return useQuery<RecallData[]>({
    queryKey: ['vin', vin, 'recalls'],
    queryFn: () => api.get<RecallData[]>(`/vin/${vin}/recalls`),
    enabled: !!vin && vin.length === 17,
  });
}

// VIN Safety lookup
export function useVinSafety(vin: string) {
  return useQuery<SafetyRatings>({
    queryKey: ['vin', vin, 'safety'],
    queryFn: () => api.get<SafetyRatings>(`/vin/${vin}/safety`),
    enabled: !!vin && vin.length === 17,
  });
}
