ALTER TABLE "pro_site" ADD COLUMN "site_name" text;--> statement-breakpoint
ALTER TABLE "pro_site" ADD COLUMN "style" text DEFAULT 'ochre' NOT NULL;--> statement-breakpoint
ALTER TABLE "pro_site" ADD CONSTRAINT "pro_site_site_name_check" CHECK ("site_name" is null or "site_name" ~ '[^[:space:]]');--> statement-breakpoint
ALTER TABLE "pro_site" ADD CONSTRAINT "pro_site_style_check" CHECK ("style" in ('ochre', 'terracotta', 'sage'));