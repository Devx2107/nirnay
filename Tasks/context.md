# Project Context: Hospital Finder

## Core Objective
During medical emergencies, patients lose critical time traveling to hospitals that lack appropriate specialists, blood stock, or ICU beds. Hospital Finder is a mobile-responsive web application that ranks nearby facilities by dynamic urgency match (distance/ETA + specialist + resource availability) rather than distance alone.

## System Architecture & User Views

### 1. User View (Mobile-First Web App)
- **Natural Language Emergency Input:** A single input box accepting free-text queries (e.g., "Severe chest pain, need cardiologist, O- negative blood").
- **ASI Intent Parsing:** NLP extraction converting text into structured triage parameters (`specialty`, `blood_type`, `urgency_level`).
- **Urgency-Ranked List:** Hospital cards sorted by a custom weighted scoring function.
- **Detailed Hospital Modal:** Displays specialty schedules, real-time bed/blood inventory, primary contacts, and a direct `tel:` action link to trigger the phone dialer.
- **Interactive Map & Routing:** Embedded OpenStreetMap using React-Leaflet and OpenRouteService (ORS) API for live route polylines and turn-by-turn driving ETAs from user geolocation.
- **Local Search History:** Stores previous queries locally in `localStorage` for quick re-filtering without re-parsing.

### 2. Admin View (`/admin`)
- **Hospital Switcher:** Dropdown selector to choose any seeded hospital in the system.
- **Inventory & Specialist Dashboard:** Full view of the selected hospital's operational status.
- **Real-Time Live Overrides:** Toggles and form controls to update:
  - Specialist availability and duty schedules.
  - Bed capacity (ICU / General).
  - Blood supply stock levels (A+, O-, etc.).

## Tech Stack
- **Frontend:** Next.js / React, Tailwind CSS, Lucide Icons
- **Mapping & Routing:** OpenStreetMap, React-Leaflet, OpenRouteService (ORS) API
- **Data & State Management:** Local JSON database (`data/mock_hospitals.json`), Client-side React State / Local Storage
- **AI Triage Integration:** ASI / OpenAI-compatible endpoint for Intent Parsing

## Development Strategy
- **Zero-Auth:** No user accounts or login sessions. `/admin` is an open route for rapid demoing.
- **Mocked Backend Persistence:** State changes in the admin panel write directly to memory/local storage state to trigger instant UI re-renders across the app.