'use client';

import { useAuth } from '@clerk/nextjs';
import { createAxiosInstance } from '@/lib/axios';

export function useApi() {
  const { getToken } = useAuth();

  const api = async () => {
    const token = await getToken();
    return createAxiosInstance(token);
  };

  return { api };
}