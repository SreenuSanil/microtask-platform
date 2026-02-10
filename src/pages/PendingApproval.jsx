import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../services/authApi";
import "./PendingApproval.css";
import logo from "../assets/tasknest.png";

const PendingApproval = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkApprovalStatus = async () => {
      try {
        const res = await getProfile(); // backend call
        const user = res.data;

        if (user.role !== "worker") {
          navigate("/login");
          return;
        }

        if (user.approvalStatus === "approved") {
          navigate("/worker-dashboard");
        }

        if (user.approvalStatus === "rejected") {
          navigate("/login");
        }
      } catch (err) {
        navigate("/login");
      }
    };

    checkApprovalStatus();
  }, [navigate]);

  return (
    <div className="pending-approval-container">
      <div className="approval-card">


        {/* BACK TO HOME */}
<button
  className="back-home-btn"
  onClick={() => navigate("/")}
  title="Back to Home"
>
  ←
</button>


        {/* LOGO */}
        <div className="logo-section">
          <img src={logo} alt="TaskNest Logo" /><br />
          
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
            Refresh Status
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
