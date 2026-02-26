import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ChangeMapView({ center }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

export default function LocationPicker({ setLocationData }) {
  const [position, setPosition] = useState(null);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // 🔍 Search API
  const handleSearch = async (value) => {
    setSearch(value);

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${value}, Kerala&addressdetails=1`
    );

    const data = await res.json();
    setSuggestions(data);
  };

  // 📍 Select Suggestion
  const handleSelect = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);

    setPosition([lat, lon]);
    setSuggestions([]);
    setSearch(place.display_name);

    const address = place.address;

    setLocationData({
      latitude: lat,
      longitude: lon,
      address: place.display_name,
      pincode: address.postcode || "",
      city: address.city || address.town || address.village || "",
      district: address.county || "",
      state: address.state || "",
    });
  };

  return (
    <div>
      {/* 🔍 Search Input */}
      <input
        type="text"
        placeholder="Search your place in Kerala..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "5px" }}
      />

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div
          style={{
            maxHeight: "150px",
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #ddd",
            marginBottom: "5px",
          }}
        >
          {suggestions.map((place) => (
            <div
              key={place.place_id}
              style={{ padding: "8px", cursor: "pointer" }}
              onClick={() => handleSelect(place)}
            >
              {place.display_name}
            </div>
          ))}
        </div>
      )}

      {/* 🗺 Map */}
      <MapContainer
        center={[10.8505, 76.2711]}
        zoom={7}
        style={{ height: "300px", width: "100%", borderRadius: "10px" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && <Marker position={position} icon={markerIcon} />}
        {position && <ChangeMapView center={position} />}
      </MapContainer>
    </div>
  );
}
