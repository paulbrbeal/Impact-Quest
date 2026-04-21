# Impact Quest Editor

This is a visual editor for creating and modifying Impact Quest game content. It runs as a React artifact inside Claude.ai.

## How to use

1. Open a conversation with Claude at [claude.ai](https://claude.ai)
2. Upload the `impact-quest-editor.jsx` file, or paste its contents
3. Ask Claude to run it as an artifact
4. Import your `game-data.json` to load existing content
5. Edit scenes, choices, images, and scores visually
6. Export JSON and replace your `game-data.json` file
7. Push to GitHub — the live game updates automatically

## Features

- Searchable scene list with status badges (START, END, IMG, FIX)
- Form-based editing of titles, narratives, and choices
- Image support with size options (small, medium, large, banner)
- Score effect sliders for all five impact dimensions
- Flow preview to trace paths through the game
- JSON import/export
- Generate complete standalone HTML game files
