# Task Backlog & Parallel Workflows

## Parallel Tracks Overview
- **Track A (Frontend / UI / Maps):** Focuses on user-facing components, mobile responsive layouts, map rendering, routing visuals, and search history.
- **Track B (Backend / Data / Logic):** Focuses on Supabase setup, urgency scoring algorithm, LLM intent parsing, and Admin state mutation logic.

---

## Phase 1: Foundation & Data Layer

### Task 1.1: Database Schema & Supabase Setup (Track B)
- **Sub-tasks:**
  - Create a Supabase project and set up the public-facing schema.
  - Define tables for `Hospitals` (coords, phone), `Specialists` (schedules), and `Inventory` (Beds, Blood).
  - Configure Row Level Security (RLS) policies to allow anonymous read/write (since it's a zero-auth demo).
  - Create a mock dataset script (Delhi/Noida region) to populate the Supabase tables later.
- **Acceptance Criteria:** Supabase is active, tables are created with proper relations, and the client can connect without auth.

### Task 1.2: Base App Layout & Navigation (Track A)
- **Sub-tasks:**
  - Initialize Next.js / React project structure.
  - Configure Tailwind CSS.
  - Create global layout wrapper with a sticky Header.
  - Build the main Home View (Search bar container, Map area placeholder, List area placeholder).
  - Set up Next.js routing for `/admin` (list/add) and `/hospital/[hospitalid]` (edit/view).
- **Acceptance Criteria:** App runs locally, responsive on mobile, and can navigate between routes.

---

## Phase 2: Core Processing & Logic (Parallel Tracks)

### Task 2.1: LLM Intent Parser Integration (ASI/Groq) (Track B)
- **Sub-tasks:**
  - Create a flexible API route (e.g., `/api/parse-intent`).
  - Implement a lightweight abstraction layer to call either ASI or Groq.
  - Write the system prompt instructing the model to output strict JSON: `{ specialty, blood_type, urgency_level }`.
- **Acceptance Criteria:** API successfully takes a free-text string and returns the expected structured JSON, easily swappable between LLM providers.

### Task 2.2: Urgency Scoring Engine (Track B)
- **Sub-tasks:**
  - Implement a utility function to calculate the score for a single hospital.
  - Define the scoring logic for boolean availability using placeholder weights (since formula isn't finalized).
  - Implement a processing pipeline that fetches hospitals from Supabase, calculates scores based on parsed intent and ETA, and sorts them.
- **Acceptance Criteria:** Function correctly ranks a list of hospitals, prioritizing those with matching specialists/resources and lower ETAs based on configurable weights.

### Task 2.3: Interactive Leaflet Map & ORS Routing (Track A)
- **Sub-tasks:**
  - Set up `react-leaflet` map centered on the user's geolocation.
  - Plot hospital locations from Supabase as markers on the map.
  - Integrate OpenRouteService API to fetch routing data between user and selected hospital.
  - Render the polyline route on the map and display the ETA.
- **Acceptance Criteria:** Map renders correctly, user location is placed, and selecting a hospital draws a valid route with an ETA.

### Task 2.4: Hospital Cards & Detailed View (Track A)
- **Sub-tasks:**
  - Create the `HospitalCard` component (Name, Distance/ETA, Status Badges).
  - Modify the card to link to the `/hospital/[hospitalid]` detailed view, or keep the modal for quick viewing on the search page.
  - Implement the UI for doctor schedules, bed/blood inventory.
  - Add a functional `tel:` link button.
- **Acceptance Criteria:** Cards render in a list based on Supabase query, and all detailed info is clearly visible.

### Task 2.5: Search History Engine (Track A)
- **Sub-tasks:**
  - Implement hooks/utilities to read and write parsed intents to `localStorage`.
  - Create a `SearchHistoryChips` component below the search bar.
  - Wire chips to trigger a re-search (hitting Supabase again, but bypassing the LLM).
- **Acceptance Criteria:** Previous searches persist across page reloads and can be re-run with a single tap.

---

## Phase 3: Admin & Editing Integration

### Task 3.1: Admin Panel Dashboard (`/admin`) (Joint)
- **Sub-tasks:**
  - Build a dashboard listing all existing hospitals fetched from Supabase.
  - Create a form to add a new hospital (name, coordinates, contact info).
  - On adding, write to Supabase and navigate the user to that hospital's specific page.
- **Acceptance Criteria:** Can view all hospitals and successfully add a new one to the database.

### Task 3.2: Hospital Specific Edit View (`/hospital/[hospitalid]`) (Joint)
- **Sub-tasks:**
  - Build the detailed view for a specific hospital, functioning as both a view and an edit page.
  - Create form inputs/toggles for editing doctor schedules, Bed Capacity, and Blood Stock.
  - Wire forms to `UPDATE` rows in Supabase.
- **Acceptance Criteria:** Changing a resource (e.g., zeroing out ICU beds) on this page updates Supabase, immediately affecting its ranking in subsequent live searches.