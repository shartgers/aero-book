**AeroBook**

Flight Association Management Platform

Product Requirements Document \| Version 1.0

  ----------------------- -----------------------------------------------
  **Document Status**     Draft

  **Version**             1.0

  **Product**             AeroBook Web App

  **Author**              Product Team

  **Competitor            Private-Radar
  Reference**             

  **Target Audience**     Flight Associations & Aero Clubs
  ----------------------- -----------------------------------------------

**1. Executive Summary**

AeroBook is a purpose-built web application for flight associations and
aero clubs, designed to replace fragmented, overly complex solutions
like Private-Radar with something lighter, faster, and built around the
actual workflows of club members, instructors, and administrators.

Where Private-Radar targets large professional flight schools with
enterprise-grade complexity, AeroBook targets the underserved middle
ground: associations that run 5-15 aircraft, have part-time instructors,
and need something their members will actually use on a phone while
standing on the apron.

The product is built as a responsive web app, working seamlessly across
desktop and mobile without requiring any native app install. The core
thesis is that a great booking experience, smart scheduling logic, and
actionable fleet analytics will beat a feature-bloated platform that
requires weeks of training to use.

**2. Problem Statement**

**2.1 Current Pain Points with Private-Radar and Alternatives**

Research and user interviews with aero club members reveal recurring
frustrations with existing solutions:

  ---------------------- ------------------------------------------------
  **Pain Point**         **Detail**

  **Complex onboarding** Private-Radar requires significant setup time
                         and training. Members give up and use WhatsApp
                         groups to coordinate.

  **No smart             No concept of overlap windows or handover
  scheduling**           buffers. Back-to-back bookings cause conflicts
                         on the ground.

  **No backup plane      When the preferred plane is taken, members have
  logic**                to manually check each remaining aircraft. There
                         is no automatic suggestion.

  **Weak fleet           Admins cannot see demand vs. supply gaps. They
  analytics**            have no visibility into how many bookings were
                         turned away due to full occupancy.

  **Mobile experience**  Private-Radar\'s mobile experience is an
                         afterthought. The interface is desktop-first and
                         hard to use on a phone.

  **Billing friction**   Post-flight billing exists but is not tightly
                         integrated into the booking flow. Members get
                         invoices days later.

  **Squawk visibility**  Aircraft issues are buried in a maintenance
                         module. Members cannot quickly see if a plane
                         has known issues before booking.

  **No instructor        Booking a plane with a specific instructor
  pairing**              requires separate steps. Availability is not
                         shown in context.
  ---------------------- ------------------------------------------------

**3. Product Vision & Goals**

**3.1 Vision**

AeroBook should feel like the product Private-Radar would build if they
started over today, designed for clubs instead of academies, and built
mobile-first from day one.

**3.2 Strategic Goals**

-   Reduce time-to-booking to under 60 seconds for any member

-   Give admins real-time fleet efficiency data to make better fleet
    decisions

-   Eliminate scheduling conflicts through smart overlap and handover
    logic

-   Automate the full billing cycle from booking to payment

-   Make aircraft status (squawks, maintenance) visible at the point of
    booking, not buried in a separate module

**4. User Personas**

  --------------- ---------------------------------- ---------------------
  **Persona**     **Description**                    **Key Feature Needs**

  Club Member /   Books planes for personal flying,  Booking,
  Pilot           wants to see availability quickly, availability, squawk
                  get notified of backup options,    view, notifications,
                  and pay easily after the flight.   payments

  Student Pilot   Books planes paired with an        Booking with
                  instructor, needs visibility on    instructor,
                  instructor availability, follows   scheduling, flight
                  training progress.                 records

  Flight          Manages their schedule, sees which Calendar view,
  Instructor      students are booked with them,     student management,
                  records flight outcomes.           flight sign-off

  Club            Oversees fleet, manages members,   Fleet analytics,
  Administrator   analyses demand patterns, handles  efficiency dashboard,
                  billing and maintenance.           billing, user
                                                     management

  Maintenance     Logs squawks and maintenance       Squawk management,
  Staff           events, updates aircraft           maintenance logs,
                  availability status.               aircraft status
  --------------- ---------------------------------- ---------------------

**5. Competitive Analysis**

