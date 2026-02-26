import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PendingApproval.css";
import logo from "../assets/tasknest.png";

const PendingApproval = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  // 🔐 INITIAL CHECK
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "worker") {
      navigate("/login");
      return;
    }

    // If already approved (in case localStorage updated)
    if (user.approvalStatus === "approved") {
      navigate("/worker-dashboard");
    }

  }, [navigate]);

  // 🔄 PROFESSIONAL AUTO-CHECK EVERY 10 SECONDS
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setChecking(true);

        const token = localStorage.getItem("token");

        const res = await fetch(
          "http://localhost:5000/api/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) return;

        const updatedUser = await res.json();

        // Update localStorage user
        localStorage.setItem("user", JSON.stringify(updatedUser));

        if (updatedUser.approvalStatus === "approved") {
          navigate("/worker-dashboard");
        }

      } catch (err) {
        console.log("Approval check failed");
      } finally {
        setChecking(false);
      }
    }, 10000); // every 10 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="pending-approval-container">
      <div className="approval-card">

        {/* BACK BUTTON */}
        <button
          className="back-home-btn"
          onClick={() => navigate("/")}
          title="Back to Home"
        >
          ←
        </button>

        {/* LOGO */}
        <div className="logo-section">
          <img src={logo} alt="TaskNest Logo" />
        </div>

        {/* ANIMATION */}
        <div className="pending-animation">
          <div className="hourglass">
            <div className="sand-flow"></div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="approval-content">
          <h1>Approval Pending</h1>
          <p className="subtitle">
            Your worker profile is under admin review
          </p>

          <div className="status-message">
            <div className="icon-large">🛂</div>
            <h2>Admin Verification in Progress</h2>

            <p>
              Thank you for registering on <strong>TaskNest</strong>.
              Your profile is currently being reviewed by our admin team.
            </p>

            <p className="highlight">
              You will receive an <strong>Email</strong> with
              interview or verification details.
            </p>

            <p className="note-text">
              Interviews are conducted outside the platform (in-person).
            </p>
          </div>

          <div className="timeline-info">
            <h3>Verification Process</h3>

            <div className="timeline">
              <div className="timeline-item completed">
                <span>✔ Registration Submitted</span>
              </div>
              <div className="timeline-item current">
                <span>⏳ Admin Review</span>
              </div>
              <div className="timeline-item upcoming">
                <span>📞 Interview & Skill Check</span>
              </div>
              <div className="timeline-item upcoming">
                <span>🚀 Dashboard Access</span>
              </div>
            </div>
          </div>

          <button
            className="check-status-btn"
            onClick={() => window.location.reload()}
          >
            {checking ? "Checking..." : "Refresh Status"}
          </button>

          <p className="note">
            This page will automatically redirect once you are approved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
