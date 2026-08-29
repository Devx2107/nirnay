# Project Context: Hospital Finder

## Core Objective
During medical emergencies, patients lose critical time traveling to hospitals that lack appropriate specialists, blood stock, or ICU beds. Hospital Finder is a mobile-responsive web application that ranks nearby facilities by dynamic urgency match (distance/ETA + specialist + resource availability) rather than distance alone.

## System Architecture & User Views

### 1. User View (Mobile-First Web App)
- **Natural Language Emergency Input:** A single input box accepting free-text queries (e.g., "Severe chest pain, need cardiologist, O- negative blood").
- **LLM Intent Parsing:** Abstraction layer using an LLM (ASI or Groq) to convert text into structured triage parameters (`specialty`, `blood_type`, `urgency_level`).
- **Urgency-Ranked List:** Hospital cards sorted by a custom weighted scoring function.
- **Detailed Hospital View (`/hospital/[hospitalid]`):** Displays specialty schedules, real-time bed/blood inventory, primary contacts, and a direct `tel:` action link to trigger the phone dialer.
- **Interactive Map & Routing:** Embedded OpenStreetMap using React-Leaflet and OpenRouteService (ORS) API for live route polylines and turn-by-turn driving ETAs from user geolocation.
- **Local Search History:** Stores previous queries locally in `localStorage` for quick re-filtering without hitting the LLM again.

### 2. Admin & Editing Views
- **Admin Dashboard (`/admin`):** A high-level dashboard to view all existing hospitals in the database and add new hospitals.
- **Hospital Editor (`/hospital/[hospitalid]`):** The detailed view also serves as the edit page (since there is no auth). Provides form controls to update:
  - Specialist availability and duty schedules.
  - Bed capacity (ICU / General).
  - Blood supply stock levels (A+, O-, etc.).

## Tech Stack
- **Frontend:** Next.js / React, Tailwind CSS, Lucide Icons
- **Mapping & Routing:** OpenStreetMap, React-Leaflet, OpenRouteService (ORS) API
- **Data & State Management:** Supabase (PostgreSQL) for fetching and storing common hospital data and inventory.
- **AI Triage Integration:** Flexible endpoint for Intent Parsing supporting lightweight LLMs (like Groq) or ASI.

## Development Strategy
- **Zero-Auth:** No user accounts or login sessions. `/admin` and `/hospital/[hospitalid]` are open routes for rapid demoing.
- **Supabase Persistence:** Data is stored in Supabase with RLS policies allowing public read/write access. Edits directly update the database, which informs subsequent search queries.