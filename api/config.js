const { requiresStaffAuth } = require("../lib/auth");
const { usesSupabase } = require("../lib/store");

module.exports = async (_req, res) => {
  res.json({
    requiresAuth: requiresStaffAuth(),
    storage: usesSupabase() ? "supabase" : "file"
  });
};
