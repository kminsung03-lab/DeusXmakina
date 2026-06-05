# Project: DeusXmakina - The Twin Continents Map

## Overview
An interactive, high-fidelity world map application featuring two distinct, large continents. The project focuses on an immersive user experience with smooth zoom/pan controls, vibrant aesthetics, and a premium "living world" feel.

## Current Status & Features
- **Map Engine:** Fully implemented using Three.js for 3D/2D hybrid rendering.
- **Geography:** 
    - **Aetheria (West):** Lush, organic continent with emerald hues.
    - **Umbra (East):** Rugged, sharp continent with earthy, mystic tones.
- **Interactivity:** 
    - Smooth zoom and pan navigation via MapControls.
    - Dynamic hover highlighting (Cyan glow) for landmasses.
- **Aesthetics:** 
    - Deep indigo ocean with subtle grid scale.
    - Atmospheric fog and multi-layered lighting (Sun + Rim light).
    - Modern UI overlay with high-contrast typography.

## Design & Style
- **Visual Theme:** "Ethereal Cartography" - combining classic parchment textures with modern digital glows and vibrant landmasses.
- **Typography:** Expressive serif for landmass names, clean sans-serif for UI.
- **Color Palette:**
  - Ocean: Deep Indigo to Cyan gradients (`oklch`).
  - Land: Vibrant Emerald, Earthy Umber, and snowy peaks.
- **Effects:** Soft depth shadows for continents, subtle noise texture for background, and interactive "glow" on hover/interaction.

## Technical Plan
1.  **Core Rendering:** [DONE] Use **Three.js** for the map canvas to allow for high-performance zooming and smooth transitions.
2.  **Continents Implementation:** [DONE] Designed as extrude meshes with bevels for a "lifted" feel.
3.  **Camera Controls:** [DONE] Integrated `MapControls` for intuitive navigation.
4.  **UI Overlay:** [DONE] Modern CSS-based layout for titles and hints.

## Action Plan (Current: Detailing)
1.  [ ] **Aetheria (West) Detailing:**
    - [ ] Create "Silver Peak" mountain range (Snow-capped 3D peaks).
    - [ ] Add "Whispering Woods" (Forest clusters).
    - [ ] Add "Azure River" flow.
2.  [ ] **Umbra (East) Detailing:**
    - [ ] Create "Obsidian Crags" (Sharp, dark rock formations).
    - [ ] Add "Ember Desert" (Warm, sandy dunes).
    - [ ] Add "Misty Swamps" (Low-lying dark green patches).
3.  [ ] **Atmosphere & Polish:**
    - [ ] Add animated "Cloud Layer" above the map.
    - [ ] Implement animated wave shaders for the ocean.
    - [ ] Add interactive city markers.
