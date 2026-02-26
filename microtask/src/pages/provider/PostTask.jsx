import { useState,useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./PostTask.css";
import { useLocation,useNavigate} from "react-router-dom";



/* =========================
   SKILL CATEGORIES
========================= */

const SKILL_CATEGORIES = {
  "Construction & Technical": [
    "Plumber",
    "Electrician",
    "Carpenter",
    "Mason",
    "Painter",
    "Welder",
    "Tile Worker",
    "Construction Helper"
  ],

  "Home & Domestic": [
    "House Cleaner",
    "Housekeeper",
    "Cook",
    "Gardener"
  ],

  "Transport & Delivery": [
    "Car Driver",
    "Auto Driver",
    "Delivery Worker"
  ],

  "General Labor": [
    "General Helper",
    "Loading & Unloading Worker",
    "Security Guard",
    "Warehouse Worker",
    "Factory Worker"
  ],

  "Technical Service": [
    "AC Technician",
    "Refrigerator Technician",
    "Mobile Repair Technician",
    "CCTV Installer"
  ],

  "Education": [
    "Home Tutor",
    "Math Tutor",
    "Science Tutor",
    "English Tutor",
    "Computer Tutor",
    "Spoken English Trainer"
  ]
};

const CATEGORY_ICONS = {
  "Construction & Technical": "🛠️",
  "Home & Domestic": "🏠",
  "Transport & Delivery": "🚚",
  "General Labor": "👷",
  "Education": "📚"
};


/* =========================
   FIX LEAFLET ICON ISSUE
========================= */

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});


/* =========================
   MAP HELPERS
========================= */

const ChangeMapView = ({ center }) => {
  const map = useMap();
  if (center) map.setView(center, 12);
  return null;
};

const LocationPicker = ({ setForm, markerPosition, setMarkerPosition }) => {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;

      setMarkerPosition([lat, lng]);

      setForm(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();

        if (data.display_name) {
          setForm(prev => ({
            ...prev,
            addressSearch: data.display_name,
          }));
        }
      } catch {
        console.log("Reverse geocode failed");
      }
    },
  });

  return markerPosition ? <Marker position={markerPosition} /> : null;
};

/* =========================
   MAIN COMPONENT
========================= */

