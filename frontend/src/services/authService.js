import API from "./api";
import { jwtDecode } from "jwt-decode";

export const loginUser = async (email, password) => {
  try {
    console.log("1. Sending login request to:", "/auth/login");
    console.log("2. Request payload:", { email, password });
    
    const res = await API.post("/auth/login", {
      email,
      password,
    });

    console.log("3. Login response received:", res);
    console.log("4. Response data:", res.data);
    
    const token = res.data.token;
    console.log("5. Token received:", token.substring(0, 20) + "...");
    
    localStorage.setItem("token", token);

    const decoded = jwtDecode(token);
    console.log("6. Decoded token:", decoded);

    // Clean the role by removing ROLE_ prefix
    let role = decoded.role;
    if (role && role.startsWith('ROLE_')) {
      role = role.substring(5); // Remove ROLE_ prefix
    }

    const user = {
      email: decoded.sub,
      role: role, // Store clean role (ADMIN, STUDENT, STAFF)
    };

    localStorage.setItem("user", JSON.stringify(user));
    console.log("7. User stored:", user);
    
    return user;
    
  } catch (error) {
    console.error("Login error full details:", {
      message: error.message,
      response: error.response,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
      config: error.config
    });
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    const res = await API.post("/auth/register", userData);
    return res.data;
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

export const getRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};