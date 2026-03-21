const User = require("../models/User");
const multer = require("multer");

// STORAGE CONFIG
const storage = multer.diskStorage({
  destination: "uploads/work",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage }).fields([
  { name: "profileImage", maxCount: 1 },
  { name: "workImages", maxCount: 20 }, // unlimited-ish
]);

// ================= UPDATE PROFILE =================
exports.updateWorkerProfile = [
  upload,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // ✅ BASIC FIELDS
      const fields = [
        "name",
        "phone",
        "address",
        "bio",
        "experienceYears",
        "pastWorkDescription",
        "certifications",
      ];

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      });

      // ✅ LOCATION
      if (req.body.location) {
        user.location = JSON.parse(req.body.location);
      }

      // ✅ PROFILE IMAGE
      if (req.files?.profileImage) {
        user.profileImage = req.files.profileImage[0].path;
      }

      // ✅ EXISTING WORK IMAGES (after delete)
      if (req.body.existingWorkImages) {
        user.workImages = JSON.parse(req.body.existingWorkImages);
      }

      // ✅ NEW WORK IMAGES
      if (req.files?.workImages) {
        const newImages = req.files.workImages.map((f) => f.path);
        user.workImages = [...(user.workImages || []), ...newImages];
      }

      await user.save();

      res.json(user);

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
];

// ================= CHANGE PASSWORD =================
exports.changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (req.body.oldPassword !== user.password) {
      return res.status(400).json({ error: "Old password incorrect" });
    }

    user.password = req.body.newPassword;
    await user.save();

    res.json({ message: "Password updated" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};