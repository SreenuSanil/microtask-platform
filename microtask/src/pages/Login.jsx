import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logo from "../assets/tasknest.png";
import Home_bg from "../assets/Home-bg.png";




const Login = () => {
  const navigate = useNavigate();
  // ✅ State MUST be inside component (WHY: React hook rule)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Login handler
  const handleLogin = async (e) => {
    e.preventDefault(); // WHY: prevent page refresh

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

// ❌ LOGIN FAILED
if (!response.ok) {

  // 🔐 EMAIL NOT VERIFIED
  if (data.error === "Email not verified. Please verify your email first.") {
    localStorage.setItem("verifyEmail", email);
    navigate("/verify-email");
    return;
  }

  // 🚫 BLOCKED ACCOUNT
  if (data.error === "Account blocked") {
    let message = `❌ Account Blocked\n\nReason: ${data.reason}`;

    if (data.daysLeft !== null) {
      if (data.daysLeft > 0) {
        message += `\nUnblocks in: ${data.daysLeft} day(s)`;
      } else {
        message += `\nUnblock pending (check again later)`;
      }
    } else {
      message += `\nBlocked for: Permanent`;
    }

    alert(message);
    return;
  }

  // 🚫 REMOVED ACCOUNT
  if (data.error === "Account removed") {
    alert(
      `❌ Account Removed\n\nReason: ${
        data.reason || "Violated Company Policy"
      }`
    );
    return;
  }

  // ❌ OTHER ERRORS
  alert(data.error || "Invalid email or password");
  return;
}

      // ✅ Correct login → redirect by role
      // save auth data
localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user));

// ROLE + APPROVAL BASED REDIRECT
if (data.user.role === "worker") {

  if (data.user.approvalStatus === "approved") {
    navigate("/worker-dashboard");

  } else if (data.user.approvalStatus === "pending") {
    navigate("/pending-approval");

  } else if (data.user.approvalStatus === "rejected") {
    alert("Your profile was rejected. Please contact admin.");
    return;
  }

}
 
else if (data.user.role === "provider") {
  navigate("/provider-dashboard");
} 
else if (data.user.role === "admin") {
  navigate("/admin-dashboard");
}

    } catch (error) {
      alert("Server error");
    }
  };

  return (
    <div className="login-root">
      {/* Background */}
      
        <div className="login-card">
          <div className="back-home">
            <a href="/" title="Back to Home">←</a>
          </div>

          {/* Logo */}
          <div className="login-logo">
            <img src={logo} alt="TaskNest Logo" />
          </div>

          <h2>Welcome Back</h2>
          <p className="login-subtext">
            Login to continue earning through skill-based microtasks
          </p>

          {/* ✅ Form */}
          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}                         // WHY: controlled input
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}                      // WHY: controlled input
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="login-options">
              <a href="/forgot-password">Forgot Password?</a>
            </div>

            <button type="submit" className="login-btn-primary">
              Login
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don’t have an account?
              <a href="/register"> Sign Up</a>
            </p>
          </div>
        </div>
      </div>
  );
};

export default Login;
