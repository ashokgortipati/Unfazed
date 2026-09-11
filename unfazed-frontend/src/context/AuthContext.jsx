import React, { createContext, useState, useEffect, useContext } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [therapist, setTherapist] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("unfazed_token") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await axiosInstance.get("/auth/me");
          if (res.data.success) {
            setTherapist(res.data.therapist);
          }
        } catch (err) {
          console.error("Auth me check failed", err);
          localStorage.removeItem("unfazed_token");
          setToken("");
          setTherapist(null);
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, [token]);

  const login = (authToken, therapistData) => {
    localStorage.setItem("unfazed_token", authToken);
    setToken(authToken);
    setTherapist(therapistData);
  };

  const logout = () => {
    localStorage.removeItem("unfazed_token");
    setToken("");
    setTherapist(null);
  };

  const updateTherapistState = (updatedData) => {
    setTherapist((prev) => ({ ...prev, ...updatedData }));
  };

  return (
    <AuthContext.Provider
      value={{
        therapist,
        token,
        isAuthenticated: !!token && !!therapist,
        loading,
        login,
        logout,
        updateTherapistState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
