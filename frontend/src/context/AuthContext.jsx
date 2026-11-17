import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, studentAPI } from '../services/api.js';
import { initSocket, disconnectSocket } from '../services/socket.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('school_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('school_token') || null);
  const [loading, setLoading] = useState(true);

  // Multi-Child Parent State
  const [childrenList, setChildrenList] = useState([]);
  const [activeChild, setActiveChild] = useState(null);

  // Initialize socket when user is present
  useEffect(() => {
    if (user && token) {
      initSocket(user);
    }
  }, [user, token]);

  // Load / verify current user on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('school_user', JSON.stringify(res.data));

            // If Parent, load children
            if (res.data.role === 'parent') {
              loadParentChildren();
            }
          }
        } catch (err) {
          console.warn('Failed to verify token:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const loadParentChildren = async () => {
    try {
      const res = await studentAPI.getMyChildren();
      if (res.success && res.data?.length > 0) {
        setChildrenList(res.data);
        setActiveChild((prev) => prev || res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching parent children:', err);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      if (res.success && res.data) {
        const { token: jwtToken, user: userData } = res.data;
        setToken(jwtToken);
        setUser(userData);
        localStorage.setItem('school_token', jwtToken);
        localStorage.setItem('school_user', JSON.stringify(userData));

        initSocket(userData);

        if (userData.role === 'parent') {
          // Fetch children
          const childRes = await studentAPI.getMyChildren();
          if (childRes.success && childRes.data?.length > 0) {
            setChildrenList(childRes.data);
            setActiveChild(childRes.data[0]);
          }
        }
        return { success: true };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    disconnectSocket();
    setToken(null);
    setUser(null);
    setActiveChild(null);
    setChildrenList([]);
    localStorage.removeItem('school_token');
    localStorage.removeItem('school_user');
  };

  const switchActiveChild = (child) => {
    setActiveChild(child);
  };

  const updateCurrentUser = (updatedData) => {
    const updated = { ...user, ...updatedData };
    setUser(updated);
    localStorage.setItem('school_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
        childrenList,
        activeChild,
        switchActiveChild,
        updateCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
