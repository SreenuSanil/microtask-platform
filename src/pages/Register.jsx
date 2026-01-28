import { useState } from "react";
import "./Register.css";
import logo from "../assets/tasknest.png";
import Home_bg from "../assets/Home-bg.png";

const Register = () => {
  const [role, setRole] = useState("");

  const [formData, setFormData] = useState({
  name: "",
  email: "",
  password: "",
  skills: "",
  availability: "",
  organization: "",
  taskType: ""
});

const [errors, setErrors] = useState({});

const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
};

const validateForm = () => {
  let newErrors = {};

  if (!formData.name.trim()) {
    newErrors.name = "Full name is required";
  }

  if (!formData.email) {
    newErrors.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = "Enter a valid email";
  }

  if (!formData.password) {
    newErrors.password = "Password is required";
  } else if (formData.password.length < 6) {
    newErrors.password = "Password must be at least 6 characters";
  }

  if (role === "worker") {
    if (!formData.skills.trim()) {
      newErrors.skills = "Skills are required";
    }
    if (!formData.availability) {
      newErrors.availability = "Availability is required";
    }
  }

  if (role === "provider") {
    if (!formData.organization.trim()) {
      newErrors.organization = "Organization name is required";
    }
    if (!formData.taskType.trim()) {
      newErrors.taskType = "Task type is required";
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const scrollToFirstError = (errors) => {
  const firstErrorField = Object.keys(errors)[0];
  if (firstErrorField) {
    document.getElementById(firstErrorField)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
};


 const handleSubmit = async (e) => {
  e.preventDefault();

  const isValid = validateForm();

  if (!isValid) {
    scrollToFirstError(errors);
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formData,
        role,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Account created successfully");
      window.location.href = "/login";
    } else {
      alert(data.error || "Registration failed");
    }
  } catch (error) {
    console.error(error);
    alert("Server error");
  }
 
};



  return (
    <div className="register-root">

      {/* Background */}
      <div className="register-bg">
        <img src={Home_bg} alt="" />
      </div>

      <div className="register-overlay">
        <div className="register-card">
 
         <div className="back-home">
         <button
           type="button"
            onClick={() => {
              if (role) {
                setRole("");       // go back to role selection
            } else {
               window.location.href = "/"; // go back to home
            }
       }}
          title="Go Back"
          className="back-arrow"
          >
         ←
         </button>
        </div>

          {/* Logo */}
          <div className="register-logo">
            <img src={logo} alt="TaskNest Logo" />
          </div>

          <h2>Create Your Account</h2>
          <p className="register-subtext">
            Choose your role and start using TaskNest
          </p>

          {/* ROLE SELECTION */}
          {!role && (
            <div className="role-selection">
              <button onClick={() => setRole("worker")}>
                I want to work
              </button>
              <button onClick={() => setRole("provider")}>
                I want to post tasks
              </button>
            </div>
          )}

          {/* REGISTRATION FORM */}
          {role && (
            <form className="register-form" onSubmit={handleSubmit}>


              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
                {errors.name && <span className="error">{errors.name}</span>}

              </div>

              <div className="input-group">
                <label>Email Address</label>
                <input
                 type="email"
                 id="email"
                 name="email"
                 value={formData.email}
                 onChange={handleChange}
                 placeholder="Enter your email"
                />
                {errors.email && <span className="error">{errors.email}</span>}

              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                />
                 {errors.password && <span className="error">{errors.password}</span>}

              </div>

              {/* WORKER-SPECIFIC FIELDS */}
              {role === "worker" && (
                <>
                  <div className="input-group">
                    <label>Skills</label>
                    <input
                      type="text"
                      id="skills"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      placeholder="Eg: Data entry, Design, Tutoring"
                    />
                    {errors.skills && <span className="error">{errors.skills}</span>}
                  </div>

                  <div className="input-group">
                    <label>Availability</label>
                    <select
                      id="availability"
                      name="availability"
                      value={formData.availability}
                      onChange={handleChange}
>
                      <option value="">Select availability</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Flexible">Flexible</option>
                      <option value="Weekends">Weekends</option>
                    </select>

                     {errors.availability && (
                       <span className="error">{errors.availability}</span>
                     )}
                  </div>
                </>
              )}

              {/* PROVIDER-SPECIFIC FIELDS */}
              {role === "provider" && (
                <>
                  <div className="input-group">
                    <label>Organization / Business Name</label>
                    <input
                      type="text"
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      placeholder="Eg: Startup / Shop / Individual"
                    />
                    {errors.organization && <span className="error">{errors.organization}</span>}
                  </div>

                  <div className="input-group">
                    <label>Type of Tasks</label>
                    <input
                      type="text"
                      id="taskType"
                      name="taskType"
                      value={formData.taskType}
                      onChange={handleChange}
                      placeholder="Eg: Content, Data entry, Local services"
                    />
                    {errors.taskType && <span className="error">{errors.taskType}</span>}
                  </div>
                </>
              )}

              <button type="submit" className="register-btn-primary">
                Create Account
              </button>

              <div className="register-footer">
                <p>
                  Already have an account?
                  <a href="/login"> Login</a>
                </p>
              </div>

            </form>
          )}

        </div>
      </div>

    </div>
  );
};

export default Register;
