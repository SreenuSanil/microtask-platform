const API_URL = "http://localhost:5000/api/tasks";

export const getAvailableTasks = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/available`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return res.json();
};

export const applyToTask = async (taskId) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/apply/${taskId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Apply failed");
  }

  return res.json();
};
