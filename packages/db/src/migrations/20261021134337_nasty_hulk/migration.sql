UPDATE "master_profile" AS "profile"
SET "display_name" = CASE
	WHEN "account"."name" ~ '[^[:space:]]'
		THEN btrim("account"."name", E' \t\n\r\f\v')
	ELSE 'Master'
END
FROM "user" AS "account"
WHERE "profile"."user_id" = "account"."id"
	AND "profile"."display_name" ~ '^[[:space:]]*$';--> statement-breakpoint
DELETE FROM "master_location" WHERE "name" ~ '^[[:space:]]*$';--> statement-breakpoint
DELETE FROM "master_martial_art" WHERE "name" ~ '^[[:space:]]*$';--> statement-breakpoint
ALTER TABLE "master_location" DROP CONSTRAINT "master_location_name_check", ADD CONSTRAINT "master_location_name_check" CHECK ("name" ~ '[^[:space:]]');--> statement-breakpoint
ALTER TABLE "master_martial_art" DROP CONSTRAINT "master_martial_art_name_check", ADD CONSTRAINT "master_martial_art_name_check" CHECK ("name" ~ '[^[:space:]]');--> statement-breakpoint
ALTER TABLE "master_profile" DROP CONSTRAINT "master_profile_display_name_check", ADD CONSTRAINT "master_profile_display_name_check" CHECK ("display_name" ~ '[^[:space:]]');