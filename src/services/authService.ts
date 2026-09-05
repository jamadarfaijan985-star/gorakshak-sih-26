/**
 * INNOVX Auth Service
 * Handles login, register, current user, and logout.
 * Endpoints: /api/v1/auth/*
 */

import { apiClient, tokenStore } from './api';
import type { LoginRequest, LoginResponse, UserCreate, UserResponse } from '../types/api';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', credentials);
    tokenStore.set(response.access_token);
    return response;
  },

  async register(data: UserCreate): Promise<UserResponse> {
    return apiClient.post<UserResponse>('/api/v1/auth/register', data);
  },

  async getCurrentUser(): Promise<UserResponse> {
    return apiClient.get<UserResponse>('/api/v1/auth/me');
  },

  logout(): void {
    tokenStore.clear();
  },

  isAuthenticated(): boolean {
    return !!tokenStore.get();
  },
};