**5.1 Private-Radar Weaknesses AeroBook Exploits**

  ----------------- -------------------------- ---------------------------
  **Private-Radar   **Impact**                 **AeroBook Response**
  Weakness**                                   

  No overlap logic  Treats every booking as a  Smart overlap windows with
                    hard block. Clubs manually configurable handover
                    add buffer time, wasting   periods
                    scheduling slots.          

  No demand         No way to see turned-away  Full demand analytics
  analytics         demand or fleet            including unfulfilled
                    utilisation gaps.          booking requests

  No backup plane   Members manually check     Automatic backup plane
  automation        alternatives when their    suggestion with one-tap
                    preferred plane is booked. acceptance

  Mobile UX         Interface built for        Mobile-first design with
                    desktop, adapted for       responsive desktop layout
                    mobile. Poor touch UX.     

  Billing lag       Post-flight billing        Auto-generated bill at
                    disconnected from the      flight completion,
                    booking flow.              integrated payment

  Squawk visibility Aircraft issues not        Squawk summary shown on
                    surfaced at booking time.  every aircraft booking card

  Over-engineered   Built for full flight      Modular, club-focused
                    academies with features    feature set with clean
                    most clubs never use.      defaults
  ----------------- -------------------------- ---------------------------

**6. Feature Specifications**

**6.1 Booking System**

**6.1.1 Aircraft Booking**

Members can browse and book from a fleet of up to 15 aircraft (initial
scope: 9). The booking interface shows:

-   A visual timeline showing all aircraft availability for the selected
    day

-   Each aircraft card showing tail number, type, current squawk count,
    and last maintenance date

-   A clear visual indicator if the aircraft has any open squawks
    (colour-coded: green = clear, amber = minor, red = grounded)

-   Hourly rate displayed on the card so members know the cost before
    booking

The booking flow is three steps maximum: select aircraft, select time
slot, confirm. No account switching or module navigation required.

**6.1.2 Smart Overlap Windows**

This is a core differentiator from Private-Radar. The system allows
configurable overlap between consecutive bookings on the same aircraft,
reflecting real-world club operations where:

-   The returning pilot lands and taxis in (15-20 minutes)

-   The next pilot can begin pre-flight briefing and introductions with
    the aircraft not yet available

-   The handover period does not need to block the aircraft for the full
    duration

Configuration: Admins set a global overlap window (default: 15 minutes).
When booking slot A ends at 14:00, booking slot B can start as early as
13:45. Both bookings are valid. The system shows both pilots the
expected handover time. If the returning flight is delayed (tracked via
departure time), the system sends an automatic notification to the
waiting pilot.

**6.1.3 Instructor Booking**

When a member selects a time slot, they can toggle \'Book with
Instructor\'. This reveals:

-   Availability grid for all active instructors (initial scope: 2)
    overlaid on the booking timeline

-   Instructor profile: qualifications, aircraft they are rated for,
    average rating from students

-   Only instructors available for the full booking duration are shown
    as selectable

An instructor booking locks both the aircraft and the instructor for
that slot. Instructors receive a push notification (web push) and can
accept or propose an alternative time. Unconfirmed instructor bookings
show a \'Pending\' status on the member\'s booking overview.

**6.1.4 Backup Plane Automation**

When a member\'s preferred aircraft is unavailable for their requested
slot, the system does not just show \'unavailable\'. Instead:

1.  The system identifies all other aircraft of the same or compatible
    type in the fleet

2.  It checks their availability for the requested slot, accounting for
    overlap windows

3.  It surfaces the best alternative with a one-tap \'Book backup
    instead\' prompt

4.  Members can also opt in to \'Notify me if this plane becomes
    available\' - receiving a push notification if a cancellation opens
    up their preferred slot

Backup preferences can be pre-configured per member: e.g. \'If PH-ABC is
not available, suggest PH-XYZ before others\'. This eliminates the need
to manually scan the full fleet.

**6.2 Aircraft Status & Squawk Management**

**6.2.1 Squawk Visibility at Booking**

Every aircraft card in the booking flow shows a live squawk summary, not
buried in a separate maintenance module. The summary includes:

-   Number of open squawks

-   Highest severity level (cosmetic, operational, airworthiness)

-   A one-tap expandable list showing each squawk title, date logged,
    and current status

Members can see this information without leaving the booking screen.
Airworthiness-level squawks that ground the aircraft automatically block
the aircraft from being booked. The system flags this clearly as
\'Grounded - maintenance required\' rather than simply showing no
availability.

**6.2.2 Squawk Logging**

