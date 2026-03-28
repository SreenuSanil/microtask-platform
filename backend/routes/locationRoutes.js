const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/search", async (req, res) => {
  try {

    const query = req.query.q;

    if (!query || query.length < 3) {
      return res.json([]);
    }

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query,
          format: "json",
          addressdetails: 1,
          limit: 5
        },
        headers: {
          "User-Agent": "tasknest-app"
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    if (error.response) {
      console.error("Nominatim error:", error.response.status);
    } else {
      console.error(error.message);
    }

    res.status(500).json({ error: "Location search failed" });
  }
});

// 📍 REVERSE GEOCODING (ADD THIS)
router.get("/reverse", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Missing lat/lon" });
    }

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          lat,
          lon,
          format: "json",
          addressdetails: 1
        },
        headers: {
          "User-Agent": "tasknest-app"
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error("Reverse error:", error.message);
    res.status(500).json({ error: "Reverse location failed" });
  }
});

module.exports = router;