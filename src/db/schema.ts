import { pgTable, text, timestamp, uuid, pgEnum, numeric, jsonb, integer, boolean } from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["member", "student", "instructor", "maintenance", "admin"]);
export const aircraftStatusEnum = pgEnum("aircraft_status", ["available", "maintenance", "grounded"]);
export const squawkSeverityEnum = pgEnum("squawk_severity", ["cosmetic", "operational", "airworthiness"]);
export const squawkStatusEnum = pgEnum("squawk_status", ["open", "in_progress", "resolved"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "in_progress", "completed", "cancelled"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  role: userRoleEnum("role").default("member").notNull(),
  phone: text("phone"),
  licenseNumber: text("license_number"),
  medicalExpiry: timestamp("medical_expiry"),
  qualifications: jsonb("qualifications"),
});

// Sessions table
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

// Aircraft table
export const aircraft = pgTable("aircraft", {
  id: uuid("id").defaultRandom().primaryKey(),
  tailNumber: text("tail_number").notNull().unique(),
  type: text("type").notNull(),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  status: aircraftStatusEnum("status").default("available").notNull(),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  /** URL of aircraft photo (e.g. from airport-data.com or adsbdb), looked up by tail number */
  imageUrl: text("image_url"),
  // Specs from fleet docs (e.g. Vloot.md) — stored as text to keep units and notes
  engine: text("engine"),
  seats: integer("seats"),
  maxSpeed: text("max_speed"),
  cruiseSpeed: text("cruise_speed"),
  range: text("range"),
  fuelBurnPerHour: text("fuel_burn_per_hour"),
  maxTakeoffWeight: text("max_takeoff_weight"),
  /** Long description (e.g. aerobatics, IFR, glass cockpit) */
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Squawks table
export const squawks = pgTable("squawks", {
  id: uuid("id").defaultRandom().primaryKey(),
  aircraftId: uuid("aircraft_id")
    .notNull()
    .references(() => aircraft.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: squawkSeverityEnum("severity").notNull(),
  status: squawkStatusEnum("status").default("open").notNull(),
  reportedBy: uuid("reported_by")
    .notNull()
    .references(() => users.id),
  resolvedBy: uuid("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  aircraftId: uuid("aircraft_id")
    .notNull()
    .references(() => aircraft.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: bookingStatusEnum("status").default("pending").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Club settings table
export const clubSettings = pgTable("club_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  overlapWindowMinutes: integer("overlap_window_minutes").default(15).notNull(),
  defaultBookingDurationMinutes: integer("default_booking_duration_minutes").default(60).notNull(),
  maxBookingDurationHours: integer("max_booking_duration_hours").default(4).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Instructors table
export const instructors = pgTable("instructors", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  qualifications: jsonb("qualifications"),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  bio: text("bio"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Instructor availability table
export const instructorAvailability = pgTable("instructor_availability", {
  id: uuid("id").defaultRandom().primaryKey(),
  instructorId: uuid("instructor_id").notNull().references(() => instructors.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isRecurring: boolean("is_recurring").default(true).notNull(),
  specificDate: timestamp("specific_date"),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Booking instructors table
export const bookingInstructorStatusEnum = pgEnum("booking_instructor_status", ["pending", "confirmed", "declined"]);
export const bookingInstructors = pgTable("booking_instructors", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  instructorId: uuid("instructor_id").notNull().references(() => instructors.id),
  status: bookingInstructorStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Waitlist table
export const waitlistStatusEnum = pgEnum("waitlist_status", ["waiting", "notified", "fulfilled", "expired"]);
export const waitlist = pgTable("waitlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  aircraftId: uuid("aircraft_id").notNull().references(() => aircraft.id),
  preferredAircraftId: uuid("preferred_aircraft_id").references(() => aircraft.id),
  requestedStartTime: timestamp("requested_start_time").notNull(),
  requestedEndTime: timestamp("requested_end_time").notNull(),
  status: waitlistStatusEnum("status").default("waiting").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Backup preferences table
export const backupPreferences = pgTable("backup_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  primaryAircraftId: uuid("primary_aircraft_id").notNull().references(() => aircraft.id),
  backupAircraftId: uuid("backup_aircraft_id").notNull().references(() => aircraft.id),
  priority: integer("priority").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bill status enum
export const billStatusEnum = pgEnum("bill_status", ["pending", "paid", "disputed", "refunded"]);

// Bills table
export const bills = pgTable("bills", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  aircraftHours: numeric("aircraft_hours", { precision: 10, scale: 2 }).notNull(),
  aircraftCost: numeric("aircraft_cost", { precision: 10, scale: 2 }).notNull(),
  instructorHours: numeric("instructor_hours", { precision: 10, scale: 2 }),
  instructorCost: numeric("instructor_cost", { precision: 10, scale: 2 }),
  landingFees: numeric("landing_fees", { precision: 10, scale: 2 }),
  surcharges: numeric("surcharges", { precision: 10, scale: 2 }),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: billStatusEnum("status").default("pending").notNull(),
  paymentIntentId: text("payment_intent_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bill disputes
export const disputeStatusEnum = pgEnum("dispute_status", ["open", "resolved", "rejected"]);
export const billDisputes = pgTable("bill_disputes", {
  id: uuid("id").defaultRandom().primaryKey(),
  billId: uuid("bill_id").notNull().references(() => bills.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  status: disputeStatusEnum("status").default("open").notNull(),
  resolution: text("resolution"),
  resolvedBy: uuid("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment status enum
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);

// Payments table
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  billId: uuid("bill_id").notNull().references(() => bills.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  stripePaymentId: text("stripe_payment_id").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Unfulfilled demand reasons enum
export const unfulfilledReasonEnum = pgEnum("unfulfilled_reason", ["full_fleet", "no_instructor", "aircraft_grounded"]);

// Unfulfilled demand log
export const unfulfilledDemand = pgTable("unfulfilled_demand", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  aircraftType: text("aircraft_type").notNull(),
  requestedStartTime: timestamp("requested_start_time").notNull(),
  requestedEndTime: timestamp("requested_end_time").notNull(),
  reason: unfulfilledReasonEnum("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Analytics snapshots (pre-aggregated metrics)
export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  snapshotDate: timestamp("snapshot_date").notNull(),
  metricType: text("metric_type").notNull(),
  metricValue: numeric("metric_value", { precision: 15, scale: 4 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Certificates
export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  documentUrl: text("document_url"),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notification preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  bookingReminders: boolean("booking_reminders").default(true).notNull(),
  waitlistNotifications: boolean("waitlist_notifications").default(true).notNull(),
  expiryReminders: boolean("expiry_reminders").default(true).notNull(),
  billNotifications: boolean("bill_notifications").default(true).notNull(),
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  pushEnabled: boolean("push_enabled").default(false).notNull(),
  pushSubscription: jsonb("push_subscription"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
