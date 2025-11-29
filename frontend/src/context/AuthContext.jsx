import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

// Export the context so hooks can import it
export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = await authService.verifyToken(token);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
  try {
    console.log('Attempting login with email:', email);
    const response = await authService.login(email, password);
    console.log('Login response:', response);
    
    // FastAPI OAuth2 returns: { access_token, token_type }
    if (response.access_token) {
      localStorage.setItem('token', response.access_token);
      console.log('Token stored, fetching user data...');
      
      // Fetch user data after login
      const userData = await authService.verifyToken(response.access_token);
      console.log('User data fetched:', userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } else {
      console.error('No access_token in response:', response);
      return { success: false, error: 'Invalid login response' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

const register = async (userData) => {
  try {
    console.log('Attempting registration...');
    const response = await authService.register(userData);
    console.log('Registration response:', response);
    
    // Registration returns user data directly: { email, fullName, role, _id, ... }
    // After registration, we need to login to get a token
    console.log('Registration successful, now logging in...');
    const loginResult = await login(userData.email, userData.password);
    console.log('Login after registration result:', loginResult);
    
    if (loginResult.success) {
      return { success: true };
    } else {
      return { success: false, error: 'Registration successful but login failed: ' + loginResult.error };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
};
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};