const PostTask = ({ goToMyTasks }) => {
const navigate = useNavigate();
const [form, setForm] = useState({
  title: "",
  description: "",
  requiredSkill: "",

  addressSearch: "",
  latitude: "",
  longitude: "",

houseName: "",
area: "",
landmark: "",
instructions: "",


  taskDate: "",
  budget: "",
  urgency: "normal",
});


  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [skillSearch, setSkillSearch] = useState("");
  const [showSkillBox, setShowSkillBox] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get("edit");

const skillRef = useRef(null);

useEffect(() => {
  if (editId) {
    fetchTask();
  }
}, [editId]);

const fetchTask = async () => {
  try {
    const res = await fetch(
      `http://localhost:5000/api/tasks/${editId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();

setForm({
  title: data.title || "",
  description: data.description || "",
  requiredSkill: data.requiredSkill || "",
  taskDate: data.taskDate?.slice(0, 10) || "",
  budget: data.budget || "",
  urgency: data.urgency || "normal",

  houseName: data.siteAddress?.houseName || "",
  area: data.siteAddress?.area || "",
  landmark: data.siteAddress?.landmark || "",
  instructions: data.siteAddress?.instructions || "",

  latitude: data.location?.coordinates[1],
  longitude: data.location?.coordinates[0],
});


    setSkillSearch(data.requiredSkill);

    if (data.location?.coordinates) {
      setMarkerPosition([
        data.location.coordinates[1],
        data.location.coordinates[0]
      ]);
    }

  } catch (err) {
    console.error("Edit fetch error:", err);
  }
};


useEffect(() => {
  const handleClickOutside = (e) => {
    if (skillRef.current && !skillRef.current.contains(e.target)) {
      setShowSkillBox(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);


  /* =========================
     LOCATION SEARCH
  ========================= */

  const searchLocation = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=in&viewbox=74.85,12.79,77.42,8.17&bounded=1`
    );

    const data = await res.json();
    setSuggestions(data);
  };

  const selectLocation = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);

    setMarkerPosition([lat, lon]);

    setForm(prev => ({
      ...prev,
      addressSearch: place.display_name,
      latitude: lat,
      longitude: lon,
    }));

    setSearchQuery(place.display_name);
    setSuggestions([]);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.latitude) {
      alert("Please select work location on map");
      return;
    }

    if (!form.houseName || !form.area) {
      alert("Please enter complete site address");
      return;
    }

    try {
      // ✅ CREATE FORMDATA
const formData = new FormData();

// append all normal fields
Object.keys(form).forEach((key) => {
  if (key !== "images") {
    formData.append(key, form[key]);
  }
});

// append images separately
if (form.images) {
  for (let i = 0; i < form.images.length; i++) {
    formData.append("images", form.images[i]);
  }
}

const url = editId
  ? `http://localhost:5000/api/tasks/${editId}`
  : "http://localhost:5000/api/tasks";

const method = editId ? "PUT" : "POST";

const res = await fetch(url, {
  method,
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
  body: formData,
});

 if (res.ok) {
      alert(editId ? "Task updated successfully!" : "Task posted successfully!");
      goToMyTasks();



    } else {
      alert("Failed to post task");
    }

  } catch (error) {
    console.error(error);
    alert("Server error");
  }
};

  return (
    <div className="post-task-wrapper">

  {editId && (
    <div className="back-container">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/provider-dashboard?tab=my-tasks")}
      >
        Back
      </button>
    </div>
  )}

  <div className="post-task-card">
    <h2>{editId ? "Edit Task" : "Post New Task"}</h2>


        <form onSubmit={handleSubmit} className="post-task-form">

          {/* TITLE */}
          <div className="form-group">
            <label>Task Title</label>
            <input
  type="text"
  name="title"
  value={form.title}
  onChange={handleChange}
  required
/>

          </div>

          {/* REQUIRED SKILL */}
<div className="form-group" ref={skillRef}>
  <label>Who do you need? *</label>

  <input
    type="text"
    placeholder="Search skill..."
    value={skillSearch}
    onChange={(e) => {
      setSkillSearch(e.target.value);
      setShowSkillBox(true);
      setActiveIndex(-1);
    }}
    onFocus={() => setShowSkillBox(true)}
    onKeyDown={(e) => {
      const flatSkills = Object.values(SKILL_CATEGORIES).flat();

      if (e.key === "ArrowDown") {
        setActiveIndex((prev) =>
          prev < flatSkills.length - 1 ? prev + 1 : prev
        );
      }

      if (e.key === "ArrowUp") {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }

      if (e.key === "Enter" && activeIndex >= 0) {
        const selectedSkill = flatSkills[activeIndex];
        setForm({ ...form, requiredSkill: selectedSkill });
        setSkillSearch(selectedSkill);
        setShowSkillBox(false);
      }
    }}
    required
  />

  {showSkillBox && (
    <div className="skill-dropdown">
      {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => {
        const filtered = skills.filter((skill) =>
          skill.toLowerCase().includes(skillSearch.toLowerCase())
        );

        if (filtered.length === 0) return null;

        return (
          <div key={category}>
            <div className="skill-category">
              {CATEGORY_ICONS[category]} {category}
            </div>

            {filtered.map((skill, index) => {
              const matchIndex = skill
                .toLowerCase()
                .indexOf(skillSearch.toLowerCase());

              const before = skill.slice(0, matchIndex);
              const match = skill.slice(
                matchIndex,
                matchIndex + skillSearch.length
              );
              const after = skill.slice(
                matchIndex + skillSearch.length
              );

              return (
                <div
                  key={skill}
                  className={`skill-option ${
                    activeIndex === index ? "active-skill" : ""
                  }`}
                  onClick={() => {
                    setForm({ ...form, requiredSkill: skill });
                    setSkillSearch(skill);
                    setShowSkillBox(false);
                  }}
                >
                  {matchIndex >= 0 ? (
                    <>
                      {before}
                      <span className="highlight">{match}</span>
                      {after}
                    </>
                  ) : (
                    skill
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  )}

  {form.requiredSkill && (
    <p className="selected-skill">
      Selected: {form.requiredSkill}
    </p>
  )}
</div>


          {/* DESCRIPTION */}
          <div className="form-group">
            <label>Description</label>

           <textarea
  name="description"
  value={form.description}
  onChange={handleChange}
  required
/>

          </div>

          {/* LOCATION SEARCH */}
          <div className="form-group">
            <label>Search Area (Kerala Only)</label>
            <input
              type="text"
              value={searchQuery}
              placeholder="Search city, area, landmark..."
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchLocation(e.target.value);
              }}
            />

            {suggestions.length > 0 && (
              <div className="suggestions-box">
                {suggestions.slice(0, 5).map((place) => (
                  <div
                    key={place.place_id}
                    className="suggestion-item"
                    onClick={() => selectLocation(place)}
                  >
                    {place.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MAP */}
          <div className="form-group">
            <label>Confirm Exact Work Location</label>
            <div className="map-box">
              <MapContainer
                center={[10.8505, 76.2711]}
                zoom={7}
                minZoom={7}
                maxBounds={[
                  [8.17, 74.85],
                  [12.79, 77.42],
                ]}
                maxBoundsViscosity={1.0}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <LocationPicker
                  setForm={setForm}
                  markerPosition={markerPosition}
                  setMarkerPosition={setMarkerPosition}
                />

                {markerPosition && (
                  <ChangeMapView center={markerPosition} />
                )}
              </MapContainer>
            </div>
          </div>

          {/* SITE ADDRESS */}
          <h3 className="section-heading">Work Site Address</h3>

          <div className="form-group">
          <label>House / Building Name *</label>
<input
  type="text"
  name="houseName"
  value={form.houseName}
  onChange={handleChange}
  required
/>



          </div>

          <div className="form-group">
            <label>Area / Street *</label>
            <input
             type="text"
              name="area" 
              onChange={handleChange}
               required 
               />
          </div>

          <div className="form-group">
            <label>Landmark (Optional)</label>
            <input 
            type="text"
             name="landmark"
             value={form.landmark}
              onChange={handleChange}
               />
          </div>

          <div className="form-group">
            <label>Additional Instructions (Optional)</label>
            <textarea 
            name="instructions" 
            value={form.instructions}
            onChange={handleChange} 
            />
          </div>

          {/* DATE + BUDGET + URGENCY */}
          <div className="form-row">
            <div className="form-group">
              <label>Task Date</label>

              <input 
              type="date"
               name="taskDate"
               value={form.taskDate}
                onChange={handleChange} 
                required
                 />
            </div>

            <div className="form-group">
              <label>Budget (₹)</label>

              <input
               type="number"
                name="budget"
                value={form.budget}
                 onChange={handleChange} 
                 required
                  />
            </div>

            <div className="form-group">
              <label>Urgency</label>
              <select
  name="urgency"
  value={form.urgency}
  onChange={handleChange}
>

                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
         <div className="form-group">
  <label>Upload Work Images (Optional)</label>
  <input
    type="file"
    name="images"
    multiple
    accept="image/*"
    onChange={(e) =>
      setForm({
        ...form,
        images: e.target.files,
      })
    }
  />
</div>
    
          <button type="submit" className="submit-btn">
  {editId ? "Update Task" : "Post Task"}
</button>


        </form>
      </div>
    </div>
  );
};

export default PostTask;
