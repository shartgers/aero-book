# AeroBook - Product Requirements Document

**Status (2025-02-21):** Foundation in place (Next.js, Neon Auth, Drizzle, users/sessions). Phase 1 (Core Booking) not started.

## 1. Executive Summary

AeroBook is a purpose-built web application for flight associations and aero clubs, designed to replace fragmented, overly complex solutions like Private-Radar with something lighter, faster, and built around the actual workflows of club members, instructors, and administrators.

Where Private-Radar targets large professional flight schools with enterprise-grade complexity, AeroBook targets the underserved middle ground: associations that run 5-15 aircraft, have part-time instructors, and need something their members will actually use on a phone while standing on the apron.

The product is built as a responsive web app, working seamlessly across desktop and mobile without requiring any native app install. The core thesis is that a great booking experience, smart scheduling logic, and actionable fleet analytics will beat a feature-bloated platform that requires weeks of training to use.

## 2. Problem Statement

### Current Pain Points with Private-Radar and Alternatives

| Pain Point | Detail |
|------------|--------|
| **Complex onboarding** | Private-Radar requires significant setup time and training. Members give up and use WhatsApp groups to coordinate. |
| **No smart scheduling** | No concept of overlap windows or handover buffers. Back-to-back bookings cause conflicts on the ground. |
| **No backup plane logic** | When the preferred plane is taken, members have to manually check each remaining aircraft. There is no automatic suggestion. |
| **Weak fleet analytics** | Admins cannot see demand vs. supply gaps. They have no visibility into how many bookings were turned away due to full occupancy. |
| **Mobile experience** | Private-Radar's mobile experience is an afterthought. The interface is desktop-first and hard to use on a phone. |
| **Billing friction** | Post-flight billing exists but is not tightly integrated into the booking flow. Members get invoices days later. |
| **Squawk visibility** | Aircraft issues are buried in a maintenance module. Members cannot quickly see if a plane has known issues before booking. |
| **No instructor pairing** | Booking a plane with a specific instructor requires separate steps. Availability is not shown in context. |

## 3. Product Vision & Goals

### Vision

AeroBook should feel like the product Private-Radar would build if they started over today, designed for clubs instead of academies, and built mobile-first from day one.

### Strategic Goals

- Reduce time-to-booking to under 60 seconds for any member
- Give admins real-time fleet efficiency data to make better fleet decisions
- Eliminate scheduling conflicts through smart overlap and handover logic
- Automate the full billing cycle from booking to payment
- Make aircraft status (squawks, maintenance) visible at the point of booking, not buried in a separate module

## 4. User Personas

| Persona | Description | Key Feature Needs |
|---------|-------------|-------------------|
| Club Member / Pilot | Books planes for personal flying, wants to see availability quickly, get notified of backup options, and pay easily after the flight. | Booking, availability, squawk view, notifications, payments |
| Student Pilot | Books planes paired with an instructor, needs visibility on instructor availability, follows training progress, and reviews lesson feedback. | Booking with instructor, scheduling, flight records, training progress, logbook |
| Flight Instructor | Manages their schedule, sees which students are booked with them, records flight outcomes, signs off lessons, and tracks competency grading. | Calendar view, student management, flight sign-off, CBTA grading, logbook endorsement |
| Club Administrator | Oversees fleet, manages members, analyses demand patterns, handles billing and maintenance. | Fleet analytics, efficiency dashboard, billing, user management |
| Maintenance Staff | Logs squawks and maintenance events, updates aircraft availability status. | Squawk management, maintenance logs, aircraft status |

## 5. Feature Specifications

### 5.1 Booking System

#### Aircraft Booking

Members can browse and book from a fleet of up to 15 aircraft. The booking interface shows:
- A visual timeline showing all aircraft availability for the selected day
- Each aircraft card showing tail number, type, current squawk count, and last maintenance date
- A clear visual indicator if the aircraft has any open squawks (colour-coded: green = clear, amber = minor, red = grounded)
- Hourly rate displayed on the card so members know the cost before booking

