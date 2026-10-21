CREATE TABLE "master_location" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "master_location_name_check" CHECK (length(btrim("name")) > 0),
	CONSTRAINT "master_location_position_check" CHECK ("position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "master_martial_art" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "master_martial_art_name_check" CHECK (length(btrim("name")) > 0),
	CONSTRAINT "master_martial_art_position_check" CHECK ("position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "master_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL UNIQUE,
	"display_name" text NOT NULL,
	"years_teaching" integer,
	"home_city" text,
	"introduction" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "master_profile_display_name_check" CHECK (length(btrim("display_name")) > 0),
	CONSTRAINT "master_profile_years_teaching_check" CHECK ("years_teaching" >= 0)
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"profile_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"object_key" text NOT NULL UNIQUE,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_kind_check" CHECK ("kind" in ('profile_photo', 'site_logo')),
	CONSTRAINT "media_byte_size_check" CHECK ("byte_size" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "master_location_profile_position_idx" ON "master_location" ("profile_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "master_martial_art_profile_name_idx" ON "master_martial_art" ("profile_id",lower(btrim("name")));--> statement-breakpoint
CREATE UNIQUE INDEX "master_martial_art_profile_position_idx" ON "master_martial_art" ("profile_id","position");--> statement-breakpoint
CREATE INDEX "media_profile_idx" ON "media" ("profile_id");--> statement-breakpoint
ALTER TABLE "master_location" ADD CONSTRAINT "master_location_profile_id_master_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "master_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "master_martial_art" ADD CONSTRAINT "master_martial_art_profile_id_master_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "master_profile"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "master_profile" ADD CONSTRAINT "master_profile_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_profile_id_master_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "master_profile"("id") ON DELETE CASCADE;