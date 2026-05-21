import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import "./WorkerProfile.css";
const provider = new OpenStreetMapProvider();
const WorkerProfile = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
    experienceYears: 0,
    pastWorkDescription: "",
    certifications: "",
    skills: [],
    profileImage: "",

  });

  const [position, setPosition] = useState([9.9312, 76.2673]);
  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState(null);
const [certificationImages, setCertificationImages] = useState([]);
const [certPreview, setCertPreview] = useState([]);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
const [newEmail, setNewEmail] = useState("");
const [emailOtp, setEmailOtp] = useState("");
const [emailOtpSent, setEmailOtpSent] = useState(false);
const [searchText, setSearchText] = useState("");
const [suggestions, setSuggestions] = useState([]);

const [workImages, setWorkImages] = useState([]);
const [workPreview, setWorkPreview] = useState([]);
  useEffect(() => {
    fetchProfile();
  }, []);

const fetchProfile = async () => {
  const res = await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/auth/me", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });

  const data = await res.json();

  setForm({
    ...data,
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    address: data.address || "",
    bio: data.bio || "",
    experienceYears: data.experienceYears || 0,
    pastWorkDescription: data.pastWorkDescription || "",
    certifications: data.certifications || "",
    skills: data.skills || [],
  });

  setSearchText(data.address || "");

  if (data.location?.coordinates) {
    setPosition([
      data.location.coordinates[1],
      data.location.coordinates[0]
    ]);
  }
};

  const handleCertificationImages = (e) => {
  const files = Array.from(e.target.files);

  if (files.length + certificationImages.length > 5) {
    alert("Max 5 certification images allowed");
    return;
  }

  setCertificationImages((prev) => [...prev, ...files]);

  const previews = files.map((file) => URL.createObjectURL(file));
  setCertPreview((prev) => [...prev, ...previews]);
};

  // ⭐ PROFILE COMPLETION
  const calculateCompletion = () => {
    let total = 6;
    let filled = 0;

    if (form.name) filled++;
    if (form.phone) filled++;
    if (form.address) filled++;
    if (form.bio) filled++;
    if (form.experienceYears) filled++;
   if (workImages.length > 0 || form.workImages?.length > 0) filled++;

    return Math.round((filled / total) * 100);
  };

  const handleWorkImages = (e) => {
  const files = Array.from(e.target.files);

  if (files.length + workImages.length > 5) {
    alert("Max 5 images allowed");
    return;
  }

  setWorkImages((prev) => [...prev, ...files]);

  const previews = files.map((file) => URL.createObjectURL(file));
  setWorkPreview((prev) => [...prev, ...previews]);
};

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Max 2MB allowed");
      return;
    }

    setProfileImage(file);
    setPreview(URL.createObjectURL(file));
  };

const handleSearch = async (value) => {
  setSearchText(value);

  if (!value) {
    setSuggestions([]);
    return;
  }
  console.log("Searching:", value);

  const results = await provider.search({ query: value });
console.log("Results:", results);
  setSuggestions(results.slice(0, 5));
};

