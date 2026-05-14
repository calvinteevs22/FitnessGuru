# Appointment System — Design Spec
**Date:** 2026-05-14
**Status:** Approved — implementing immediately

## Overview

Three pieces: database schema, trainer dashboard (availability + appointments tabs), and iCal export edge function. Client booking flow is future scope.

## Database Schema

### `trainer_availability`
Recurring weekly schedule. One row per active day per trainer.
- `id` uuid PK
- `trainer_id` uuid → trainer_profiles
- `day_of_week` smallint 0–6 (0=Sun)
- `start_time` time
- `end_time` time
- `duration_mins` smallint (60 or 90)
- unique (trainer_id, day_of_week)

### `availability_blocks`
Specific dates the trainer is unavailable.
- `id` uuid PK
- `trainer_id` uuid → trainer_profiles
- `blocked_date` date
- unique (trainer_id, blocked_date)

### `bookings`
Confirmed sessions. `client_id` nullable for pre-launch (email-only bookings).
- `id` uuid PK
- `trainer_id` uuid → trainer_profiles
- `client_id` uuid → profiles (nullable)
- `client_name` text
- `client_email` text
- `scheduled_at` timestamptz
- `duration_mins` smallint
- `status` text: confirmed | cancelled | completed
- `notes` text

## Trainer Dashboard — New Tabs

Existing dashboard gets two new tabs alongside current Profile view:

**Appointments tab**
- Today's sessions (date-filtered bookings)
- Upcoming sessions (next 7 days, grouped by date)
- Cancel button per session (sets status=cancelled)

**Availability tab**
- Day toggles Mon–Sun with time pickers (start/end) per active day
- Session duration selector: 60 or 90 mins
- Block a date: date input + add button, list of blocked dates with remove
- iCal export: copy-to-clipboard URL (`/functions/v1/trainer-calendar?trainer_id=...`)

## iCal Export

Supabase Edge Function at `supabase/functions/trainer-calendar/index.ts`.
- Query: confirmed bookings for given trainer_id
- Returns: valid `.ics` file (Content-Type: text/calendar)
- Each booking = one VEVENT with summary, dtstart, dtend, uid
- No auth required (read-only, trainer_id is the access token)

## RLS Policies

- `trainer_availability`: trainer reads/writes own rows
- `availability_blocks`: trainer reads/writes own rows
- `bookings`: trainer reads own rows; client reads own rows; insert open (pre-launch)
