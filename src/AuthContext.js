import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user from sessionStorage on mount
  useEffect(() => {
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse saved user:', err);
        sessionStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Sync user to sessionStorage whenever it changes
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('user');
    }
  }, [user]);

  // Login user
  const login = (userData) => setUser(userData);

  // Logout user
  const logout = () => setUser(null);

  // Update user fields safely
  const updateUser = (updatedFields) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...updatedFields,
        email: updatedFields.email ?? prev.email, // preserve email if not provided
      };
    });
  };

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{ user, setUser, login, logout, updateUser, isAuthenticated, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
