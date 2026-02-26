import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./WorkerProfile.css";

const WorkerProfile = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    bio: "",
    experienceYears: 0,
    pastWorkDescription: "",
    certifications: "",
    languages: "",
    skills: []
  });

  const [position, setPosition] = useState([9.9312, 76.2673]);

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const saveProfile = async () => {
  const res = await fetch(
    "http://localhost:5000/api/users/worker-profile",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        ...form,
        location: {
          type: "Point",
          coordinates: [position[1], position[0]]
        }
      })
    }
  );

  const updatedUser = await res.json();

  // ✅ Update localStorage
  localStorage.setItem("user", JSON.stringify(updatedUser));

  alert("Profile updated successfully");
};


  return (
    <div className="worker-profile-container">
      <h2>Worker Profile</h2>


<div className="profile-section">
      <h3>Personal Info</h3>
      <input name="name" value={form.name} onChange={handleChange} />
      <input name="phone" value={form.phone} onChange={handleChange} />
      <input name="address" value={form.address} onChange={handleChange} />

      <h3>Skills (Verified)</h3>
      <input value={form.skills?.join(", ")} disabled />

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
        value={form.experienceYears}
        onChange={handleChange}
      />

      <textarea
        name="pastWorkDescription"
        placeholder="Describe your past work"
        value={form.pastWorkDescription}
        onChange={handleChange}
      />

      <textarea
        name="certifications"
        placeholder="Certifications"
        value={form.certifications}
        onChange={handleChange}
      />

      <input
        name="languages"
        placeholder="Languages Known"
        value={form.languages}
        onChange={handleChange}
      />

      <h3>Location</h3>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "300px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={position}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const latlng = e.target.getLatLng();
              setPosition([latlng.lat, latlng.lng]);
            }
          }}
        />
      </MapContainer>

      <button onClick={saveProfile}>Save Changes</button>
    </div></div>
  );
};

export default WorkerProfile;