'use client';

import { useState } from 'react';
import { Check, CreditCard, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/ui.store';
import { api } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

const plans = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    description: 'Perfect for occasional use',
    features: [
      '5 VIN lookups/month',
      '10 AI questions/month',
      '1 vehicle',
      'Basic shop search',
      '30-day chat history',
    ],
    limits: {
      vinLookups: 5,
      questions: 10,
      vehicles: 1,
    },
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 9.99,
    description: 'For car enthusiasts',
    features: [
      '50 VIN lookups/month',
      '100 AI questions/month',
      '5 vehicles',
      'Advanced diagnostics',
      'Recall monitoring',
      'Priority support',
      '6-month chat history',
    ],
    limits: {
      vinLookups: 50,
      questions: 100,
      vehicles: 5,
    },
    popular: true,
  },
  {
    id: 'FAMILY',
    name: 'Family',
    price: 19.99,
    description: 'For the whole family',
    features: [
      'Unlimited VIN lookups',
      '500 AI questions/month',
      '15 vehicles',
      'All Pro features',
      'Family sharing',
      '6-month chat history',
    ],
    limits: {
      vinLookups: -1,
      questions: 500,
      vehicles: 15,
    },
  },
  {
    id: 'DEALER',
    name: 'Dealer',
    price: 99.99,
    description: 'For dealerships',
    features: [
      'Unlimited VIN lookups',
      'Unlimited AI questions',
      'Unlimited vehicles',
      'All Family features',
      'API access',
      'White-label reports',
      '1-year chat history',
      'Dedicated support',
    ],
    limits: {
      vinLookups: -1,
      questions: -1,
      vehicles: -1,
    },
  },
];

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const currentPlan = plans.find((p) => p.id === user?.subscriptionTier) || plans[0];

  const handleSubscribe = async (planId: string) => {
    if (planId === 'FREE') return;

    setIsLoading(planId);
    try {
      const result = await api.post<{ url: string }>('/subscriptions/checkout', {
        tier: planId,
        billingCycle,
        successUrl: `${window.location.origin}/dashboard/subscription?success=true`,
        cancelUrl: `${window.location.origin}/dashboard/subscription?canceled=true`,
      });

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error('Error', 'Failed to create checkout session. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading('manage');
    try {
      const result = await api.post<{ url: string }>('/subscriptions/portal', {
        returnUrl: `${window.location.origin}/dashboard/subscription`,
      });

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error('Error', 'Failed to open billing portal. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription plan</p>
      </div>

      {/* Current subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{currentPlan.name}</p>
              <p className="text-muted-foreground">{currentPlan.description}</p>
              {user?.subscriptionTier !== 'FREE' && user?.subscriptionStatus && (
                <p className="mt-2 text-sm">
                  Status:{' '}
                  <span
                    className={
                      user.subscriptionStatus === 'ACTIVE'
                        ? 'text-green-600'
                        : 'text-orange-600'
                    }
                  >
                    {user.subscriptionStatus.toLowerCase()}
                  </span>
                  {user.subscriptionEndsAt && (
                    <span className="text-muted-foreground">
                      {' '}
                      • Renews {formatDate(user.subscriptionEndsAt)}
                    </span>
                  )}
                </p>
              )}
            </div>
            {user?.subscriptionTier !== 'FREE' && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={isLoading === 'manage'}
              >
                {isLoading === 'manage' ? <Spinner size="sm" className="mr-2" /> : null}
                Manage Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant={billingCycle === 'monthly' ? 'default' : 'outline'}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </Button>
        <Button
          variant={billingCycle === 'yearly' ? 'default' : 'outline'}
          onClick={() => setBillingCycle('yearly')}
        >
          Yearly
          <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
            Save 20%
          </span>
        </Button>
      </div>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === user?.subscriptionTier;
          const price =
            billingCycle === 'yearly' ? plan.price * 12 * 0.8 : plan.price;

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative',
                plan.popular && 'border-primary shadow-lg',
                isCurrentPlan && 'bg-primary/5'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    <Zap className="h-3 w-3" />
                    Popular
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">
                        ${price.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm">
                      <Check className="mr-2 h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  disabled={
                    isCurrentPlan ||
                    (plan.id === 'FREE' && user?.subscriptionTier !== 'FREE') ||
                    isLoading === plan.id
                  }
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {isLoading === plan.id ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : null}
                  {isCurrentPlan
                    ? 'Current Plan'
                    : plan.id === 'FREE'
                    ? 'Free'
                    : 'Subscribe'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ or features comparison could go here */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Have questions about our plans or need a custom solution? Contact us at{' '}
            <a href="mailto:support@myautowhiz.com" className="text-primary hover:underline">
              support@myautowhiz.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
