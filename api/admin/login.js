const { isAuthorized, unauthorizedResponse } = require("../../lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  res.setHeader("Cache-Control", "no-store");

  const { password } = req.body || {};
  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Password is required." });
  }

  const authorized = isAuthorized({
    headers: { "x-staff-secret": password }
  });

  if (!authorized) {
    return unauthorizedResponse(res);
  }

  res.json({ ok: true });
};
