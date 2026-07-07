const { isAuthorized, unauthorizedResponse } = require("../lib/auth");
const { addDonation } = require("../lib/store");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!isAuthorized(req)) {
    return unauthorizedResponse(res);
  }

  const { teamId, amount } = req.body || {};

  if (!teamId || typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "teamId and a positive amount are required." });
  }

  try {
    const { team, state } = await addDonation(teamId, amount);
    res.json({ ok: true, team, state });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }

    console.error("Failed to add donation:", error.message);
    res.status(500).json({ error: "Could not add donation." });
  }
};
