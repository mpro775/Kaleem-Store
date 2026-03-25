'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  getCustomerData,
  clearAuthStorage,
  type CustomerData,
} from './customer-auth-storage';
import * as customerClient from './customer-client';

interface CustomerAuthContextType {
  customer: CustomerData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: { phoneOrEmail: string; password: string }) => Promise<void>;
  register: (input: { fullName: string; phone: string; email?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    const saved = getCustomerData();
    if (!saved) {
      setCustomer(null);
      setIsLoading(false);
      return;
    }

    try {
      const result = await customerClient.customerRefresh();
      if (result) {
        setCustomer(result.customer);
      } else {
        setCustomer(null);
      }
    } catch {
      clearAuthStorage();
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(async (input: { phoneOrEmail: string; password: string }) => {
    const result = await customerClient.customerLogin(input);
    setCustomer(result.customer);
  }, []);

  const register = useCallback(async (input: { fullName: string; phone: string; email?: string; password: string }) => {
    const result = await customerClient.customerRegister(input);
    setCustomer(result.customer);
  }, []);

  const logout = useCallback(async () => {
    await customerClient.customerLogout();
    setCustomer(null);
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isLoading,
        isAuthenticated: !!customer,
        login,
        register,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth(): CustomerAuthContextType {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  }
  return context;
}