const removeCertImage = (index, type) => {
  if (type === "new") {
    setCertificationImages((prev) => prev.filter((_, i) => i !== index));
    setCertPreview((prev) => prev.filter((_, i) => i !== index));
  } else {
    const updated = form.certificationImages.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, certificationImages: updated }));
  }
};

  const saveProfile = async () => {
    const formData = new FormData();

const allowedFields = [
  "name",
  "phone",
  "address",
  "bio",
  "experienceYears",
  "pastWorkDescription",
  "certifications"
];

certificationImages.forEach((img) => {
  formData.append("certificationImages", img);
});
formData.append(
  "existingCertificationImages",
  JSON.stringify(form.certificationImages || [])
);
allowedFields.forEach((key) => {
  formData.append(key, form[key]);
});

    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

      workImages.forEach((img) => {
  formData.append("workImages", img);
});

    formData.append(
      "location",
      JSON.stringify({
        type: "Point",
        coordinates: [position[1], position[0]]
      })
    );

    formData.append(
  "existingWorkImages",
  JSON.stringify(form.workImages || [])
);

    const res = await fetch(
      "https://microtask-platform-backend-y3xo.onrender.com/api/users/worker-profile",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
      }
    );

    const updatedUser = await res.json();
    localStorage.setItem("user", JSON.stringify(updatedUser));

    alert("Profile updated successfully");
  };
  const removeImage = (index, type) => {
  if (type === "new") {
    setWorkImages((prev) => prev.filter((_, i) => i !== index));
    setWorkPreview((prev) => prev.filter((_, i) => i !== index));
  } else {
    const updated = form.workImages.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, workImages: updated }));
  }
};

  const changePassword = async () => {
    const res = await fetch(
      "https://microtask-platform-backend-y3xo.onrender.com/api/auth/change-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("Password updated");
      setOldPassword("");
      setNewPassword("");
    } else {
      alert(data.error);
    }
  };
const sendEmailOtp = async () => {
  if (!newEmail) return alert("Enter new email");
  const res = await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/auth/send-email-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ newEmail })
  });
  const data = await res.json();
  if (res.ok) { alert("OTP sent to new email"); setEmailOtpSent(true); }
  else alert(data.message);
};

const verifyEmailOtp = async () => {
  if (!emailOtp) return alert("Enter OTP");
  const res = await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/auth/verify-email-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ otp: emailOtp })
  });
  const data = await res.json();
  if (res.ok) {
    alert("Email changed successfully");
    setEmailOtpSent(false);
    setNewEmail("");
    setEmailOtp("");
    fetchProfile();
  } else alert(data.message);
};
  return (
    <div className="worker-profile-container">
      <h2>Worker Profile</h2>

      {/* PROFILE COMPLETION */}
      <div className="completion-card">
        <p>Profile Completion: {calculateCompletion()}%</p>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${calculateCompletion()}%` }}
          ></div>
        </div>
      </div>

      {/* IMAGE */}
      <div className="profile-image-section">
        <img
          src={
            preview ||
            form.profileImage ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
          }
          alt="profile"
        />
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </div>

      {/* PERSONAL */}
      <div className="profile-card">
        <h3>Personal Info</h3>
        <input name="name" value={form.name} onChange={handleChange} />
        <input
  name="email"
  value={form.email}
  disabled
  className="disabled-input"
/>
        <input name="phone" value={form.phone} onChange={handleChange} />
        <input name="address" value={form.address} onChange={handleChange} />
      </div>

      {/* SKILLS */}
      <div className="profile-card">
        <h3>Skills (Verified)</h3>
        <input value={form.skills?.join(", ")} disabled />
      </div>

{/* ABOUT */}
<div className="profile-section">
  <h3>About</h3>
  <textarea
    name="bio"
    placeholder="Write about yourself"
    value={form.bio}
    onChange={handleChange}
  />
</div>

{/* EXPERIENCE */}
<div className="profile-section">
  <h3>Experience</h3>
  <input
    type="number"
    name="experienceYears"
    placeholder="Years of Experience"
    value={form.experienceYears || ""}
    onChange={handleChange}
  />
</div>

{/* PAST WORK DESCRIPTION */}
<div className="profile-section">
  <h3>Past Work Description</h3>
  <textarea
    name="pastWorkDescription"
    placeholder="Describe your past work..."
    value={form.pastWorkDescription}
    onChange={handleChange}
  />
</div>

{/* WORK IMAGES */}
<div className="profile-section">
  <h3>Past Work Images</h3>

  <label className="upload-box">
    📸 Upload Work Photos
    <input
      type="file"
      multiple
      accept="image/*"
      onChange={handleWorkImages}
      hidden
    />
  </label>

  <div className="work-preview">
    {form.workImages?.map((img, i) => (
      <div className="img-box" key={`old-${i}`}>
        <img src={`https://microtask-platform-backend-y3xo.onrender.com/${img}`} alt="work" />
        <button onClick={() => removeImage(i, "old")}>✕</button>
      </div>
    ))}

    {workPreview.map((img, i) => (
      <div className="img-box" key={`new-${i}`}>
        <img src={img} alt="work" />
        <button onClick={() => removeImage(i, "new")}>✕</button>
      </div>
    ))}
  </div>