Any member can log a squawk directly from the aircraft detail page or
from the post-flight screen. Maintenance staff and admins can update
squawk status, assign resolution tasks, and mark squawks as resolved.
All changes are timestamped and attributed to the logged-in user.

**6.3 Post-Flight Billing**

**6.3.1 Automated Bill Generation**

When a flight is marked as complete (by the pilot or instructor via the
app, or automatically after the scheduled end time), the system
generates a bill immediately. The bill includes:

-   Aircraft hourly rate multiplied by actual flight duration

-   Instructor fee if applicable (separate line item)

-   Landing fees if the member has logged any external landings

-   Any club membership surcharges configured by the admin

The bill is shown in-app on the member\'s account and sent via email.
Members can pay directly through the app via integrated payment
(Stripe). Admins can see payment status across all members in a single
billing dashboard.

**6.3.2 Billing Dispute Flow**

Members can flag a bill for review with a one-tap action and a brief
note. This creates a task in the admin billing queue. The admin can
adjust the bill and reissue it. All adjustments are logged.

**6.4 Admin Analytics & Fleet Efficiency Dashboard**

This is the module that Private-Radar does not offer in a meaningful
way. The AeroBook admin dashboard provides:

**6.4.1 Fleet Utilisation**

-   Aircraft utilisation rate per plane (% of available hours that were
    booked and flown)

-   Peak demand hours heatmap by day of week and time

-   Revenue per aircraft per month

-   Idle time analysis: aircraft that are consistently under-booked

**6.4.2 Demand vs. Capacity Analysis**

This is the key differentiator. The system tracks every booking request,
including ones that could not be fulfilled because all aircraft were
occupied for that slot. This creates a demand dataset that admins can
use to answer questions like:

-   How many booking requests were turned away last month due to full
    fleet occupancy?

-   Which time slots have the highest unfulfilled demand? (Used to
    prioritise fleet expansion)

-   Is the fleet currently sized correctly for member demand, or are we
    leaving capacity gaps?

Unfulfilled demand is captured by tracking the backup plane prompt: when
a member sees the \'no availability\' screen and does not complete a
booking, this is logged as a demand signal with the requested time slot
and aircraft type.

**6.4.3 Instructor Utilisation**

-   Hours flown per instructor per month

-   Student-to-instructor ratio trends

-   Instructor availability gaps (slots where student demand existed but
    no instructor was available)

**6.5 Member Management**

-   Member profiles with qualifications, ratings, and medical
    certificate expiry dates

-   Automatic booking restrictions when a qualification or medical
    expires

-   Members receive expiry reminders 30 and 7 days before a certificate
    expires

-   Admin can bulk-import members via CSV or invite individually via
    email

**7. Non-Functional Requirements**

**7.1 Responsive Design**

AeroBook is a web application, not a native app. It must work equally
well on:

  ---------------------- ------------------------------------------------
  **Device Context**     **Requirement**

  **Mobile (primary use  Members checking availability and booking while
  case)**                at the airfield. Touch-optimised booking flow,
                         large tap targets, offline-tolerant (core
                         booking flow works with poor connectivity).

  **Tablet**             Instructors reviewing their schedule for the
                         day. Schedule view optimised for tablet
                         landscape orientation.

  **Desktop**            Admin dashboards and analytics. Full-featured
                         fleet efficiency views with data tables and
                         charts.
  ---------------------- ------------------------------------------------

Navigation uses a responsive pattern: bottom navigation bar on mobile,
collapsible sidebar on desktop. No feature is hidden or unavailable on
mobile.

**7.2 Performance**

-   Time to interactive on mobile (4G): under 3 seconds

-   Booking availability check: under 1 second

-   Admin dashboard load (analytics data): under 4 seconds

**7.3 Availability & Reliability**

-   Target uptime: 99.5% monthly

-   Scheduled maintenance windows communicated 48 hours in advance

-   Booking data retained for minimum 7 years for compliance

**7.4 Security**

-   Role-based access control: Member, Instructor, Maintenance, Admin
    roles

-   All data encrypted in transit (TLS 1.3) and at rest

-   GDPR compliant: member data export and deletion on request

-   Session timeout after 60 minutes of inactivity

**8. Technical Architecture Overview**

