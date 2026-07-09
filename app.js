const MATCHUP_DATA_PATH = "data/matchup_probabilities.csv";
const INDICATOR_DATA_PATH = "data/team_efficiency_indicators.csv";
const DATA_REPO_URL = "https://github.com/mahmudhasanttu/fifa-scraped-match-data";

let matchupData = [];
let indicatorData = [];

const elements = {
  form: document.getElementById("predictor-form"),
  teamASelect: document.getElementById("team-a"),
  teamBSelect: document.getElementById("team-b"),
  message: document.getElementById("message"),
  results: document.getElementById("results"),
  matchupTitle: document.getElementById("matchup-title"),
  teamAInitial: document.getElementById("team-a-initial"),
  teamBInitial: document.getElementById("team-b-initial"),
  teamAOutcome: document.getElementById("team-a-outcome"),
  teamBOutcome: document.getElementById("team-b-outcome"),
  teamAProbability: document.getElementById("team-a-probability"),
  drawProbability: document.getElementById("draw-probability"),
  teamBProbability: document.getElementById("team-b-probability"),
  teamASummaryInitial: document.getElementById("team-a-summary-initial"),
  teamBSummaryInitial: document.getElementById("team-b-summary-initial"),
  teamASummaryName: document.getElementById("team-a-summary-name"),
  teamBSummaryName: document.getElementById("team-b-summary-name"),
  teamASummaryMatches: document.getElementById("team-a-summary-matches"),
  teamBSummaryMatches: document.getElementById("team-b-summary-matches"),
  teamAHeader: document.getElementById("team-a-header"),
  teamBHeader: document.getElementById("team-b-header"),
  indicatorTableBody: document.getElementById("indicator-table-body"),
  repoLink: document.getElementById("repo-link")
};

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      row.push(cell);
      if (row.some(value => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some(value => value.trim() !== "")) {
      rows.push(row);
    }
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map(header => header.trim());
  return rows.slice(1).map(values => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = values[index] !== undefined ? values[index].trim() : "";
    });
    return item;
  });
}

