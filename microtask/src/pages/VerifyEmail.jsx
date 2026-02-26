import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./VerifyEmail.css";

const OTP_LENGTH = 6;
const RESEND_TIME = 30;


const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email =
    location.state?.email || localStorage.getItem("verifyEmail");

  if (!email) {
    return (
      <div className="verify-email-container">
        <div className="verify-email-card">
          <h2>Invalid Access</h2>
          <p>Please register again.</p>
        </div>
      </div>
    );
  }
  const [shake, setShake] = useState(false);

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [resendTimer, setResendTimer] = useState(RESEND_TIME);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = useRef([]);

  /* ⏳ Countdown */
  useEffect(() => {
    if (resendTimer === 0) return;

    const timer = setTimeout(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendTimer]);

  /* OTP INPUT HANDLER */
  const handleOtpChange = (value, index) => {
  if (!/^\d?$/.test(value)) return;

  const newOtp = [...otp];
  newOtp[index] = value;
  setOtp(newOtp);

  // move focus forward
  if (value && index < OTP_LENGTH - 1) {
    inputRefs.current[index + 1].focus();
  }

  // 🚀 AUTO-SUBMIT WHEN LAST DIGIT ENTERED
  if (value && index === OTP_LENGTH - 1) {
    const finalOtp = newOtp.join("");
    if (finalOtp.length === OTP_LENGTH) {
      handleVerify(finalOtp);
    }
  }
};


  /* VERIFY OTP */
const handleVerify = async (autoOtp) => {
  const finalOtp = autoOtp || otp.join("");


    if (finalOtp.length !== OTP_LENGTH) {
      setMessage("Enter complete OTP");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/verify-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: finalOtp }),
        }
      );

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setMessage("Email verified successfully 🎉");
        setMessageType("success");

        localStorage.removeItem("verifyEmail");

        setTimeout(() => navigate("/login"), 1500);
      } else {
setMessage(data.error || "Verification failed");
setMessageType("error");

// ❌ SHAKE OTP BOXES
setShake(true);
setTimeout(() => setShake(false), 500);

      }
    } catch {
      setLoading(false);
      setMessage("Server error");
      setMessageType("error");
    }
  };

  /* RESEND OTP */
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setResendLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/resend-email-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();
      setResendLoading(false);

      if (res.ok) {
        setMessage("OTP resent successfully 📩");
        setMessageType("success");
        setResendTimer(RESEND_TIME);
      } else {
        setMessage(data.error || "Failed to resend OTP");
        setMessageType("error");
      }
    } catch {
      setResendLoading(false);
      setMessage("Server error");
      setMessageType("error");
    }
  };

    /* HANDLE BACKSPACE + ENTER */
  const handleKeyDown = (e, index) => {

    // ⬅️ BACKSPACE: move focus to previous box if empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }

    // ⏎ ENTER: submit OTP
    if (e.key === "Enter") {
      e.preventDefault();
      handleVerify();
    }
  };


  const progress = (resendTimer / RESEND_TIME) * 100;

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <h2>Verify Your Email</h2>
        <p>
          Enter the OTP sent to <span>{email}</span>
        </p>

        {message && (
          <div className={`verify-banner ${messageType}`}>
            {message}
          </div>
        )}

        {/* 🔢 OTP BOXES */}
        <div className={`otp-box-container ${shake ? "shake" : ""}`}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) =>
                handleOtpChange(e.target.value, index)
              }
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="otp-box"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="verify-email-btn"
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        {/* ⏳ RESEND WITH CIRCLE */}
        <div className="resend-container">
          <div
            className="progress-circle"
            style={{
              background: `conic-gradient(
                #2f80ed ${progress}%,
                #e0e0e0 ${progress}%
              )`,
            }}
          >
            <span>{resendTimer}s</span>
          </div>

          <button
            onClick={handleResendOtp}
            disabled={resendTimer > 0 || resendLoading}
            className="resend-btn"
          >
            Resend OTP
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
