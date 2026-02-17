import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated, getRole } from "../services/authService";

const ProtectedRoute = ({ children, allowedRole }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" />;
  }

  const role = getRole();
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;