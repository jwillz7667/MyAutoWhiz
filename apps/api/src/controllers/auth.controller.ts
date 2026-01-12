import type { Request, Response } from 'express';

import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  logoutSchema,
  changePasswordSchema,
} from '@myautowhiz/shared';

import { authService } from '../services';
import { catchAsync } from '../middleware/errorHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';

export const register = catchAsync(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  sendCreated(res, result);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login({
    ...input,
    deviceInfo: req.headers['user-agent'],
    ipAddress: req.ip,
  });
  sendSuccess(res, result);
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = refreshTokenSchema.parse(req.body);
  const result = await authService.refreshAccessToken(refreshToken);
  sendSuccess(res, result);
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const input = logoutSchema.parse(req.body);
  await authService.logout(req.user!.id, input.refreshToken, input.allDevices);
  sendNoContent(res);
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body);
  await authService.forgotPassword(email);
  sendSuccess(res, { message: 'If an account exists, a reset email has been sent' });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const input = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(input.token, input.newPassword);
  sendSuccess(res, { message: 'Password reset successfully' });
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = verifyEmailSchema.parse(req.body);
  await authService.verifyEmail(token);
  sendSuccess(res, { message: 'Email verified successfully' });
});

export const resendVerification = catchAsync(async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body);
  await authService.resendVerificationEmail(email);
  sendSuccess(res, { message: 'Verification email sent' });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const input = changePasswordSchema.parse(req.body);
  await authService.changePassword(req.user!.id, input.currentPassword, input.newPassword);
  sendSuccess(res, { message: 'Password changed successfully' });
});

export const initiateOAuth = catchAsync(async (req: Request, res: Response) => {
  const provider = req.path.includes('google') ? 'google' : 'apple';
  const redirectUrl = await authService.getOAuthRedirectUrl(provider);
  res.redirect(redirectUrl);
});

export const oauthCallback = catchAsync(async (req: Request, res: Response) => {
  const provider = req.path.includes('google') ? 'google' : 'apple';
  const { code, state } = req.query as { code: string; state: string };
  const result = await authService.handleOAuthCallback(provider, code, state);

  // Redirect to frontend with tokens
  const params = new URLSearchParams({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?${params.toString()}`);
});

export const getCurrentUser = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  sendSuccess(res, user);
});
