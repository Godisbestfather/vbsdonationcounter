require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const express = require("express");
const path = require("path");
const { isAuthorized, unauthorizedResponse, requiresStaffAuth } = require("./lib/auth");
const { getState, addDonation, resetTeams, usesSupabase } = require("./lib/store");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

app.use(express.json());

app.get("/manifest.json", (_req, res) => {
  res.type("application/manifest+json");
  res.sendFile(path.join(PUBLIC_DIR, "manifest.json"));
});

app.get("/sw.js", (_req, res) => {
  res.set("Cache-Control", "no-cache");
  res.sendFile(path.join(PUBLIC_DIR, "sw.js"));
});

app.use(express.static(PUBLIC_DIR));

app.get("/api/config", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({
    version: "2026-07-07",
    requiresAuth: requiresStaffAuth(),
    storage: usesSupabase() ? "supabase" : "file"
  });
});

app.get("/api/state", async (_req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    res.json(await getState());
  } catch (error) {
    console.error("Failed to load state:", error.message);
    res.status(500).json({ error: "Could not load donation state." });
  }
});

app.post("/api/login", async (req, res) => {
  res.set("Cache-Control", "no-store");

  const { password } = req.body || {};
  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Password is required." });
  }

  if (!isAuthorized({ headers: { "x-staff-secret": password.trim() } })) {
    return unauthorizedResponse(res);
  }

  res.json({ ok: true });
});

app.post("/api/donate", async (req, res) => {
  if (!isAuthorized(req)) {
    return unauthorizedResponse(res);
  }

  const { teamId, amount } = req.body;

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
});

app.post("/api/reset", async (req, res) => {
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
});

app.listen(PORT, () => {
  console.log(`VBS Donation Counter running at http://localhost:${PORT}`);
  console.log(`Display board: http://localhost:${PORT}/`);
  console.log(`Staff admin:   http://localhost:${PORT}/admin.html`);
  console.log(`Storage:       ${usesSupabase() ? "Supabase" : "local data.json"}`);
});
