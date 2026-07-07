const { isAuthorized, unauthorizedResponse } = require("../lib/auth");
const { resetTeams } = require("../lib/store");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!isAuthorized(req)) {
    return unauthorizedResponse(res);
  }

  try {
    const state = await resetTeams();
    res.json({ ok: true, state });
  } catch (error) {
    console.error("Failed to reset teams:", error.message);
    res.status(500).json({ error: "Could not reset teams." });
  }
};
