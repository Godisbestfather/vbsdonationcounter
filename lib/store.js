const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const DATA_FILE = path.join(__dirname, "..", "data.json");

const DEFAULT_STATE = {
  fillMax: 750,
  teams: [
    { id: "red", name: "Red Team", color: "#ff5a5a", emoji: "🍓", total: 0 },
    { id: "blue", name: "Blue Team", color: "#4dabff", emoji: "🐬", total: 0 },
    { id: "green", name: "Green Team", color: "#45d66a", emoji: "🌴", total: 0 },
    { id: "yellow", name: "Yellow Team", color: "#facc15", emoji: "🍋", total: 0 },
    { id: "orange", name: "Orange Team", color: "#ff8c32", emoji: "🍊", total: 0 },
    { id: "silver", name: "Silver Team", color: "#c0c0c0", emoji: "💎", total: 0 }
  ]
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

let fileState = loadFileState();

function isVercel() {
  return Boolean(process.env.VERCEL);
}

function usesSupabase() {
  return Boolean(supabase);
}

function loadFileState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return {
        ...structuredClone(DEFAULT_STATE),
        ...saved,
        teams: saved.teams ?? DEFAULT_STATE.teams
      };
    }
  } catch {
    // fall through to default
  }
  return structuredClone(DEFAULT_STATE);
}

function saveFileState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function mapTeamRow(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    emoji: row.emoji,
    total: Number(row.total)
  };
}

async function loadStateFromSupabase() {
  const [{ data: settings, error: settingsError }, { data: teams, error: teamsError }] =
    await Promise.all([
      supabase.from("settings").select("fill_max").eq("id", 1).single(),
      supabase.from("teams").select("id, name, color, emoji, total").order("id")
    ]);

  if (settingsError) throw settingsError;
  if (teamsError) throw teamsError;

  return {
    fillMax: Number(settings.fill_max),
    teams: teams.map(mapTeamRow)
  };
}

async function getState() {
  if (supabase) {
    return loadStateFromSupabase();
  }

  if (isVercel()) {
    throw new Error(
      "Supabase is required on Vercel. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return fileState;
}

async function addDonation(teamId, amount) {
  if (supabase) {
    const { data: team, error } = await supabase.rpc("add_donation", {
      p_team_id: teamId,
      p_amount: amount
    });

    if (error) {
      if (error.message.includes("Team not found")) {
        const notFound = new Error("Team not found.");
        notFound.statusCode = 404;
        throw notFound;
      }
      throw error;
    }

    return { team: mapTeamRow(team), state: await getState() };
  }

  if (isVercel()) {
    throw new Error(
      "Supabase is required on Vercel. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const team = fileState.teams.find((entry) => entry.id === teamId);
  if (!team) {
    const notFound = new Error("Team not found.");
    notFound.statusCode = 404;
    throw notFound;
  }

  team.total = Math.round((team.total + amount) * 100) / 100;
  saveFileState(fileState);
  return { team, state: fileState };
}

async function resetTeams() {
  if (supabase) {
    const { error } = await supabase.rpc("reset_all_teams");
    if (error) throw error;
    return getState();
  }

  if (isVercel()) {
    throw new Error(
      "Supabase is required on Vercel. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  fileState = structuredClone(DEFAULT_STATE);
  saveFileState(fileState);
  return fileState;
}

module.exports = {
  DEFAULT_STATE,
  usesSupabase,
  getState,
  addDonation,
  resetTeams
};