**8.1 Stack Recommendation**

  ---------------------- ------------------------------------------------
  **Component**          **Technology Choice**

  **Frontend**           Next.js (React) - SSR for fast initial load,
                         responsive layout with Tailwind CSS

  **Backend**            Node.js / FastAPI - REST API with WebSocket
                         support for real-time availability updates

  **Database**           PostgreSQL - relational schema for bookings,
                         users, aircraft, billing

  **Auth**               Supabase Auth or Auth0 - JWT-based, magic link
                         login for low-friction member access

  **Payments**           Stripe - payment links, saved payment methods,
                         automated invoicing

  **Notifications**      Web Push API + SendGrid email - no native app
                         required

  **Analytics**          Cube.js or direct PostgreSQL queries with a
                         charting library (Recharts)

  **Hosting**            Vercel (frontend) + Railway or Render
                         (backend) - low ops overhead
  ---------------------- ------------------------------------------------

**9. Phased Delivery Roadmap**

  ---------------- -------------- ------------------------------------------
  **Phase**        **Duration**   **Scope**

  Phase 1 - Core   8 weeks        Member accounts, aircraft booking,
  Booking                         availability calendar, squawk visibility
                                  at booking, basic admin panel

  Phase 2 - Smart  4 weeks        Overlap window logic, backup plane
  Scheduling                      automation, instructor booking, waitlist
                                  notifications

  Phase 3 -        4 weeks        Post-flight bill generation, Stripe
  Billing                         integration, billing dashboard, dispute
                                  flow

  Phase 4 -        6 weeks        Fleet utilisation dashboard, demand vs.
  Analytics                       capacity analysis, unfulfilled demand
                                  tracking, instructor utilisation

  Phase 5 - Polish 4 weeks        PWA offline support, advanced member
                                  management, expiry reminders, mobile UX
                                  refinement, performance optimisation
  ---------------- -------------- ------------------------------------------

**10. Success Metrics**

  ---------------------- ------------------------------------------------
  **Metric**             **Target**

  **Booking completion   More than 80% of started booking flows result in
  rate**                 a confirmed booking

  **Time-to-booking**    Average under 60 seconds from login to confirmed
                         booking

  **Mobile usage share** More than 60% of bookings initiated on mobile

  **Admin dashboard      More than 90% of admins using the analytics
  weekly actives**       dashboard at least once per week

  **Unfulfilled demand   100% of turned-away booking attempts logged with
  captured**             slot and aircraft type

  **Billing cycle time** Bill generated within 5 minutes of flight
                         completion, 100% of the time

  **Member retention**   More than 90% of members who book once return
                         within 30 days
  ---------------------- ------------------------------------------------

**11. Open Questions & Decisions Required**

-   Should AeroBook support multiple clubs on a single instance
    (multi-tenancy), or is each club a separate deployment?
    Multi-tenancy reduces infrastructure cost but increases complexity.

-   What is the payment model for clubs? Per-seat monthly fee, flat club
    fee, or per-booking transaction fee?

-   Should instructors be able to block their own availability calendar,
    or does all instructor availability flow through admin?

-   Is there a need for integration with external weather APIs to show
    go/no-go conditions on the booking screen?

-   Should AeroBook offer an open API so clubs can integrate with their
    own website or membership systems?

**12. Appendix: Key Differentiator Summary**

The table below summarises how AeroBook positions against Private-Radar
across every feature area relevant to a flight association.

  --------------------- --------------------- ----------------------------
  **Feature**           **Private-Radar**     **AeroBook**

  Aircraft booking      Yes                   Yes, with squawk visibility
                                              at booking

  Instructor booking    Yes, separate flow    Yes, integrated in single
                                              booking flow

  Overlap / handover    No                    Yes, configurable per club
  logic                                       

  Backup plane          No                    Yes, one-tap with member
  automation                                  preferences

  Squawk visibility at  No (buried in         Yes, shown on every aircraft
  booking               maintenance)          card

  Post-flight billing   Yes, delayed          Yes, auto-generated within 5
                                              minutes

  Demand vs. capacity   No                    Yes, including unfulfilled
  analytics                                   demand tracking

  Fleet utilisation     Basic                 Full, with heatmaps and
  dashboard                                   revenue per aircraft

  Mobile UX             Poor (desktop-first)  Excellent (mobile-first
                                              design)

  Onboarding time       Weeks                 Target: first booking within
                                              30 minutes of signup

  Pricing model         Enterprise (per seat) Club-first flat fee, no
                                              per-seat charges
  --------------------- --------------------- ----------------------------
