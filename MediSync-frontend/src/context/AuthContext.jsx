import React, { createContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authService.getCurrentUser();
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: userData.user }
        });
      } catch (error) {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: error.response?.data?.message || null
        });
      }
    };

    // Use setTimeout to ensure this runs after component mount
    const timer = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.login(credentials);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user }
      });
      return response;
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || 'Login failed'
      });
      throw error;
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.register(userData);
      
      // If patient registration is successful, they are automatically logged in via cookies
      if (userData.role === 'patient' && response.user) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user }
        });
      }
      
      return response;
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || 'Registration failed'
      });
      throw error;
    }
  };

  const emergencyAccess = async (emergencyData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.emergencyAccess(emergencyData);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user }
      });
      return response;
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error.response?.data?.message || 'Emergency access failed'
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    emergencyAccess,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
