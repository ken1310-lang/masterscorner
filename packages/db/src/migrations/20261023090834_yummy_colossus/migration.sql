ALTER TABLE "master_class" ADD COLUMN "paused_from_status" text;--> statement-breakpoint
ALTER TABLE "master_class" ADD CONSTRAINT "master_class_paused_from_status_check" CHECK ((
        "paused_from_status" is null
        or (
          "paused_from_status" in ('active', 'full')
          and "status" = 'paused'
        )
      ));