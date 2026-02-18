import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, getRole } from "../services/authService";

const ProtectedRoute = ({ children, allowedRole }) => {
  const location = useLocation();
  const [authState, setAuthState] = useState({
    authenticated: null,
    role: null,
    checking: true
  });

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const role = getRole();
      
      setAuthState({
        authenticated,
        role,
        checking: false
      });
    };
    
    checkAuth();
  }, [location.pathname]);

  if (authState.checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!authState.authenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check role if specific role is required
  if (allowedRole && authState.role !== allowedRole) {
    // Redirect to appropriate dashboard based on actual role
    // This prevents redirect loops
    if (authState.role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    } else if (authState.role === "STUDENT") {
      return <Navigate to="/student" replace />;
    } else if (authState.role === "STAFF") {
      return <Navigate to="/staff" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;