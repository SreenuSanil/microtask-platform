import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtp } from "../services/authApi";
import "./VerifyOtp.css";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setError("Enter a valid 6-digit OTP");
      return;
    }

    try {
      setError("");
      setLoading(true);

      // ✅ correct API call
      await verifyOtp(email, otp);

      // ✅ move to reset password page
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.error || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return <p>Invalid access</p>;
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Verify OTP</h2>
        <p className="auth-text">OTP sent to {email}</p>

        <form onSubmit={handleVerify}>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;
