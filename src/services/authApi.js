import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/auth",
});

/* ===============================
   ATTACH TOKEN TO REQUESTS
================================ */
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

/* ===============================
   AUTH APIs
================================ */

// LOGIN
export const loginUser = (data) => API.post("/login", data);

// REGISTER
export const registerUser = (data) => API.post("/register", data);

// GET CURRENT USER (🔥 THIS FIXES WHITE SCREEN 🔥)
export const getProfile = () => API.get("/me");

// FORGOT PASSWORD
export const forgotPassword = (email) =>
  API.post("/forgot-password", { email });

// VERIFY OTP
export const verifyOtp = (email, otp) =>
  API.post("/verify-otp", { email, otp });

// RESET PASSWORD
export const resetPassword = (email, password) =>
  API.post("/reset-password", { email, password });
// src/services/api.js

const BASE_URL = "http://localhost:5000/api";

export const dashboardAPI = {
  async getProfile() {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return res.json();
  },

  async getAvailableTasks() {
    const res = await fetch(`${BASE_URL}/tasks/available`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return res.json();
  },

  async getAppliedTasks() {
    return [];
  },

  async getOngoingTasks() {
    return [];
  },

  async getCompletedTasks() {
    return { tasks: [] };
  },

  async getMessages() {
    return [];
  },

  async getNotifications() {
    return [];
  },

  async applyForTask(taskId) {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/apply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return res.json();
  },

  async updateProfile(data) {
    const res = await fetch(`${BASE_URL}/auth/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
