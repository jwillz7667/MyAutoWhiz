'use client';

import Link from 'next/link';
import { Car, Plus, AlertTriangle, MoreVertical, Trash2, Edit, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useVehicles, useDeleteVehicle } from '@/hooks/useVehicles';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/stores/ui.store';

export default function GaragePage() {
  const { data: vehiclesData, isLoading } = useVehicles();
  const deleteVehicle = useDeleteVehicle();

  const vehicles = vehiclesData?.data || [];

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your garage?`)) {
      return;
    }

    try {
      await deleteVehicle.mutateAsync(id);
      toast.success('Vehicle removed', `${name} has been removed from your garage.`);
    } catch (error) {
      toast.error('Error', 'Failed to remove vehicle. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Garage</h1>
          <p className="text-muted-foreground">Manage your vehicles</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/garage/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center">
            <Car className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No vehicles yet</h3>
            <p className="mb-4 text-center text-muted-foreground">
              Add your first vehicle by entering its VIN to get started.
            </p>
            <Button asChild>
              <Link href="/dashboard/garage/add">
                <Plus className="mr-2 h-4 w-4" />
                Add Vehicle
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => {
            const recalls = (vehicle.recallData as any)?.recalls || [];
            const hasRecalls = recalls.length > 0;

            return (
              <Card key={vehicle.id} className="relative overflow-hidden">
                {hasRecalls && (
                  <div className="absolute right-0 top-0 rounded-bl-lg bg-orange-500 px-2 py-1 text-xs font-medium text-white">
                    {recalls.length} Recall{recalls.length > 1 ? 's' : ''}
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          VIN: ...{vehicle.vin?.slice(-8)}
                        </CardDescription>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/garage/${vehicle.id}`}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/garage/${vehicle.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            handleDelete(
                              vehicle.id,
                              vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                            )
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Year</span>
                      <span>{vehicle.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Make</span>
                      <span>{vehicle.make}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model</span>
                      <span>{vehicle.model}</span>
                    </div>
                    {vehicle.trim && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trim</span>
                        <span>{vehicle.trim}</span>
                      </div>
                    )}
                  </div>

                  {hasRecalls && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-2 text-sm dark:border-orange-900 dark:bg-orange-950">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-orange-700 dark:text-orange-400">
                        Active recalls detected
                      </span>
                    </div>
                  )}

                  <Button asChild className="mt-4 w-full" variant="outline">
                    <Link href={`/dashboard/garage/${vehicle.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
