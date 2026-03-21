import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import "./WorkerProfile.css";

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

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const provider = new OpenStreetMapProvider();
const [searchText, setSearchText] = useState("");
const [suggestions, setSuggestions] = useState([]);

const [workImages, setWorkImages] = useState([]);
const [workPreview, setWorkPreview] = useState([]);
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const res = await fetch("http://localhost:5000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });

    const data = await res.json();
    setForm(data);

    if (data.location?.coordinates) {
      setPosition([
        data.location.coordinates[1],
        data.location.coordinates[0]
      ]);
    }
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

  const results = await provider.search({ query: value });

  setSuggestions(results.slice(0, 5));
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
      "http://localhost:5000/api/users/worker-profile",
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
      "http://localhost:5000/api/auth/change-password",
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

      {/* PROFESSIONAL */}
      <div className="profile-card">
        <h3>Professional Info</h3>

        <textarea
          name="bio"
          placeholder="About you"
          value={form.bio}
          onChange={handleChange}
        />
<input
  type="number"
  name="experienceYears"
  placeholder="Years of Experience"
  value={form.experienceYears || ""}
  onChange={handleChange}
/>

<h4>Past Work Photos (Optional)</h4>

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

  {/* OLD IMAGES */}
  {form.workImages?.map((img, i) => (
    <div className="img-box" key={`old-${i}`}>
      <img src={`http://localhost:5000/${img}`} alt="old" />
      <button onClick={() => removeImage(i, "old")}>✕</button>
    </div>
  ))}

  {/* NEW IMAGES */}
  {workPreview.map((img, i) => (
    <div className="img-box" key={`new-${i}`}>
      <img src={img} alt="new" />
      <button onClick={() => removeImage(i, "new")}>✕</button>
    </div>
  ))}

  {/* ADD MORE CARD */}
  <label className="add-more">
    +
    <input
      type="file"
      multiple
      accept="image/*"
      onChange={handleWorkImages}
      hidden
    />
  </label>

</div>

<textarea
  name="certifications"
  placeholder="Any certifications, licenses, or proof (optional)"
  value={form.certifications}
  onChange={handleChange}
/>

      </div>

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
      

      <button className="save-btn" onClick={saveProfile}>
        
        Save Changes
      </button>
    </div>
  );

};

export default WorkerProfile;