const STAFF_SECRET = (process.env.STAFF_SECRET || "").trim();

function requiresStaffAuth() {
  return Boolean(STAFF_SECRET);
}

function isAuthorized(req) {
  if (!STAFF_SECRET) return true;
  const provided = String(req.headers["x-staff-secret"] || "").trim();
  return provided === STAFF_SECRET;
}

function unauthorizedResponse(res) {
  return res.status(401).json({ error: "Staff authorization required." });
}

module.exports = {
  requiresStaffAuth,
  isAuthorized,
  unauthorizedResponse
};
