import React, { createContext, useContext, useEffect, useState } from 'react';
import { axiosClient, setAuthToken } from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  const login = async (email, password) => {
    const { data } = await axiosClient.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    setAuthToken(data.token);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken('');
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