The booking flow is three steps maximum: select aircraft, select time slot, confirm.

#### Smart Overlap Windows

This is a core differentiator from Private-Radar. The system allows configurable overlap between consecutive bookings on the same aircraft, reflecting real-world club operations where:
- The returning pilot lands and taxis in (15-20 minutes)
- The next pilot can begin pre-flight briefing and introductions with the aircraft not yet available
- The handover period does not need to block the aircraft for the full duration

Configuration: Admins set a global overlap window (default: 15 minutes).

#### Instructor Booking

When a member selects a time slot, they can toggle 'Book with Instructor'. This reveals:
- Availability grid for all active instructors overlaid on the booking timeline
- Instructor profile: qualifications, aircraft they are rated for, average rating from students
- Only instructors available for the full booking duration are shown as selectable

#### Backup Plane Automation

When a member's preferred aircraft is unavailable for their requested slot:
1. The system identifies all other aircraft of the same or compatible type in the fleet
2. It checks their availability for the requested slot, accounting for overlap windows
3. It surfaces the best alternative with a one-tap 'Book backup instead' prompt
4. Members can also opt in to 'Notify me if this plane becomes available'

### 5.2 Aircraft Status & Squawk Management

#### Squawk Visibility at Booking

Every aircraft card in the booking flow shows a live squawk summary:
- Number of open squawks
- Highest severity level (cosmetic, operational, airworthiness)
- A one-tap expandable list showing each squawk title, date logged, and current status

Airworthiness-level squawks that ground the aircraft automatically block the aircraft from being booked.

#### Squawk Logging

Any member can log a squawk directly from the aircraft detail page or from the post-flight screen. Maintenance staff and admins can update squawk status, assign resolution tasks, and mark squawks as resolved.

### 5.3 Post-Flight Billing

#### Automated Bill Generation

When a flight is marked as complete, the system generates a bill immediately including:
- Aircraft hourly rate multiplied by actual flight duration
- Instructor fee if applicable (separate line item)
- Landing fees if the member has logged any external landings
- Any club membership surcharges configured by the admin

Members can pay directly through the app via integrated payment (Stripe).

### 5.4 Admin Analytics & Fleet Efficiency Dashboard

#### Fleet Utilisation
- Aircraft utilisation rate per plane (% of available hours that were booked and flown)
- Peak demand hours heatmap by day of week and time
- Revenue per aircraft per month
- Idle time analysis: aircraft that are consistently under-booked

#### Demand vs. Capacity Analysis
- How many booking requests were turned away last month due to full fleet occupancy?
- Which time slots have the highest unfulfilled demand?
- Is the fleet currently sized correctly for member demand?

#### Instructor Utilisation
- Hours flown per instructor per month
- Student-to-instructor ratio trends
- Instructor availability gaps

### 5.5 Digital Pilot Logbook

Every member has a personal digital logbook, automatically populated when a booking is marked complete. Pilots can supplement entries with fields not captured automatically.

#### Entry Fields
- Date, aircraft registration, aircraft type
- Departure and arrival ICAO codes
- Total time, PIC time, dual time, solo time
- Night time, instrument time, cross-country time
- Day/night landings count
- Flight type (solo, dual, PIC, instruction)
- Free-text remarks
- Instructor sign-off (with digital timestamp)

#### Running Totals
- All totals recalculated automatically: total hours, PIC, dual, night, instrument, cross-country
- Displayed as a summary header on the logbook page

#### Export
- Export in Jeppesen-compatible format (PDF and CSV)
- Admin can export any member's logbook for compliance purposes

### 5.6 Aircraft Tech Log (Techbook)

Each aircraft has a digital technical logbook — the equivalent of the physical tech log carried in the aircraft. Every flight creates a tech log entry automatically from the booking.

