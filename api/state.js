const { getState } = require("../lib/store");

module.exports = async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    res.json(await getState());
  } catch (error) {
    console.error("Failed to load state:", error.message);
    res.status(500).json({ error: "Could not load donation state." });
  }
};
