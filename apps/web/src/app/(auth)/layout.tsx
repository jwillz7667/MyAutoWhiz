import Link from 'next/link';
import { Car } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2">
          <Car className="h-8 w-8" />
          <span className="text-xl font-bold">MyAutoWhiz</span>
        </Link>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold">
            Your AI-Powered Vehicle Intelligence Platform
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Decode VINs, check recalls, get AI-powered repair advice, and find trusted shops. All in one place.
          </p>
        </div>

        <p className="text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} MyAutoWhiz. All rights reserved.
        </p>
      </div>

      {/* Right side - auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link
            href="/"
            className="flex items-center gap-2 mb-8 lg:hidden"
          >
            <Car className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">MyAutoWhiz</span>
          </Link>

          {children}
        </div>
      </div>
    </div>
  );
}
