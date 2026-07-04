# FIFA Efficiency Predictor Website

This rebuilt package removes emoji flags to avoid Windows/browser rendering issues such as `CA Canada`, `AU Australia`, or black flag icons.

It already includes your clean CSV files:

- `data/matchup_probabilities.csv`
- `data/team_efficiency_indicators.csv`

## Data/methodology repository link

Open `app.js` and replace:

```js
const DATA_REPO_URL = "#";
```

with your public GitHub data/methodology repository URL.

## Local test in RStudio

```r
setwd("C:/Users/mahmu/OneDrive/Desktop/efficiency_web_no_flags")
servr::httd(".", port = 8000)
```

Open:

```text
http://localhost:8000
```

Press Ctrl + F5 in the browser after replacing files or changing JavaScript.
