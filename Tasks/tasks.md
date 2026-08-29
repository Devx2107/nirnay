# Task Backlog & Parallel Workflows

## Parallel Tracks Overview
- **Track A (Frontend / UI / Maps):** Focuses on user-facing components, mobile responsive layouts, map rendering, routing visuals, and search history.
- **Track B (Backend / Data / Logic):** Focuses on mock dataset structure, urgency scoring algorithm, ASI intent parsing, and Admin state mutation logic.

---

## Phase 1: Foundation & Data Layer

### Task 1.1: Mock Dataset Schema & Population
- **Track:** B (Backend/Data)
- **Dependencies:** None
- **Description:** Build `data/mock_hospitals.json` containing 15-20 realistic hospitals in a dense urban region (e.g., Delhi/Noida). Include coordinates, phone numbers, bed counts, blood inventory, and specialist schedules.

### Task 1.2: Base App Layout & Navigation
- **Track:** A (Frontend/UI)
- **Dependencies:** None
- **Description:** Set up mobile-responsive shell with Tailwind CSS, header, search bar container, view toggles, and route definition for `/admin`.

---

## Phase 2: Core Processing & Logic (Parallel Tracks)

### Task 2.1: ASI Intent Parser Integration
- **Track:** B (Backend/Logic)
- **Dependencies:** Task 1.1
- **Description:** Build API utility to send free-text user prompts to the ASI model and receive strict JSON output (`{ specialty: string, blood_type: string, urgency: string }`).

### Task 2.2: Urgency Scoring Function
- **Track:** B (Backend/Logic)
- **Dependencies:** Task 1.1, Task 2.1
- **Description:** Implement algorithm sorting hospitals by `Score = (W1 * ETA_mins) - (W2 * Specialist_Available) - (W3 * Resource_Match)`.

### Task 2.3: Interactive Leaflet Map & ORS Routing
- **Track:** A (Frontend/UI)
- **Dependencies:** Task 1.2
- **Description:** Integrate React-Leaflet with OpenStreetMap tiles. Query OpenRouteService API with user geolocation and hospital coordinates to render polyline routes and extract driving ETA in minutes.

### Task 2.4: Hospital Cards & Detailed View Modal
- **Track:** A (Frontend/UI)
- **Dependencies:** Task 1.2
- **Description:** Design high-contrast cards displaying status badges (Available / Low Stock / Full), distance/ETA, and modal expansion showing doctor timings and one-tap `tel:` call button.

### Task 2.5: Search History Engine
- **Track:** A (Frontend/UI)
- **Dependencies:** Task 1.2
- **Description:** Save past intent searches to `localStorage` and render actionable history chips on the home screen to quickly rerun frequent queries.

---

## Phase 3: Admin Panel & Demo Integration

### Task 3.1: Admin Panel Dashboard (`/admin`)
- **Track:** A + B Joint
- **Dependencies:** Task 1.1, Task 2.4
- **Description:** Build `/admin` screen with a hospital selector dropdown. Provide form toggles to edit doctor schedules, bed counts, and blood stocks in app state.

### Task 3.2: Live Demo State Syncing & End-to-End Test
- **Track:** A + B Joint
- **Dependencies:** All previous tasks
- **Description:** Connect admin edits to main hospital search state so changing blood stock in `/admin` immediately reflects on user search results and recalculates urgency ranking.