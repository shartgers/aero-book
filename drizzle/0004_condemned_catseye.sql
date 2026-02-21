CREATE TYPE "public"."unfulfilled_reason" AS ENUM('full_fleet', 'no_instructor', 'aircraft_grounded');--> statement-breakpoint
CREATE TABLE "analytics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_date" timestamp NOT NULL,
	"metric_type" text NOT NULL,
	"metric_value" numeric(15, 4) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unfulfilled_demand" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"aircraft_type" text NOT NULL,
	"requested_start_time" timestamp NOT NULL,
	"requested_end_time" timestamp NOT NULL,
	"reason" "unfulfilled_reason" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "unfulfilled_demand" ADD CONSTRAINT "unfulfilled_demand_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;