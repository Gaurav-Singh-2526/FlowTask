import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PublicRoute
 * Protects public pages (Landing Page, Login, Register).
 * While a user is authenticated, they CANNOT navigate back to the landing page
 * or login/register pages until they explicitly click "Logout" / "Sign Out".
 */
export default function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