#### Time Tracking
- Configurable per aircraft: airtime, Hobbs, or tach
- Hobbs/tach in and out recorded at dispatch and check-in
- Running airtime totals used to trigger maintenance intervals (e.g., 50-hour inspection, 100-hour)
- Maintenance due warnings shown on aircraft card when within 10 hours of interval

#### Per-Flight Entry
- Pilot name and signature (digital)
- Hobbs/tach in and out
- Fuel added (litres/gallons)
- Oil added
- Any new defects (links to squawk system)
- Remarks

#### Maintenance Intervals
- Admin configures intervals (e.g., 50hr oil change, 100hr inspection, annual)
- System calculates time remaining and highlights overdue items
- Grounded automatically when a mandatory interval is overdue

### 5.7 Simulator & Classroom Bookings

The booking system is extended beyond aircraft to cover all bookable training resources.

#### Resource Types
- **Aircraft** — existing booking flow (unchanged)
- **Flight Simulator** — same booking flow, separate resource pool; no squawk grounding logic
- **Classroom / Briefing Room** — bookable for ground theory sessions; capacity-aware (supports group lessons)

#### Scheduling Integration
- All resource types appear in the same availability timeline
- Instructor availability overlaid across all resource types
- Bookings for simulators and classrooms are included in instructor hours and billing

### 5.8 Pre-booking, Dispatch & Check-in Workflow

A formal aircraft lifecycle for each flight, replacing the informal "keys on the hook" process.

#### States
`pre_booked → confirmed → dispatched → airborne → checked_in → completed`

#### Pre-booking
- A pre-booking holds a slot without full confirmation (expires after a configurable window, default: 2 hours)
- Useful for students waiting on instructor confirmation

#### Dispatch
- Pilot (or duty instructor) formally dispatches the aircraft before departure
- Required fields: Hobbs/tach out, fuel state, pre-flight check confirmation (no undeclared defects)
- Triggers tech log entry creation
- Sets booking status to `dispatched`

#### Check-in
- Pilot checks aircraft back in on return
- Required fields: Hobbs/tach in, fuel state post-flight, any new squawks
- Finalises tech log entry (calculates actual airtime)
- Triggers bill generation

#### Automatic Grounding
- If check-in records a new airworthiness squawk, aircraft is immediately set to grounded status and cannot be dispatched again until resolved

### 5.9 Document Management

A centralised document store for both individual members and the club as a whole.

#### Member Documents
- Pilot licence, medical certificate, ratings, type ratings, insurance documents
- Each document has an expiry date tracked and reminder notifications sent (integrates with existing expiry reminder system in Phase 5)
- Members upload via account area; admins can upload on behalf of members

#### Club Documents
- NOTAMs, standard operating procedures, insurance certificates, ARC documents
- Visible to all members; admin-managed
- Version history retained

#### Document Categories
- Licence, Medical, Rating, Type Rating, Insurance, Club Agreement, NOTAM, SOP, ARC, Other

#### Admin Controls
- View all members' document compliance status in a grid
- Flag members with missing or expired required documents
- Block bookings for members with expired mandatory documents (configurable per document type)

### 5.10 Safety Management System (SMS)

A simplified aviation Safety Management System allowing members to report occurrences, hazards, and incidents in compliance with EASA/CAA requirements.

#### Occurrence Reporting
- Any member can submit a safety report in one click from the dashboard or aircraft detail page
- Anonymous reporting option (identity hidden from non-admin reviewers)
- Categories: airprox, runway incursion, bird strike, technical fault, near-miss, other
- Severity: hazard, incident, serious incident, accident

#### Admin Review Workflow
- All reports land in an admin safety queue
- Admin classifies, acknowledges, and adds resolution notes
- Status: submitted → under review → closed
- Closed reports are archived and included in safety summaries

#### Reporting
- Monthly safety summary report (count by category and severity)
- Trend view over 12 months
- Exportable for authority submission

### 5.11 Training Progress & Instructor Sign-off

Structured training management for student pilots progressing through a defined syllabus (PPL, Night Rating, IMC, etc.).

