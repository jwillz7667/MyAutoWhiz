'use client';

import Link from 'next/link';
import { Car, MessageSquare, Stethoscope, MapPin, Plus, AlertTriangle, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import { useVehicles } from '@/hooks/useVehicles';
import { Spinner } from '@/components/ui/spinner';
import { formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: vehiclesData, isLoading } = useVehicles();

  const vehicles = vehiclesData?.data || [];

  // Usage stats would typically come from a separate API endpoint
  const usageStats = {
    questionsAsked: 0,
    vinLookups: 0,
    diagnosticSessions: 0,
  };

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.fullName?.split(' ')[0] || 'there'}!</h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your vehicles and recent activity.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <p className="text-xs text-muted-foreground">
              {user?.subscriptionTier === 'FREE' ? 'of 1 allowed' : `in your garage`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.questionsAsked}</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIN Lookups</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.vinLookups}</div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diagnostics</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.diagnosticSessions}</div>
            <p className="text-xs text-muted-foreground">sessions started</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer transition-colors hover:bg-accent">
          <Link href="/dashboard/garage/add">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Add Vehicle</p>
                <p className="text-sm text-muted-foreground">Add by VIN</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-accent">
          <Link href="/dashboard/chat">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">AI Chat</p>
                <p className="text-sm text-muted-foreground">Ask anything</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-accent">
          <Link href="/dashboard/diagnostics">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                <Stethoscope className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">Diagnostics</p>
                <p className="text-sm text-muted-foreground">Diagnose issues</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-accent">
          <Link href="/dashboard/shops">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <MapPin className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Find Shops</p>
                <p className="text-sm text-muted-foreground">Near you</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* My vehicles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Vehicles</CardTitle>
            <CardDescription>Your saved vehicles</CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/garage/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center">
              <Car className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No vehicles yet</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/dashboard/garage/add">Add your first vehicle</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicles.slice(0, 3).map((vehicle) => (
                <Link
                  key={vehicle.id}
                  href={`/dashboard/garage/${vehicle.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Car className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        VIN: {vehicle.vin?.slice(-8)}
                      </p>
                    </div>
                  </div>
                  {vehicle.recallData && (vehicle.recallData as any)?.recalls?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-orange-500">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{(vehicle.recallData as any).recalls.length} recalls</span>
                    </div>
                  )}
                </Link>
              ))}
              {vehicles.length > 3 && (
                <Button asChild variant="link" className="w-full">
                  <Link href="/dashboard/garage">View all {vehicles.length} vehicles</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
