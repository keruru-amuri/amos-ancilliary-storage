import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Mock auth storage key
const MOCK_AUTH_KEY = 'cloudstore_mock_auth';

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
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  getMockToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to get stored mock auth
function getStoredAuth(): { user: User; isAdmin: boolean; mockToken: string } | null {
  try {
    const stored = localStorage.getItem(MOCK_AUTH_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse stored auth:', e);
  }
  return null;
}

// Helper to store mock auth
function storeAuth(data: { user: User; isAdmin: boolean; mockToken: string }) {
  localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(data));
}

// Helper to clear stored auth
function clearAuth() {
  localStorage.removeItem(MOCK_AUTH_KEY);
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
      } catch (swaError) {
        // SWA auth endpoint might not be available in some environments
        console.warn('SWA auth check failed:', swaError);
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

  const login = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Store the mock auth data
        storeAuth({
          user: data.user,
          isAdmin: data.isAdmin,
          mockToken: data.mockToken
        });
        
        setMockToken(data.mockToken);
        setState({
          user: data.user,
          isAuthenticated: true,
          isAdmin: data.isAdmin,
          loading: false,
          error: null
        });
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout API (optional, mainly for future SWA auth)
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout API call failed:', e);
    }
    
    // Clear local storage
    clearAuth();
    setMockToken(null);
    
    setState({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      loading: false,
      error: null
    });
  };

  const refresh = async () => {
    setState(prev => ({ ...prev, loading: true }));
    await fetchUser();
  };

  const getMockToken = () => mockToken;

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refresh,
    getMockToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