async function loadCSV(path) {
  const cacheBuster = `v=${Date.now()}`;
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${path}${separator}${cacheBuster}`);

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  const text = await response.text();
  return parseCSV(text);
}

function getInitial(teamName) {
  return normalizeName(teamName).charAt(0).toUpperCase();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatPercent(value) {
  return `${(toNumber(value) * 100).toFixed(1)}%`;
}

function formatDecimal(value, digits = 3) {
  return toNumber(value).toFixed(digits);
}

function formatNumber(value, digits = 2) {
  return toNumber(value).toFixed(digits);
}

function setMessage(text) {
  elements.message.textContent = text || "";
}

function findIndicator(teamName) {
  const selected = normalizeName(teamName);
  return indicatorData.find(row => normalizeName(row.Team) === selected);
}

function findMatchup(teamA, teamB) {
  const selectedA = normalizeName(teamA);
  const selectedB = normalizeName(teamB);

  return matchupData.find(row =>
    normalizeName(row.Team_A) === selectedA &&
    normalizeName(row.Team_B) === selectedB
  );
}

function populateDropdowns() {
  const teams = [...new Set(indicatorData.map(row => normalizeName(row.Team)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  for (const team of teams) {
    const optionA = document.createElement("option");
    optionA.value = team;
    optionA.textContent = team;

    const optionB = document.createElement("option");
    optionB.value = team;
    optionB.textContent = team;

    elements.teamASelect.appendChild(optionA);
    elements.teamBSelect.appendChild(optionB);
  }
}

function renderPrediction(teamA, teamB, matchup) {
  elements.matchupTitle.textContent = `${teamA} vs ${teamB}`;

  elements.teamAInitial.textContent = getInitial(teamA);
  elements.teamBInitial.textContent = getInitial(teamB);

  elements.teamAOutcome.textContent = `${teamA} win`;
  elements.teamBOutcome.textContent = `${teamB} win`;

  elements.teamAProbability.textContent = formatPercent(matchup.Team_A_Win_Prob);
  elements.drawProbability.textContent = formatPercent(matchup.Draw_Prob);
  elements.teamBProbability.textContent = formatPercent(matchup.Team_B_Win_Prob);
}

function renderTeamSummaries(teamA, teamB, indicatorA, indicatorB) {
  elements.teamASummaryInitial.textContent = getInitial(teamA);
  elements.teamBSummaryInitial.textContent = getInitial(teamB);

  elements.teamASummaryName.textContent = teamA;
  elements.teamBSummaryName.textContent = teamB;

  elements.teamASummaryMatches.textContent =
    `${indicatorA.Matches_Played} matches played, ${indicatorA.Complete_Efficiency_Matches} complete efficiency matches`;

  elements.teamBSummaryMatches.textContent =
    `${indicatorB.Matches_Played} matches played, ${indicatorB.Complete_Efficiency_Matches} complete efficiency matches`;

  elements.teamAHeader.textContent = teamA;
  elements.teamBHeader.textContent = teamB;
}

function renderIndicatorTable(indicatorA, indicatorB) {
  const indicators = [
    {
      label: "Matches played",
      subtitle: "Number of team-match rows in the dataset",
      key: "Matches_Played",
      format: value => String(Math.round(toNumber(value)))
    },
    {
      label: "Complete efficiency matches",
      subtitle: "Rows with the main efficiency inputs available",
      key: "Complete_Efficiency_Matches",
      format: value => String(Math.round(toNumber(value)))
    },
    {
      label: "Goal conversion strength",
      subtitle: "Goals divided by total attempts",
      key: "Goal_Conversion_Strength",
      format: formatDecimal
    },
    {
      label: "Shot accuracy",
      subtitle: "On-target attempts divided by total attempts",
      key: "Shot_Accuracy",
      format: formatDecimal
    },
    {
      label: "Attacking strength",
      subtitle: "Goals per match",
      key: "Attacking_Strength",
      format: formatNumber
    },
    {
      label: "Pass completion rate",
      subtitle: "Completed passes divided by total passes",
      key: "Pass_Completion_Rate",
      format: formatDecimal
    },
    {
      label: "Pressing efficiency",
      subtitle: "Forced turnovers divided by pressing applied",
      key: "Pressing_Efficiency",
      format: formatDecimal
    },
    {
      label: "Forced turnovers",
      subtitle: "Forced turnovers per match",
      key: "Forced_Turnovers_Per_Match",
      format: formatNumber
    }
  ];

  elements.indicatorTableBody.innerHTML = "";

  for (const indicator of indicators) {
    const tr = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.innerHTML = `
      <span class="indicator-name">${indicator.label}</span>
      <span class="indicator-subtitle">${indicator.subtitle}</span>
    `;

    const teamACell = document.createElement("td");
    teamACell.textContent = indicator.format(indicatorA[indicator.key]);

    const teamBCell = document.createElement("td");
    teamBCell.textContent = indicator.format(indicatorB[indicator.key]);

    tr.appendChild(nameCell);
    tr.appendChild(teamACell);
    tr.appendChild(teamBCell);
    elements.indicatorTableBody.appendChild(tr);
  }
}

function handleCompare(event) {
  event.preventDefault();

  const teamA = normalizeName(elements.teamASelect.value);
  const teamB = normalizeName(elements.teamBSelect.value);

  if (!teamA || !teamB) {
    setMessage("Please select two teams.");
    elements.results.hidden = true;
    return;
  }

  if (teamA === teamB) {
    setMessage("Please select two different teams.");
    elements.results.hidden = true;
    return;
  }

  const matchup = findMatchup(teamA, teamB);
  const indicatorA = findIndicator(teamA);
  const indicatorB = findIndicator(teamB);

  if (!matchup) {
    setMessage(`No matchup probability found for ${teamA} vs ${teamB}.`);
    elements.results.hidden = true;
    return;
  }

  if (!indicatorA || !indicatorB) {
    setMessage("Team efficiency indicators are missing for one selected team.");
    elements.results.hidden = true;
    return;
  }

  setMessage("");
  renderPrediction(teamA, teamB, matchup);
  renderTeamSummaries(teamA, teamB, indicatorA, indicatorB);
  renderIndicatorTable(indicatorA, indicatorB);

  elements.results.hidden = false;
}

async function init() {
  try {
    if (elements.repoLink) {
      elements.repoLink.href = DATA_REPO_URL;
    }

    const [matchups, indicators] = await Promise.all([
      loadCSV(MATCHUP_DATA_PATH),
      loadCSV(INDICATOR_DATA_PATH)
    ]);

    matchupData = matchups;
    indicatorData = indicators;

    populateDropdowns();

    elements.form.addEventListener("submit", handleCompare);
    setMessage("");
  } catch (error) {
    console.error(error);
    setMessage("Data could not be loaded. Please check the data folder and CSV file names.");
  }
}

init();
