import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import type { SubscriptionTierType } from '@myautowhiz/shared';

import { TokenExpiredError, UnauthorizedError } from './errors';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  subscriptionTier: SubscriptionTierType;
  emailVerified: boolean;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'development-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export function generateAccessToken(payload: AccessTokenPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'myautowhiz',
    audience: 'myautowhiz-api',
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function generateRefreshToken(userId: string): { token: string; tokenId: string } {
  const tokenId = uuidv4();
  const options: jwt.SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'myautowhiz',
    audience: 'myautowhiz-api',
  };
  const token = jwt.sign({ userId, tokenId } as RefreshTokenPayload, JWT_REFRESH_SECRET, options);

  return { token, tokenId };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'myautowhiz',
      audience: 'myautowhiz-api',
    }) as AccessTokenPayload;

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw TokenExpiredError();
    }
    throw UnauthorizedError('Invalid access token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'myautowhiz',
      audience: 'myautowhiz-api',
    }) as RefreshTokenPayload;

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw TokenExpiredError();
    }
    throw UnauthorizedError('Invalid refresh token');
  }
}

export function decodeToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.decode(token) as AccessTokenPayload | null;
    return decoded;
  } catch {
    return null;
  }
}

export function getAccessTokenExpiresIn(): number {
  // Parse duration string to seconds
  const match = ACCESS_TOKEN_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // Default 15 minutes

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 900;
  }
}

export function getRefreshTokenExpiresAt(): Date {
  const match = REFRESH_TOKEN_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  let ms: number;
  switch (unit) {
    case 's':
      ms = value * 1000;
      break;
    case 'm':
      ms = value * 60 * 1000;
      break;
    case 'h':
      ms = value * 3600 * 1000;
      break;
    case 'd':
      ms = value * 86400 * 1000;
      break;
    default:
      ms = 30 * 24 * 60 * 60 * 1000;
  }

  return new Date(Date.now() + ms);
}
