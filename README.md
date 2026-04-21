# The Impact Quest

A choose-your-own-adventure game for teaching research impact development, built for workshops and training sessions.

Players take on the role of a researcher navigating the messy reality of turning published research into real-world impact — making decisions about stakeholder engagement, policy influence, community partnerships, and evidence gathering.

## Play the game

**Online:** If hosted on GitHub Pages, visit `https://YOUR-USERNAME.github.io/impact-quest/`

**Locally:** Download the repo and open `index.html` in any browser. The game loads its data from `game-data.json` in the same folder.

> **Note:** Opening `index.html` directly from your filesystem (double-click) won't work because browsers block local `fetch()` requests. You need either GitHub Pages or a simple local server — see below.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The game — loads and runs in any browser |
| `game-data.json` | All scenes, choices, scores, and images — edit this to change the game |
| `editor/` | Visual editor (runs inside Claude.ai) for editing game content |
| `README.md` | This file |

## Editing the game content

### Option 1: Edit the JSON directly

Open `game-data.json` in any text editor. Each scene looks like this:

```json
{
  "scene_id": {
    "title": "Scene Title",
    "narrative": "The story text the player reads.\n\nUse \\n for paragraph breaks.",
    "image": "https://example.com/optional-image.jpg",
    "imageSize": "large",
    "choices": [
      { "text": "What the player sees on the button", "next": "target_scene_id" },
      { "text": "Another option", "next": "another_scene_id" }
    ],
    "scoreEffect": { "strategy": 10, "stakeholders": -5 },
    "isEnding": false
  }
}
```

**Fields:**
- `title` — Scene heading
- `narrative` — Story text (use `\n` for line breaks)
- `image` (optional) — URL to an image shown below the title
- `imageSize` (optional) — `"small"` (40%), `"medium"` (65%), `"large"` (100%), or `"banner"` (full width, short)
- `choices` — Array of options linking to other scenes
- `scoreEffect` (optional) — Points added/subtracted across five dimensions: `strategy`, `stakeholders`, `significance`, `reach`, `evidence`
- `isEnding` — Set to `true` for ending scenes
- `endingType` — `"policy"`, `"practitioner"`, or `"cycle"`

### Option 2: Use the visual editor

The `editor/` folder contains a visual editor (`impact-quest-editor.jsx`) that runs as an artifact inside Claude.ai. It provides:

- A searchable scene list
- Form-based editing of titles, narratives, images, choices, and scores
- Flow preview to trace paths through the game
- Export to JSON (paste into `game-data.json`)
- Generate a complete standalone HTML game file

## Hosting on GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Under "Source", select **Deploy from a branch**
4. Choose `main` branch, `/ (root)` folder
5. Click **Save**
6. Your game will be live at `https://YOUR-USERNAME.github.io/REPO-NAME/`

Any time you update `game-data.json` and push, the live game updates automatically.

## Running locally

Because the game loads `game-data.json` via `fetch()`, you need a local server rather than just double-clicking the HTML file:

```bash
# Python 3 (most computers have this)
cd impact-quest
python3 -m http.server 8000

# Then open http://localhost:8000 in your browser
```

Or use the VS Code "Live Server" extension — right-click `index.html` → Open with Live Server.

## Workshop usage ideas

- **Individual play:** Each person plays through and compares their ending and score
- **Group play:** Project the game and have the room vote on each decision
- **Discussion starter:** Play one path, then discuss what would have happened with different choices
- **Customise for your institution:** Edit the scenarios to reflect your own university's processes and terminology

## Score dimensions

| Dimension | What it measures |
|-----------|-----------------|
| Strategic Thinking | Quality of planning and approach |
| Stakeholder Relations | Strength of relationships with partners |
| Significance | Depth of change achieved |
| Reach | Breadth of impact across communities/organisations |
| Evidence Quality | Strength of the evidence portfolio for REF |

## Credits

Built for research impact training workshops. Game content covers REF impact concepts including Theory of Change, policy engagement, co-production, evidence gathering, KTPs, and Impact Acceleration Accounts.

## Licence

MIT — free to use, modify, and share.
