exports.updateWorkerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Editable fields
    user.name = req.body.name ?? user.name;
    user.phone = req.body.phone ?? user.phone;
    user.address = req.body.address ?? user.address;
    user.bio = req.body.bio ?? user.bio;
    user.experienceYears = req.body.experienceYears ?? user.experienceYears;
    user.pastWorkDescription = req.body.pastWorkDescription ?? user.pastWorkDescription;
    user.certifications = req.body.certifications ?? user.certifications;
    user.languages = req.body.languages ?? user.languages;

    // 🗺 Location update
    if (req.body.location) {
      user.location = req.body.location;
    }

    

    await user.save();

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.userId);

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return res.status(400).json({ message: "Wrong password" });

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password updated" });
};