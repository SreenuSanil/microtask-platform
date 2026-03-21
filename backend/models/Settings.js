const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  supportEmail: String,

  loginEnabled: Boolean,

  userControls: {
    allowWorkerRegistration: Boolean,
    allowProviderRegistration: Boolean
  },

  maintenanceMode: Boolean,
  maintenanceMessage: String,

  commissionPercent: Number,
  minWithdrawal: Number
});

module.exports = mongoose.model("Settings", settingsSchema);