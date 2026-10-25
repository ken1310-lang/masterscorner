CREATE TABLE "pro_site" (
	"profile_id" uuid PRIMARY KEY,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pro_site" ADD CONSTRAINT "pro_site_profile_id_master_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "master_profile"("id") ON DELETE CASCADE;