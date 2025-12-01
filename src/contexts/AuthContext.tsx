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
  logout: () => Promise<void>;
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
  const [mockToken, setMockToken] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      // First check if we have stored mock auth
      const storedAuth = getStoredAuth();
      
      if (storedAuth) {
        setMockToken(storedAuth.mockToken);
        setState({
          user: storedAuth.user,
          isAuthenticated: true,
          isAdmin: storedAuth.isAdmin,
          loading: false,
          error: null
        });
        return;
      }
      
      // Try SWA built-in auth (will work once admin consent is granted)
      try {
        const swaResponse = await fetch('/.auth/me');
        
        if (swaResponse.ok) {
          const swaData = await swaResponse.json();
          
          if (swaData.clientPrincipal) {
            const principal = swaData.clientPrincipal;
            
            // Get admin status from our API
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

  const logout = async () => {
    // Redirect to SWA logout endpoint
    window.location.href = '/.auth/logout?post_logout_redirect_uri=/amos-cloudstore';
  };

  const refresh = async () => {
    setState(prev => ({ ...prev, loading: true }));
    await fetchUser();
  };

  const value: AuthContextType = {
    ...state,
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