</div>

{/* CERTIFICATIONS */}
<div className="profile-section">
  <h3>Certifications</h3>

  <textarea
    name="certifications"
    placeholder="Add your certifications, licenses, etc."
    value={form.certifications}
    onChange={handleChange}
  />

  <label className="upload-box">
    📄 Upload Certification Images
    <input
      type="file"
      multiple
      accept="image/*"
      onChange={handleCertificationImages}
      hidden
    />
  </label>

  <div className="work-preview">
    {form.certificationImages?.map((img, i) => (
      <div className="img-box" key={`old-cert-${i}`}>
        <img src={`https://microtask-platform-backend-y3xo.onrender.com/${img}`} alt="cert" />
        <button onClick={() => removeCertImage(i, "old")}>✕</button>
      </div>
    ))}

    {certPreview.map((img, i) => (
      <div className="img-box" key={`new-cert-${i}`}>
        <img src={img} alt="work" />
        <button onClick={() => removeCertImage(i, "new")}>✕</button>
      </div>
    ))}
  </div>
</div>

{/* LOCATION */}

      {/* LOCATION */}
      <div className="profile-card">
        <h3>Location</h3>

<div className="search-box">
  <input
    type="text"
    placeholder="Search location..."
    value={searchText}
    onChange={(e) => handleSearch(e.target.value)}
  />

  <div className="suggestions">
    {suggestions.map((s, i) => (
      <div
        key={i}
        className="suggestion-item"
        onClick={() => {
          setPosition([s.y, s.x]);
          setForm((prev) => ({
            ...prev,
            address: s.label
          }));
          setSuggestions([]);
          setSearchText(s.label);
        }}
      >
        {s.label}
      </div>
    ))}
  </div>
</div>

        <MapContainer center={position} zoom={13}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Marker
            position={position}
            draggable={true}
            eventHandlers={{
              dragend: async (e) => {
                const latlng = e.target.getLatLng();
                setPosition([latlng.lat, latlng.lng]);

                const res = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`
                );

                const data = await res.json();

                setForm((prev) => ({
                  ...prev,
                  address: data.display_name || ""
                }));
              }
            }}
          />
        </MapContainer>
      </div>

      {/* PASSWORD */}
      <div className="profile-card">
        <h3>Change Password</h3>

        <input
          type="password"
          placeholder="Old Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <button onClick={changePassword}>Update Password</button>
      </div>
      
{/* CHANGE EMAIL */}
<div className="profile-card">
  <h3>Change Email</h3>

  <input
    type="email"
    placeholder="Enter new email"
    value={newEmail}
    onChange={(e) => setNewEmail(e.target.value)}
    disabled={emailOtpSent}
  />

  {!emailOtpSent ? (
    <button onClick={sendEmailOtp}>Send OTP</button>
  ) : (
    <>
      <input
        type="text"
        placeholder="Enter OTP"
        value={emailOtp}
        onChange={(e) => setEmailOtp(e.target.value)}
      />
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={verifyEmailOtp}>Verify & Change</button>
        <button
          style={{ background: "#ef4444" }}
          onClick={() => { setEmailOtpSent(false); setEmailOtp(""); }}
        >
          Cancel
        </button>
      </div>
    </>
  )}
</div>
      <button className="save-btn" onClick={saveProfile}>
        
        Save Changes
      </button>
    </div>
  );

};

export default WorkerProfile;