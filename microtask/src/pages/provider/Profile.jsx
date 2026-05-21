import { useState, useEffect } from "react";
import "./profile.css";
const ProviderProfile = () => {
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [image, setImage] = useState(null);
  const [newEmail, setNewEmail] = useState("");
 const [otp, setOtp] = useState("");
 const [otpSent, setOtpSent] = useState(false);
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const res = await fetch("http://localhost:5000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();
    setUserData(data);
    setFormData(data);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleUpdate = async () => {
    const formPayload = new FormData();

    Object.keys(formData).forEach((key) => {
      formPayload.append(key, formData[key]);
    });

    if (image) {
      formPayload.append("profileImage", image);
    }

    const res = await fetch(
      "http://localhost:5000/api/auth/update-profile",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formPayload,
      }
    );

    if (res.ok) {
      alert("Profile updated successfully");
      setEditMode(false);
      fetchProfile(); // refresh everywhere
    } else {
      alert("Update failed");
    }
  };

  const sendEmailOtp = async () => {
  if (!newEmail) return alert("Enter new email");
  const res = await fetch("http://localhost:5000/api/auth/send-email-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ newEmail })
  });
  const data = await res.json();
  if (res.ok) { alert("OTP sent to new email"); setOtpSent(true); }
  else alert(data.message);
};

const verifyEmailOtp = async () => {
  if (!otp) return alert("Enter OTP");
  const res = await fetch("http://localhost:5000/api/auth/verify-email-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ otp })
  });
  const data = await res.json();
  if (res.ok) {
    alert("Email changed successfully");
    setOtpSent(false);
    setNewEmail("");
    setOtp("");
    fetchProfile();
  } else alert(data.message);
};

  if (!userData) return <p>Loading...</p>;

return (
  <div className="provider-profile-container">

    <div className="profile-header">

      <div className="profile-avatar-wrapper">
        <img
          src={
            userData.profileImage
              ? `http://localhost:5000/${userData.profileImage}`
              : "/default-user.png"
          }
          alt="profile"
          className="profile-avatar"
        />

        {editMode && (
          <input
            type="file"
            className="edit-avatar-btn"
            onChange={handleImageChange}
          />
        )}
      </div>

      <div className="profile-info">
        <div className="profile-name">{userData.name}</div>
        <div className="profile-role">{userData.role}</div>
        <div className="profile-email">{userData.email}</div>
      </div>
    </div>

    {!editMode ? (
      <>
        <div className="profile-details">
          <div className="profile-detail-card">
            <div className="detail-label">Organization</div>
            <div className="detail-value">{userData.organization}</div>
          </div>

          <div className="profile-detail-card">
  <div className="detail-label">Address</div>
  <div className="detail-value">
    {userData.address || "Not provided"}
  </div>
</div>

<div className="profile-detail-card">
  <div className="detail-label">Location</div>
  <div className="detail-value">
    {userData.location?.coordinates
      ? `${userData.location.coordinates[1]}, ${userData.location.coordinates[0]}`
      : "Not set"}
  </div>
</div>


          <div className="profile-detail-card">
            <div className="detail-label">Phone</div>
            <div className="detail-value">{userData.phone}</div>
          </div>
        </div>

        <button
          className="profile-edit-btn"
          onClick={() => setEditMode(true)}
        >
          Edit Profile
        </button>
      </>
    ) : (
      <div className="profile-form">
        <label>Name</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
        />

<div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px" }}>
  <label>Change Email</label>
  <input
    type="email"
    placeholder="Enter new email"
    value={newEmail}
    onChange={(e) => setNewEmail(e.target.value)}
    disabled={otpSent}
    style={{ marginBottom: "10px" }}
  />
  {!otpSent ? (
    <button className="save-profile-btn" onClick={sendEmailOtp}>
      Send OTP
    </button>
  ) : (
    <>
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        style={{ marginBottom: "10px" }}
      />
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="save-profile-btn" onClick={verifyEmailOtp}>
          Verify & Change
        </button>
        <button className="cancel-profile-btn" onClick={() => { setOtpSent(false); setOtp(""); }}>
          Cancel
        </button>
      </div>
    </>
  )}
</div>

        <label>Organization</label>
        <input
          name="organization"
          value={formData.organization}
          onChange={handleChange}
        />

        <div className="profile-actions">
          <button
            className="save-profile-btn"
            onClick={handleUpdate}
          >
            Save
          </button>

          <button
            className="cancel-profile-btn"
            onClick={() => setEditMode(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    )}

  </div>
);

};

export default ProviderProfile;
