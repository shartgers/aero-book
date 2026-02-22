# Test flow: Complete flight & create bill

This flow verifies that an instructor or admin can mark a checked-in booking as **completed** from the UI, and that a **bill** is created for the pilot. The pilot can then see and pay (or dispute) the bill.

---

## Prerequisites

- App running (`npm run dev`), database migrated and reachable.
- At least one **admin** or **instructor** user (e.g. run `node scripts/set-admin.mjs <email>` to set admin).
- At least one **member** user (the “pilot” who will receive the bill).
- At least one **aircraft** with an hourly rate (e.g. run `node scripts/seed-aircraft.mjs` if needed).
- A **booking** that you can move to **checked_in** (see below). You can create it as the member from **Bookings → New Booking**, or use seed data.

---

## Part 1: Get a booking to “checked_in”

A bill can only be created when the booking is in **checked_in** state. The flow is: **confirmed → dispatched → checked_in → completed**.

### 1.1 Create or pick a booking

- Sign in as the **member** (pilot).
- Go to **Bookings** and create a **New Booking** (pick aircraft, date, time), or use an existing **confirmed** booking.
- Note the booking ID from the URL when you open it (e.g. `/bookings/abc-123-def`).

### 1.2 Dispatch (instructor or admin)

- Sign in as **admin** or **instructor**.
- Go to **Bookings**, open the same booking (or go directly to `/bookings/[id]`).
- Confirm the booking status is **Confirmed**.
- In the **Dispatch Aircraft** card:
  - Enter **Hobbs Out** (e.g. `1234.5`).
  - Enter **Fuel State** (e.g. `Full`).
  - Check **Pre-flight check completed — no undeclared defects**.
- Click **Dispatch**.
- **Expected:** Status becomes **Dispatched**; the **Check In Aircraft** card appears.

### 1.3 Check in (instructor or admin)

- Still on the booking detail page as admin/instructor.
- In the **Check In Aircraft** card:
  - Enter **Hobbs In** (e.g. `1235.8`).
  - Optionally **Fuel Post-flight** and/or **Squawk**.
- Click **Check In**.
- **Expected:** Status becomes **Checked in**; the **Complete flight** card (green) appears.

---

## Part 2: Complete flight & create bill

### 2.1 Complete flight (instructor or admin)

- Stay on the booking detail page as **admin** or **instructor**.
- **Expected:** You see a green card **Complete flight** with text explaining that completing the flight will generate a bill for the pilot.
- Click **Complete flight & create bill**.
- **Expected:**
  - Page reloads.
  - Booking status is **Completed**.
  - The **Complete flight** card is no longer shown (lesson sign-off section may appear if applicable).

### 2.2 Verify bill as the pilot (member)

- Sign in as the **member** who owns the booking.
- Go to **Bills** (e.g. from dashboard or `/bills`).
- **Expected:** A new bill appears for that flight (correct date, amount).
- Open the bill (`/bills/[id]`).
- **Expected:** Bill shows line items (aircraft hours/cost; instructor if applicable), total, status **Pending**, and options to **Pay** or **Dispute**.

### 2.3 Verify bill in admin (optional)

- Sign in as **admin**.
- Go to **Admin → Bills** (or `/admin/bills`).
- **Expected:** The same bill appears in the list (correct user, aircraft, date, total, status **Pending**).
- Open **Admin → Bills → [bill id]** to see full detail.

---

## Part 3: Negative / permission checks (optional)

### 3.1 Member cannot complete flight

- Sign in as **member** (not instructor/admin).
- Open a booking that is in **checked_in** (you may need admin to get one there, then share the URL or use a booking the member can see).
- **Expected:** The **Complete flight** card is **not** visible. Only instructors and admins see it.

### 3.2 Complete flight only for checked_in

- As admin/instructor, open a booking that is **confirmed** or **dispatched** (not checked_in).
- **Expected:** The **Complete flight** card is **not** visible. It only appears when status is **Checked in**.

### 3.3 No duplicate bills

- As admin/instructor, open a booking that is already **completed** (you already clicked “Complete flight & create bill”).
- **Expected:** The **Complete flight** card is no longer shown. Creating a bill is one-time per booking.

---

## Quick reference: status flow

| Step        | Who           | Action              | Resulting status |
|------------|----------------|---------------------|------------------|
| Create     | Member         | New Booking         | Pending / Confirmed |
| Dispatch   | Admin/Instructor | Dispatch Aircraft   | Dispatched       |
| Check in   | Admin/Instructor | Check In Aircraft   | Checked in       |
| Complete   | Admin/Instructor | Complete flight & create bill | Completed |
| —          | (automatic)    | —                   | Bill created (Pending) |

---

## Troubleshooting

- **No “Complete flight” card:** Ensure you are signed in as **admin** or **instructor** and the booking status is **Checked in** (after Dispatch then Check In).
- **Bill not on Bills page:** Ensure you are signed in as the **member** who owns the booking; bills are per user.
- **Admin Bills empty:** Ensure the app can reach the API and the admin user has role `admin` in the database.
