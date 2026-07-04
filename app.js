const MATCHUP_DATA_PATH = "data/matchup_probabilities.csv";
const INDICATOR_DATA_PATH = "data/team_efficiency_indicators.csv";

// Replace "#" with your public data/methodology GitHub repository link later.
const DATA_REPO_URL = "https://github.com/mahmudhasanttu/fifa-scraped-match-data";

const indicatorConfig = [
  {
    key: "Matches_Played",
    label: "Matches played",
    description: "Total matches in raw FIFA data",
    suffix: "",
    decimals: 0
  },
  {
    key: "Complete_Efficiency_Matches",
    label: "Complete efficiency matches",
    description: "Matches with complete efficiency indicators",
    suffix: "",
    decimals: 0
  },
  {
    key: "Goal_Conversion_Strength",
    label: "Goal conversion strength",
    description: "Goals per shot on target",
    suffix: "%",
    decimals: 1
  },
  {
    key: "Shot_Accuracy",
    label: "Shot accuracy",
    description: "Shots on target per total attempt",
    suffix: "%",
    decimals: 1
  },
  {
    key: "Attacking_Strength",
    label: "Attacking strength",
    description: "Total attempts per final-third entry",
    suffix: "",
    decimals: 3
  },
  {
    key: "Pass_Completion_Rate",
    label: "Pass completion rate",
    description: "Completed passes per total pass",
    suffix: "%",
    decimals: 1
  },
  {
    key: "Pressing_Efficiency",
    label: "Pressing efficiency",
    description: "Forced turnovers per pressing applied",
    suffix: "%",
    decimals: 1
  },
  {
    key: "Forced_Turnovers",
    label: "Forced turnovers",
    description: "Average forced turnovers per match",
    suffix: "",
    decimals: 1
  }
];

const form = document.getElementById("predictor-form");
const teamASelect = document.getElementById("team-a");
const teamBSelect = document.getElementById("team-b");
const message = document.getElementById("message");
const results = document.getElementById("results");

let matchupLookup = new Map();
let indicatorLookup = new Map();

document.getElementById("repo-link").href = DATA_REPO_URL;

function splitCSVLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function parseCSV(text) {
  const rows = [];
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCSVLine(lines[0]).map((value) => value.trim());

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;

    const values = splitCSVLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : "";
    });

    rows.push(row);
  }

  return rows;
}

function key(teamA, teamB) {
  return `${teamA}|||${teamB}`;
}

function initials(team) {
  return team
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

function formatProbability(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(1)}%` : "—";
}

function formatIndicator(value, suffix, decimals) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `${number.toFixed(decimals)}${suffix}`;
}

function populateTeams(matchupRows, indicatorRows) {
  const teams = [...new Set([
    ...matchupRows.flatMap((row) => [row.Team_A, row.Team_B]),
    ...indicatorRows.map((row) => row.Team)
  ])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  for (const team of teams) {
    const optionA = document.createElement("option");
    optionA.value = team;
    optionA.textContent = team;

    const optionB = optionA.cloneNode(true);

    teamASelect.appendChild(optionA);
    teamBSelect.appendChild(optionB);
  }
}

async function loadCSV(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }
  return parseCSV(await response.text());
}

async function init() {
  try {
    const [matchupRows, indicatorRows] = await Promise.all([
      loadCSV(MATCHUP_DATA_PATH),
      loadCSV(INDICATOR_DATA_PATH)
    ]);

    matchupLookup = new Map(
      matchupRows.map((row) => [key(row.Team_A, row.Team_B), row])
    );

    indicatorLookup = new Map(
      indicatorRows.map((row) => [row.Team, row])
    );

    populateTeams(matchupRows, indicatorRows);
  } catch (error) {
    console.error(error);
    message.textContent =
      "Prediction data could not be loaded. Check that both CSV files are inside the data folder.";
  }
}

function renderProbabilities(teamA, teamB, matchup) {
  document.getElementById("matchup-title").textContent =
    `${teamA} vs ${teamB}`;

  document.getElementById("team-a-initial").textContent = initials(teamA);
  document.getElementById("team-b-initial").textContent = initials(teamB);

  document.getElementById("team-a-outcome").textContent = `${teamA} win`;
  document.getElementById("team-b-outcome").textContent = `${teamB} win`;

  document.getElementById("team-a-probability").textContent =
    formatProbability(matchup.Team_A_Win);
  document.getElementById("draw-probability").textContent =
    formatProbability(matchup.Draw);
  document.getElementById("team-b-probability").textContent =
    formatProbability(matchup.Team_B_Win);
}

function renderIndicators(teamA, teamB) {
  const teamAIndicators = indicatorLookup.get(teamA);
  const teamBIndicators = indicatorLookup.get(teamB);

  document.getElementById("team-a-header").textContent = teamA;
  document.getElementById("team-b-header").textContent = teamB;

  document.getElementById("team-a-summary-initial").textContent = initials(teamA);
  document.getElementById("team-b-summary-initial").textContent = initials(teamB);
  document.getElementById("team-a-summary-name").textContent = teamA;
  document.getElementById("team-b-summary-name").textContent = teamB;

  document.getElementById("team-a-summary-matches").textContent = teamAIndicators
    ? `${teamAIndicators.Matches_Played} matches · ${teamAIndicators.Complete_Efficiency_Matches} complete efficiency matches`
    : "—";

  document.getElementById("team-b-summary-matches").textContent = teamBIndicators
    ? `${teamBIndicators.Matches_Played} matches · ${teamBIndicators.Complete_Efficiency_Matches} complete efficiency matches`
    : "—";

  const body = document.getElementById("indicator-table-body");
  body.innerHTML = "";

  for (const indicator of indicatorConfig) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.innerHTML = `
      <span class="indicator-name">${indicator.label}</span>
      <span class="indicator-subtitle">${indicator.description}</span>
    `;

    const teamACell = document.createElement("td");
    teamACell.textContent = teamAIndicators
      ? formatIndicator(teamAIndicators[indicator.key], indicator.suffix, indicator.decimals)
      : "—";

    const teamBCell = document.createElement("td");
    teamBCell.textContent = teamBIndicators
      ? formatIndicator(teamBIndicators[indicator.key], indicator.suffix, indicator.decimals)
      : "—";

    row.appendChild(nameCell);
    row.appendChild(teamACell);
    row.appendChild(teamBCell);
    body.appendChild(row);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  message.textContent = "";

  const teamA = teamASelect.value;
  const teamB = teamBSelect.value;

  if (!teamA || !teamB) {
    message.textContent = "Please select both teams.";
    return;
  }

  if (teamA === teamB) {
    message.textContent = "Please select two different teams.";
    return;
  }

  const matchup = matchupLookup.get(key(teamA, teamB));

  if (!matchup) {
    message.textContent = "This matchup was not found in the precomputed data.";
    return;
  }

  renderProbabilities(teamA, teamB, matchup);
  renderIndicators(teamA, teamB);

  results.hidden = false;
  results.scrollIntoView({ behavior: "smooth", block: "start" });
});

init();
