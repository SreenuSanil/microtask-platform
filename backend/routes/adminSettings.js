const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");

// GET SETTINGS
router.get("/", async (req, res) => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({
      supportEmail: "",
      loginEnabled: true,
      userControls: {
        allowWorkerRegistration: true,
        allowProviderRegistration: true
      },
      maintenanceMode: false,
      maintenanceMessage: "",
      commissionPercent: 10
    });
  }

  res.json(settings);
});

// UPDATE SETTINGS
router.put("/", async (req, res) => {
  const updated = await Settings.findOneAndUpdate(
    {},
    req.body,
    { new: true, upsert: true }
  );

  res.json(updated);
});

module.exports = router;