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
