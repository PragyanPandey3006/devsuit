import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { githubService } from '../services/githubService';

interface User {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  email: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setError(null);
      
      // Check for OAuth callback first
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const errorParam = urlParams.get('error');

      if (errorParam) {
        setError(`OAuth error: ${errorParam}`);
        setIsLoading(false);
        return;
      }

      if (code && state) {
        await handleOAuthCallback(code, state);
        return;
      }

      // Check for existing token
      const savedToken = localStorage.getItem('github_token');
      
      if (savedToken) {
        setToken(savedToken);
        githubService.setToken(savedToken);
        
        try {
          const userData = await githubService.getCurrentUser();
          setUser(userData);
        } catch (error: any) {
          console.error('Failed to fetch user data:', error);
          // Token might be invalid, clear it
          localStorage.removeItem('github_token');
          setToken(null);
          githubService.setToken(null);
          setError('Authentication expired. Please sign in again.');
        }
      }
    } catch (error: any) {
      console.error('Auth initialization failed:', error);
      setError('Failed to initialize authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    const clientId = 'Ov23lilA5w7ZZVZZ1Xk0';
    const redirectUri = window.location.origin;
    const scope = 'repo user read:org read:user user:email';
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state for verification
    localStorage.setItem('oauth_state', state);
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
    
    console.log('Redirecting to GitHub OAuth:', authUrl);
    window.location.href = authUrl;
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Handling OAuth callback with code:', code);

      // Verify state parameter
      const savedState = localStorage.getItem('oauth_state');
      if (state !== savedState) {
        throw new Error('Invalid OAuth state parameter');
      }
      localStorage.removeItem('oauth_state');

      // Exchange code for token using Netlify function
      const response = await fetch('/.netlify/functions/github-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to exchange OAuth code');
      }

      const { access_token } = await response.json();
      
      if (!access_token) {
        throw new Error('No access token received');
      }

      console.log('Successfully received access token');

      // Store token and fetch user data
      setToken(access_token);
      localStorage.setItem('github_token', access_token);
      githubService.setToken(access_token);

      const userData = await githubService.getCurrentUser();
      setUser(userData);

      // Clean up URL and redirect to dashboard
      window.history.replaceState({}, document.title, '/dashboard');
    } catch (error: any) {
      console.error('OAuth callback failed:', error);
      setError(error.message || 'Authentication failed. Please try again.');
      // Clean up URL on error
      window.history.replaceState({}, document.title, '/');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('github_token');
    localStorage.removeItem('oauth_state');
    githubService.setToken(null);
    window.location.href = '/';
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
