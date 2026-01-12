'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Stethoscope, Plus, Car, Camera, AlertTriangle, Clock, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useVehicles } from '@/hooks/useVehicles';
import { api } from '@/lib/api';
import { toast } from '@/stores/ui.store';
import { formatRelativeTime } from '@/lib/utils';

interface DiagnosticSession {
  id: string;
  vehicleId: string;
  vehicle?: {
    year: number;
    make: string;
    model: string;
    nickname?: string;
  };
  status: 'active' | 'completed' | 'archived';
  dtcCodes?: string[];
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DiagnosticsPage() {
  const { data: vehiclesData } = useVehicles();
  const [sessions, setSessions] = useState<DiagnosticSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [dtcCodes, setDtcCodes] = useState('');

  const vehicles = vehiclesData?.data || [];

  const startDiagnostic = async () => {
    if (!selectedVehicle) {
      toast.error('Select a vehicle', 'Please select a vehicle to diagnose.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await api.post<DiagnosticSession>('/diagnostics/sessions', {
        vehicleId: selectedVehicle,
        dtcCodes: dtcCodes
          .split(',')
          .map((code) => code.trim().toUpperCase())
          .filter(Boolean),
      });

      toast.success('Session started', 'Diagnostic session created successfully.');
      // Redirect to session detail page
      window.location.href = `/dashboard/diagnostics/${session.id}`;
    } catch (error) {
      toast.error('Error', 'Failed to create diagnostic session.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Diagnostics</h1>
        <p className="text-muted-foreground">
          Analyze diagnostic trouble codes and get repair recommendations
        </p>
      </div>

      {/* Start new diagnostic */}
      <Card>
        <CardHeader>
          <CardTitle>Start New Diagnostic</CardTitle>
          <CardDescription>
            Select a vehicle and enter any diagnostic trouble codes (DTCs) to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Car className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold">No vehicles found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Add a vehicle to your garage to start diagnostics.
              </p>
              <Button asChild>
                <Link href="/dashboard/garage/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Select Vehicle</Label>
                <div className="grid gap-2 md:grid-cols-3">
                  {vehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => setSelectedVehicle(vehicle.id)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        selectedVehicle === vehicle.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <Car className="h-5 w-5 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="font-medium">
                          {vehicle.nickname ||
                            `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dtc">Diagnostic Trouble Codes (Optional)</Label>
                <Input
                  id="dtc"
                  value={dtcCodes}
                  onChange={(e) => setDtcCodes(e.target.value)}
                  placeholder="P0300, P0420, P0171 (comma-separated)"
                />
                <p className="text-xs text-muted-foreground">
                  Enter any DTCs shown on your OBD scanner, or leave blank to describe symptoms
                </p>
              </div>

              <Button onClick={startDiagnostic} disabled={isLoading || !selectedVehicle}>
                {isLoading ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <Stethoscope className="mr-2 h-4 w-4" />
                )}
                Start Diagnostic
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick tips */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Enter DTC Codes</h3>
              <p className="text-sm text-muted-foreground">
                Get your codes from an OBD-II scanner or your vehicle's dashboard
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Camera className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Upload Photos</h3>
              <p className="text-sm text-muted-foreground">
                Share photos of warning lights or parts for visual diagnosis
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <Stethoscope className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Get Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                Receive detailed repair recommendations and cost estimates
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Common codes */}
      <Card>
        <CardHeader>
          <CardTitle>Common DTC Codes</CardTitle>
          <CardDescription>Quick reference for frequently seen codes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {[
              { code: 'P0300', desc: 'Random/Multiple Cylinder Misfire' },
              { code: 'P0420', desc: 'Catalyst System Efficiency Below Threshold' },
              { code: 'P0171', desc: 'System Too Lean (Bank 1)' },
              { code: 'P0128', desc: 'Coolant Thermostat Below Temperature' },
              { code: 'P0442', desc: 'EVAP System Small Leak Detected' },
              { code: 'P0500', desc: 'Vehicle Speed Sensor Malfunction' },
            ].map((item) => (
              <div
                key={item.code}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-mono font-semibold">{item.code}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
