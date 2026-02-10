import { useState } from "react";
import "./PostTask.css";

const PostTask = () => {
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    city: "",
    pincode: "",
    taskDate: "",
    timeSlot: "morning",
    budget: "",
    urgency: "normal",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* =========================
     BASIC VALIDATION
  ========================= */
  const validateForm = () => {
    if (!form.title.trim()) return "Task title is required";
    if (!form.category.trim()) return "Skill / category is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.city.trim()) return "City is required";

    if (!form.pincode || form.pincode.length !== 6) {
      return "Enter a valid 6-digit pincode";
    }

    if (!form.taskDate) return "Task date is required";

    if (!form.budget || Number(form.budget) <= 0) {
      return "Enter a valid budget amount";
    }

    return null;
  };

  /* =========================
     SUBMIT
  ========================= */
  const submitTask = async (e) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/provider/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to post task");
        return;
      }

      alert("✅ Task posted successfully");

      // reset form
      setForm({
        title: "",
        category: "",
        description: "",
        city: "",
        pincode: "",
        taskDate: "",
        timeSlot: "morning",
        budget: "",
        urgency: "normal",
      });
    } catch {
      alert("Server error");
    }
  };

  return (
    <div className="post-task-container">
      <div className="post-task-header">
        <h2>Post New Task</h2>
        <p>Create a local task and find the right worker</p>
      </div>

      <div className="post-task-card">
        <form className="post-task-form" onSubmit={submitTask}>

          {/* Task Title */}
          <div className="input-group full-width">
            <label>Task Title</label>
            <input
              name="title"
              placeholder="e.g. Fix bathroom wiring"
              value={form.title}
              onChange={handleChange}
            />
          </div>

          {/* Skill / Category */}
          <div className="input-group">
            <label>Skill Required</label>
            <input
              name="category"
              placeholder="e.g. Electrician"
              value={form.category}
              onChange={handleChange}
            />
          </div>

          {/* Budget */}
          <div className="input-group">
            <label>Budget (₹)</label>
            <input
              type="number"
              name="budget"
              placeholder="Amount"
              value={form.budget}
              onChange={handleChange}
            />
          </div>

          {/* Description */}
          <div className="input-group full-width">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Describe the work clearly"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          {/* City */}
          <div className="input-group">
            <label>City</label>
            <input
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
            />
          </div>

          {/* Pincode */}
          <div className="input-group">
            <label>Pincode</label>
            <input
              name="pincode"
              placeholder="6 digit pincode"
              value={form.pincode}
              onChange={handleChange}
            />
          </div>

          {/* Date */}
          <div className="input-group">
            <label>Task Date</label>
            <input
              type="date"
              name="taskDate"
              value={form.taskDate}
              onChange={handleChange}
            />
          </div>

          {/* Time Slot */}
          <div className="input-group">
            <label>Preferred Time</label>
            <select
              name="timeSlot"
              value={form.timeSlot}
              onChange={handleChange}
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>

          {/* Urgency */}
          <div className="input-group">
            <label>Urgency</label>
            <select
              name="urgency"
              value={form.urgency}
              onChange={handleChange}
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          {/* Submit */}
          <div className="post-task-actions">
            <button className="post-task-btn" type="submit">
              Post Task
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default PostTask;
