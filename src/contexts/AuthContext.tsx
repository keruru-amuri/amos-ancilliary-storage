import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// User type matching what the API returns
export interface User {
  email: string;
  displayName: string;
  userId: string;
  identityProvider: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: true,
    error: null
  });

  const fetchUser = async () => {
    try {
      // First try the SWA built-in auth endpoint
      const swaResponse = await fetch('/.auth/me');
      
      if (swaResponse.ok) {
        const swaData = await swaResponse.json();
        
        if (swaData.clientPrincipal) {
          // User is authenticated via SWA
          const principal = swaData.clientPrincipal;
          
          // Now get additional info from our API (admin status)
          try {
            const apiResponse = await fetch('/api/auth/me');
            if (apiResponse.ok) {
              const apiData = await apiResponse.json();
              
              setState({
                user: apiData.user || {
                  email: principal.userDetails,
                  displayName: principal.userDetails,
                  userId: principal.userId,
                  identityProvider: principal.identityProvider
                },
                isAuthenticated: true,
                isAdmin: apiData.isAdmin || false,
                loading: false,
                error: null
              });
              return;
            }
          } catch (apiError) {
            // API call failed, but user is still authenticated via SWA
            console.warn('Failed to get API auth info:', apiError);
          }
          
          // Fallback: use SWA data only
          setState({
            user: {
              email: principal.userDetails,
              displayName: principal.userDetails,
              userId: principal.userId,
              identityProvider: principal.identityProvider
            },
            isAuthenticated: true,
            isAdmin: false,
            loading: false,
            error: null
          });
          return;
        }
      }
      
      // Not authenticated
      setState({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        error: 'Failed to check authentication status'
      });
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = () => {
    // Redirect to SWA login
    window.location.href = '/login';
  };

  const logout = () => {
    // Redirect to SWA logout
    window.location.href = '/logout';
  };

  const refresh = async () => {
    setState(prev => ({ ...prev, loading: true }));
    await fetchUser();
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refresh
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
