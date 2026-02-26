const sendMessage = async (req, res) => {
  try {
    const { connectionId, message, type, budgetAmount } = req.body;

    const connection = await Connection.findById(connectionId)
      .populate("task");

    if (!connection)
      return res.status(404).json({ message: "Connection not found" });

    // 🚫 Only accepted connections can chat
    if (!["accepted", "provider_confirmed", "confirmed"].includes(connection.status)) {
  return res.status(400).json({
    message: "Chat not enabled",
  });
}

    // 🔒 If task completed → read only
    if (connection.task.status === "completed") {
      return res.status(400).json({
        message: "Chat is read-only",
      });
    }

    // 💰 BUDGET NEGOTIATION RULE
    if (type === "budget") {
      if (budgetAmount < connection.task.budget) {
        return res.status(400).json({
          message: "Budget must be same or higher than original",
        });
      }
    }

    const newMessage = await Message.create({
      connection: connectionId,
      sender: req.user.userId,
      message,
      type,
      budgetAmount,
    });

    res.json(newMessage);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
