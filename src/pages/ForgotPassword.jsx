import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";
import { forgotPassword } from "../services/authApi";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }
    try{

    setError("");
    setLoading(true);

    await forgotPassword(email);
    navigate("/verify-otp", { state: { email } });
    }catch (err) {
    setError(
      err.response?.data?.error || "No account found with this email"
    );
  } finally {
    // 🔥 THIS FIXES THE STUCK BUTTON
    setLoading(false);
  }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Forgot Password</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
