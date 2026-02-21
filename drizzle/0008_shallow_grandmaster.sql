CREATE TYPE "public"."document_category" AS ENUM('licence', 'medical', 'rating', 'type_rating', 'insurance', 'club_agreement', 'notam', 'sop', 'arc', 'other');--> statement-breakpoint
CREATE TYPE "public"."flight_type" AS ENUM('solo', 'dual', 'pic', 'instruction');--> statement-breakpoint
CREATE TYPE "public"."lesson_outcome" AS ENUM('not_started', 'in_progress', 'passed', 'failed', 'deferred');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('aircraft', 'simulator', 'classroom');--> statement-breakpoint
CREATE TYPE "public"."safety_report_category" AS ENUM('airprox', 'runway_incursion', 'bird_strike', 'technical_fault', 'near_miss', 'other');--> statement-breakpoint
CREATE TYPE "public"."safety_report_severity" AS ENUM('hazard', 'incident', 'serious_incident', 'accident');--> statement-breakpoint
CREATE TYPE "public"."safety_report_status" AS ENUM('submitted', 'under_review', 'closed');--> statement-breakpoint
CREATE TYPE "public"."training_status" AS ENUM('active', 'completed', 'suspended', 'failed');--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'pre_booked' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'dispatched' BEFORE 'in_progress';--> statement-breakpoint
ALTER TYPE "public"."booking_status" ADD VALUE 'checked_in' BEFORE 'in_progress';--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"category" "document_category" NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" text NOT NULL,
	"expiry_date" timestamp,
	"is_club_wide" boolean DEFAULT false NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_record_id" uuid NOT NULL,
	"booking_id" uuid,
	"lesson_code" text NOT NULL,
	"lesson_title" text NOT NULL,
	"outcome" "lesson_outcome" DEFAULT 'not_started' NOT NULL,
	"grade" integer,
	"instructor_notes" text,
	"cbta_assessment_data" jsonb,
	"signed_off_by" uuid,
	"signed_off_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logbook_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"booking_id" uuid,
	"aircraft_id" uuid,
	"entry_date" timestamp NOT NULL,
	"aircraft_type" text NOT NULL,
	"tail_number" text NOT NULL,
	"departure_icao" text,
	"arrival_icao" text,
	"total_time" numeric(6, 1) NOT NULL,
	"pic_time" numeric(6, 1),
	"dual_time" numeric(6, 1),
	"solo_time" numeric(6, 1),
	"night_time" numeric(6, 1),
	"instrument_time" numeric(6, 1),
	"cross_country_time" numeric(6, 1),
	"landings_day" integer,
	"landings_night" integer,
	"flight_type" "flight_type" NOT NULL,
	"remarks" text,
	"instructor_signoff" uuid,
	"instructor_signoff_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_intervals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"name" text NOT NULL,
	"interval_hours" numeric(8, 1) NOT NULL,
	"last_completed_at" numeric(8, 1),
	"next_due_at" numeric(8, 1),
	"warning_threshold_hours" numeric(5, 1) DEFAULT '10' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "resource_type" NOT NULL,
	"name" text NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"hourly_rate" numeric(10, 2),
	"aircraft_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safety_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reported_by" uuid,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"category" "safety_report_category" NOT NULL,
	"severity" "safety_report_severity" NOT NULL,
	"description" text NOT NULL,
	"date_of_occurrence" timestamp NOT NULL,
	"location" text,
	"aircraft_id" uuid,
	"status" "safety_report_status" DEFAULT 'submitted' NOT NULL,
	"reviewed_by" uuid,
	"resolution" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tech_log_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aircraft_id" uuid NOT NULL,
	"booking_id" uuid,
	"pilot_id" uuid NOT NULL,
	"entry_date" timestamp NOT NULL,
	"hobbs_in" numeric(8, 1),
	"hobbs_out" numeric(8, 1),
	"tach_in" numeric(8, 1),
	"tach_out" numeric(8, 1),
	"airtime" numeric(6, 1),
	"fuel_added" numeric(6, 1),
	"oil_added" numeric(5, 2),
	"remarks" text,
	"signed_off_by" uuid,
	"signed_off_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"instructor_id" uuid,
	"course_type" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"target_end_date" timestamp,
	"status" "training_status" DEFAULT 'active' NOT NULL,
	"progress_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_training_record_id_training_records_id_fk" FOREIGN KEY ("training_record_id") REFERENCES "public"."training_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_completions" ADD CONSTRAINT "lesson_completions_signed_off_by_users_id_fk" FOREIGN KEY ("signed_off_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logbook_entries" ADD CONSTRAINT "logbook_entries_instructor_signoff_users_id_fk" FOREIGN KEY ("instructor_signoff") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_intervals" ADD CONSTRAINT "maintenance_intervals_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_reports" ADD CONSTRAINT "safety_reports_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_reports" ADD CONSTRAINT "safety_reports_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_reports" ADD CONSTRAINT "safety_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tech_log_entries" ADD CONSTRAINT "tech_log_entries_aircraft_id_aircraft_id_fk" FOREIGN KEY ("aircraft_id") REFERENCES "public"."aircraft"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tech_log_entries" ADD CONSTRAINT "tech_log_entries_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tech_log_entries" ADD CONSTRAINT "tech_log_entries_pilot_id_users_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tech_log_entries" ADD CONSTRAINT "tech_log_entries_signed_off_by_users_id_fk" FOREIGN KEY ("signed_off_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE set null ON UPDATE no action;