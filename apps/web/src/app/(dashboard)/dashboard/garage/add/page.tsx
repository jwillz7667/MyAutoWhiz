'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Search, Car, Check, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useDecodeVin, useCreateVehicle } from '@/hooks/useVehicles';
import { toast } from '@/stores/ui.store';
import type { VinDecodedData } from '@myautowhiz/shared';

const vinSchema = z.object({
  vin: z
    .string()
    .length(17, 'VIN must be exactly 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]+$/i, 'Invalid VIN format'),
  nickname: z.string().optional(),
});

type VinForm = z.infer<typeof vinSchema>;

export default function AddVehiclePage() {
  const router = useRouter();
  const decodeVin = useDecodeVin();
  const createVehicle = useCreateVehicle();

  const [decodedData, setDecodedData] = useState<VinDecodedData | null>(null);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<VinForm>({
    resolver: zodResolver(vinSchema),
  });

  const vinValue = watch('vin');

  const handleDecode = async (data: VinForm) => {
    try {
      const result = await decodeVin.mutateAsync(data.vin.toUpperCase());
      setDecodedData(result);
      setStep('confirm');
    } catch (error) {
      toast.error('VIN decode failed', 'Please check the VIN and try again.');
    }
  };

  const handleConfirm = async (data: VinForm) => {
    if (!decodedData) return;

    try {
      await createVehicle.mutateAsync({
        vin: data.vin.toUpperCase(),
        nickname: data.nickname || undefined,
      });

      toast.success('Vehicle added!', `${decodedData.year} ${decodedData.make} ${decodedData.model} has been added to your garage.`);
      router.push('/dashboard/garage');
    } catch (error) {
      toast.error('Failed to add vehicle', 'Please try again.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/garage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Vehicle</h1>
          <p className="text-muted-foreground">Enter your vehicle's VIN to add it to your garage</p>
        </div>
      </div>

      {step === 'enter' ? (
        <Card>
          <CardHeader>
            <CardTitle>Enter VIN</CardTitle>
            <CardDescription>
              The Vehicle Identification Number (VIN) is a 17-character code found on your dashboard or driver's door jamb.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleDecode)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vin">VIN</Label>
                <div className="relative">
                  <Input
                    id="vin"
                    placeholder="Enter 17-character VIN"
                    className="uppercase"
                    maxLength={17}
                    {...register('vin')}
                  />
                  {vinValue?.length === 17 && !errors.vin && (
                    <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {errors.vin && (
                  <p className="text-sm text-destructive">{errors.vin.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {vinValue?.length || 0}/17 characters
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={decodeVin.isPending}>
                {decodeVin.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Decoding VIN...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Decode VIN
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : decodedData ? (
        <form onSubmit={handleSubmit(handleConfirm)} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
              <CardDescription>Please confirm the vehicle information below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">
                    {decodedData.year} {decodedData.make} {decodedData.model}
                  </p>
                  <p className="text-sm text-muted-foreground">{decodedData.trim || 'Base'}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">VIN</p>
                  <p className="font-mono text-sm">{vinValue?.toUpperCase()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Body Style</p>
                  <p className="text-sm">{decodedData.bodyClass || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Engine</p>
                  <p className="text-sm">
                    {decodedData.engineDisplacementL
                      ? `${decodedData.engineDisplacementL}L ${decodedData.engineCylinders ? `${decodedData.engineCylinders}cyl` : ''} ${decodedData.engineHP ? `${decodedData.engineHP}HP` : ''}`.trim()
                      : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Transmission</p>
                  <p className="text-sm">{decodedData.transmissionStyle || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Drive Type</p>
                  <p className="text-sm">{decodedData.driveType || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fuel Type</p>
                  <p className="text-sm">{decodedData.fuelTypePrimary || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nickname (Optional)</CardTitle>
              <CardDescription>Give your vehicle a nickname for easy identification</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="e.g., 'Daily Driver', 'Family Car'"
                {...register('nickname')}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setStep('enter');
                setDecodedData(null);
              }}
            >
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={createVehicle.isPending}>
              {createVehicle.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Adding...
                </>
              ) : (
                'Add to Garage'
              )}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
