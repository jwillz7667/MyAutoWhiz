'use client';

import { useState } from 'react';
import { MapPin, Star, Phone, Globe, Navigation, Search, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { toast } from '@/stores/ui.store';

interface Shop {
  id: string;
  name: string;
  address: string;
  rating: number;
  totalRatings: number;
  phoneNumber?: string;
  website?: string;
  distance?: string;
  isOpen?: boolean;
  types: string[];
}

export default function ShopsPage() {
  const [location, setLocation] = useState('');
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchShops = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const result = await api.get<{ shops: Shop[] }>('/shops/search', {
        params: {
          location: location.trim(),
          type: 'auto_repair',
          radius: 10000,
        },
      });
      setShops(result.shops || []);
    } catch (error) {
      toast.error('Search failed', 'Failed to find repair shops. Please try again.');
      setShops([]);
    } finally {
      setIsLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocation(`${position.coords.latitude},${position.coords.longitude}`);
          setIsLoading(true);
          setHasSearched(true);

          try {
            const result = await api.get<{ shops: Shop[] }>('/shops/search', {
              params: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                type: 'auto_repair',
                radius: 10000,
              },
            });
            setShops(result.shops || []);
          } catch (error) {
            toast.error('Search failed', 'Failed to find nearby shops.');
            setShops([]);
          } finally {
            setIsLoading(false);
          }
        },
        () => {
          toast.error('Location error', 'Unable to get your location. Please enter an address.');
        }
      );
    } else {
      toast.error('Not supported', 'Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find Repair Shops</h1>
        <p className="text-muted-foreground">
          Search for trusted auto repair shops near you
        </p>
      </div>

      {/* Search form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={searchShops} className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter address, city, or ZIP code"
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" /> : <Search className="h-4 w-4" />}
            </Button>
            <Button type="button" variant="outline" onClick={useCurrentLocation}>
              <Navigation className="mr-2 h-4 w-4" />
              Use My Location
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : hasSearched && shops.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center text-center">
            <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No shops found</h3>
            <p className="text-muted-foreground">
              Try searching in a different area or expanding your search radius.
            </p>
          </CardContent>
        </Card>
      ) : shops.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {shops.map((shop) => (
            <Card key={shop.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{shop.name}</CardTitle>
                    <CardDescription>{shop.address}</CardDescription>
                  </div>
                  {shop.isOpen !== undefined && (
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        shop.isOpen
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {shop.isOpen ? 'Open' : 'Closed'}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(shop.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{shop.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({shop.totalRatings} reviews)
                  </span>
                </div>

                {/* Distance */}
                {shop.distance && (
                  <p className="text-sm text-muted-foreground">
                    <Navigation className="mr-1 inline-block h-4 w-4" />
                    {shop.distance} away
                  </p>
                )}

                {/* Contact buttons */}
                <div className="flex gap-2">
                  {shop.phoneNumber && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${shop.phoneNumber}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                      </a>
                    </Button>
                  )}
                  {shop.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={shop.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="mr-2 h-4 w-4" />
                        Website
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        shop.address
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Directions
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center text-center">
            <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Search for repair shops</h3>
            <p className="text-muted-foreground">
              Enter your location or use your current location to find trusted auto repair shops near you.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
