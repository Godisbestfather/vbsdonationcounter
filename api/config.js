const { requiresStaffAuth } = require("../lib/auth");
const { usesSupabase } = require("../lib/store");

module.exports = async (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({
    version: "2026-07-07",
    requiresAuth: requiresStaffAuth(),
    storage: usesSupabase() ? "supabase" : "file"
  });
};
