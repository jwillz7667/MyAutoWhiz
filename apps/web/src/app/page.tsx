import Link from 'next/link';
import { Car, Search, Shield, MessageSquare, MapPin, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Search,
    title: 'VIN Decoder',
    description:
      'Instantly decode any VIN to get complete vehicle specifications, history, and market value.',
  },
  {
    icon: Shield,
    title: 'Recall Alerts',
    description:
      'Stay safe with real-time recall notifications and safety ratings from NHTSA.',
  },
  {
    icon: MessageSquare,
    title: 'AI Diagnostic',
    description:
      'Get instant repair advice from our AI. Send photos and descriptions for accurate diagnostics.',
  },
  {
    icon: MapPin,
    title: 'Shop Finder',
    description:
      'Find trusted repair shops near you with ratings, reviews, and price estimates.',
  },
];

const pricing = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for occasional use',
    features: ['5 VIN lookups/month', '10 AI questions/month', '1 vehicle', 'Basic shop search'],
  },
  {
    name: 'Pro',
    price: '$9.99',
    description: 'For car enthusiasts',
    features: [
      '50 VIN lookups/month',
      '100 AI questions/month',
      '5 vehicles',
      'Advanced diagnostics',
      'Recall monitoring',
      'Priority support',
    ],
    popular: true,
  },
  {
    name: 'Family',
    price: '$19.99',
    description: 'For the whole family',
    features: [
      'Unlimited VIN lookups',
      '500 AI questions/month',
      '15 vehicles',
      'All Pro features',
      'Family sharing',
    ],
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="font-bold">MyAutoWhiz</span>
          </Link>

          <nav className="hidden space-x-6 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/vin" className="text-sm text-muted-foreground hover:text-foreground">
              VIN Lookup
            </Link>
          </nav>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-6 py-24 text-center md:py-32">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
          <span className="mr-2">🚗</span>
          <span>AI-Powered Vehicle Intelligence</span>
        </div>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Know Everything About{' '}
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Your Vehicle
          </span>
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Decode VINs, check recalls, get AI-powered repair advice, and find trusted shops. All in one place.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/register">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/vin">Try VIN Lookup</Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          No credit card required. Start with our free tier.
        </p>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Comprehensive tools to keep your vehicles running safely and efficiently.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="relative overflow-hidden">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {pricing.map((plan) => (
            <Card
              key={plan.name}
              className={plan.popular ? 'relative border-primary shadow-lg' : ''}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== '$0' && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm">
                      <svg
                        className="mr-2 h-4 w-4 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
            Join thousands of car owners who trust MyAutoWhiz to keep their vehicles safe and well-maintained.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2">
            <Car className="h-5 w-5 text-primary" />
            <span className="font-semibold">MyAutoWhiz</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MyAutoWhiz. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
