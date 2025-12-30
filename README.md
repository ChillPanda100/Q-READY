# Q-Ready — Post-Quantum Grid Incident Simulation

A compact React + TypeScript simulation that models grid stability, cryptographic trust, firmware integrity, certificate health and network health for Distributed Energy Resources (DERs). The app is an operator training / exercise tool that presents alerts, a live metric graph, and domain-specific operator panels to respond to incidents.

This README covers how to run the project, the key features, and where to make common edits.

---

## Key features

- Live metrics graph (time-series) showing:
  - Grid Stability
  - Cryptographic Trust
  - Firmware Integrity
  - Certificate Health
  - Network Health
- Alerts panel with acknowledge/slide-away animations.
- Five domain-specific operator panels (split UI):
  1. DER / Grid Operations — control DERs to stabilize the grid.
  2. Cryptographic & Key Management (PKI) — rotate keys, renew certs, enforce PQ mode.
  3. Firmware & Device Integrity — patch, verify, rollback firmware.
  4. Network Operations — mitigate traffic, segment networks, restore routing.
  5. Incident Command & Governance — escalation, acknowledgement, emergency authorization.
- Operator actions take simulated time and may temporarily affect multiple metrics (tradeoffs are modeled).
- Enforce-PQ is a high-impact action with a cooldown and requires emergency authorization.

---

## Quick start (development)

1. Install dependencies:

```powershell
npm install
```

2. Start the dev server with hot-reload:

```powershell
npm run dev
```

3. Open the app in the browser (Vite will print the local URL, usually http://localhost:5173).

4. Use the title screen to start the simulation. The scenario timeline and alerts begin after you press Start.

Notes:
- The simulation samples metrics every 500ms and keeps a rolling buffer for the graph.
- Actions are simulated (delays, temporary effects); expect button spinners while actions execute.

---

## Build

To build a production bundle:

```powershell
npm run build
```

To preview the production build locally:

```powershell
npm run preview
```

---

## Where to find things in the code

- `src/App.tsx` — main application state, metric sampling, scenario scheduling, and `performAction` handler that applies action effects and timers.
- `src/components/MetricGraph.tsx` — SVG/time-series rendering and zoom behavior.
- `src/components/AlertsPanel.tsx` — alerts list, acknowledge animation and timing.
- `src/components/ActionPanel.tsx` — top-level actions area (now composes separate domain panels).
- `src/components/DERPanel.tsx`, `PKIPanel.tsx`, `FirmwarePanel.tsx`, `NetworkPanel.tsx`, `IncidentPanel.tsx` — domain-specific button groups.
- `src/data/scenario.ts` — scheduled scenario events and their metric deltas/messages. Edit here to change the timed incidents.
- `src/types/index.ts` — shared TypeScript types used across the app.
- `src/styles.css` — global styling, panel layout, and animation rules.

---

If you'd like additional developer guidance (contributing conventions, cooldown UI, confirmation dialogs, or e2e smoke tests), tell me which item you'd like and I will add that next.
