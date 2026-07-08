const { isAuthorized, unauthorizedResponse } = require("../lib/auth");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Allow", "POST, OPTIONS");

  const method = String(req.method || "").toUpperCase();

  if (method === "OPTIONS") {
    return res.status(204).end();
  }

  if (method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { password } = req.body || {};
  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Password is required." });
  }

  const authorized = isAuthorized({
    headers: { "x-staff-secret": password.trim() }
  });

  if (!authorized) {
    return unauthorizedResponse(res);
  }

  res.json({ ok: true });
};
