import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('sr360_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem('sr360_user', JSON.stringify(user));
    else localStorage.removeItem('sr360_user');
  }, [user]);

  async function login(email, password) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('sr360_token', data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  }

  // Guest login: phone number only, valid only during an active checked-in stay.
  // `room` (optional): set when guest scanned a specific room's QR key —
  // backend verifies the phone is checked into THAT room.
  async function guestLogin(phone, room) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/guest-login', { phone, room });
      localStorage.setItem('sr360_token', data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  }

  async function requestGuestRegistrationOtp(payload) {
    try {
      const { data } = await api.post('/auth/register/request-otp', payload);
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Could not send verification code' };
    }
  }

  async function verifyGuestRegistrationOtp(email, otp) {
    try {
      const { data } = await api.post('/auth/register/verify-otp', { email, otp });
      localStorage.setItem('sr360_token', data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Verification failed' };
    }
  }

  function logout() {
    localStorage.removeItem('sr360_token');
    localStorage.removeItem('sr360_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, guestLogin, requestGuestRegistrationOtp, verifyGuestRegistrationOtp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);