#### Student Training Record
- Each student is enrolled on one or more course types (PPL, CPL, Night Rating, IMC Rating, etc.)
- Each course is broken into lessons/exercises (e.g., PPL EX01 – Effects of Controls)
- Instructors mark each lesson with an outcome: not started, in progress, passed, failed, deferred
- Optional grade (1–5) and narrative remarks per lesson
- Digital instructor sign-off with timestamp

#### Student View
- Dashboard showing course progress % and next lesson
- History of all completed exercises with instructor feedback

#### Instructor View
- All active students and their current lesson
- Pending sign-offs from recent flights
- Quick sign-off flow from the booking detail page post-flight

#### Milestone Tracking
- Key milestones flagged automatically: first solo, first cross-country, test readiness
- Admin notified when a student hits a milestone

#### CBTA Support (Competency-Based Training)
- Optional competency assessment mode per lesson
- Instructors rate behavioural indicators alongside exercise outcomes
- Enables EASA CBTA-compliant training records

## 6. Technical Architecture

| Component | Technology Choice |
|-----------|-------------------|
| Frontend | Next.js (React) - SSR for fast initial load, responsive layout with Tailwind CSS |
| Backend | Next.js API routes (Node.js) - REST API; WebSocket support planned |
| Database | PostgreSQL (Neon serverless) - relational schema for bookings, users, aircraft, billing |
| Auth | Neon Auth - cookie-based sessions, sign-in/sign-up/sign-out and account views |
| Payments | Stripe - payment links, saved payment methods, automated invoicing (planned) |
| Notifications | Web Push API + email (planned) |
| Hosting | Vercel |

## 7. Phased Delivery Roadmap

| Phase | Duration | Scope |
|-------|----------|-------|
| Phase 1 - Core Booking | 8 weeks | Member accounts, aircraft booking, availability calendar, squawk visibility at booking, basic admin panel |
| Phase 2 - Smart Scheduling | 4 weeks | Overlap window logic, backup plane automation, instructor booking, waitlist notifications |
| Phase 3 - Billing | 4 weeks | Post-flight bill generation, Stripe integration, billing dashboard, dispute flow |
| Phase 4 - Analytics | 6 weeks | Fleet utilisation dashboard, demand vs. capacity analysis, unfulfilled demand tracking, instructor utilisation |
| Phase 5 - Polish | 4 weeks | PWA offline support, advanced member management, expiry reminders, mobile UX refinement, performance optimisation |
| Phase 6 - Logbook & Techbook | 6 weeks | Digital pilot logbook (Jeppesen format), aircraft tech log with Hobbs/tach/airtime, dispatch & check-in workflow, simulator and classroom bookings |
| Phase 7 - Safety & Training | 8 weeks | Safety Management System (SMS), document management hub, training progress tracking, instructor sign-off, CBTA-lite competency grading |

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Booking completion rate | More than 80% of started booking flows result in a confirmed booking |
| Time-to-booking | Average under 60 seconds from login to confirmed booking |
| Mobile usage share | More than 60% of bookings initiated on mobile |
| Admin dashboard weekly actives | More than 90% of admins using the analytics dashboard at least once per week |

## 9. Non-Functional Requirements

### Responsive Design
- **Mobile**: Touch-optimised booking flow, large tap targets, offline-tolerant
- **Tablet**: Schedule view optimised for tablet landscape orientation
- **Desktop**: Full-featured fleet efficiency views with data tables and charts

### Performance
- Time to interactive on mobile (4G): under 3 seconds
- Booking availability check: under 1 second
- Admin dashboard load (analytics data): under 4 seconds

### Security
- Role-based access control: Member, Instructor, Maintenance, Admin roles
- All data encrypted in transit (TLS 1.3) and at rest
- GDPR compliant: member data export and deletion on request
- Session timeout after 60 minutes of inactivity

### Availability
- Target uptime: 99.5% monthly
- Booking data retained for minimum 7 years for compliance
