// controllers/authController.js

const User = require("../models/User");

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.name = req.body.name || user.name;
    user.organization = req.body.organization || user.organization;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;

    if (req.file) {
      user.profileImage = req.file.path;
    }

    await user.save();

    res.json(user);

  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
};
