CREATE TABLE "master_class" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"profile_id" uuid NOT NULL,
	"martial_art_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"name" text NOT NULL,
	"audience" text NOT NULL,
	"level" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"fee_amount" numeric(10,2),
	"fee_period" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "master_class_name_check" CHECK ("name" ~ '[^[:space:]]'),
	CONSTRAINT "master_class_audience_check" CHECK ("audience" in ('children', 'adults', 'all')),
	CONSTRAINT "master_class_level_check" CHECK ("level" in ('beginner', 'intermediate', 'advanced', 'all')),
	CONSTRAINT "master_class_status_check" CHECK ("status" in ('active', 'paused', 'full')),
	CONSTRAINT "master_class_fee_check" CHECK ((
        ("fee_amount" is null and "fee_period" is null)
        or ("fee_amount" > 0 and "fee_period" is not null)
      )),
	CONSTRAINT "master_class_fee_period_check" CHECK ("fee_period" is null or "fee_period" in ('session', 'week', 'month', 'term'))
);
--> statement-breakpoint
CREATE TABLE "master_class_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"class_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time(0) NOT NULL,
	"end_time" time(0) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "master_class_schedule_day_check" CHECK ("day_of_week" between 1 and 7),
	CONSTRAINT "master_class_schedule_time_check" CHECK ("end_time" > "start_time")
);
--> statement-breakpoint
CREATE INDEX "master_class_profile_idx" ON "master_class" ("profile_id");--> statement-breakpoint
CREATE INDEX "master_class_martial_art_idx" ON "master_class" ("martial_art_id");--> statement-breakpoint
CREATE INDEX "master_class_location_idx" ON "master_class" ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "master_class_schedule_slot_idx" ON "master_class_schedule" ("class_id","day_of_week","start_time");--> statement-breakpoint
ALTER TABLE "master_class" ADD CONSTRAINT "master_class_profile_id_master_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "master_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "master_class" ADD CONSTRAINT "master_class_martial_art_id_master_martial_art_id_fkey" FOREIGN KEY ("martial_art_id") REFERENCES "master_martial_art"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "master_class" ADD CONSTRAINT "master_class_location_id_master_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "master_location"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "master_class_schedule" ADD CONSTRAINT "master_class_schedule_class_id_master_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "master_class"("id") ON DELETE CASCADE;