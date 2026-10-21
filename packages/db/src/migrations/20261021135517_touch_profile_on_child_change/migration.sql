-- A profile's public activity includes its locations, arts and media. Bump the
-- parent row in the same transaction as the child change so listings can sort
-- by one timestamp without joining every child table.
CREATE OR REPLACE FUNCTION "touch_master_profile"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF TG_OP = 'DELETE' THEN
		UPDATE "master_profile"
		SET "updated_at" = now()
		WHERE "id" = OLD."profile_id";
		RETURN NULL;
	END IF;

	UPDATE "master_profile"
	SET "updated_at" = now()
	WHERE "id" = NEW."profile_id";

	IF TG_OP = 'UPDATE' AND NEW."profile_id" IS DISTINCT FROM OLD."profile_id" THEN
		UPDATE "master_profile"
		SET "updated_at" = now()
		WHERE "id" = OLD."profile_id";
	END IF;

	RETURN NULL;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "master_location_touch_profile"
AFTER INSERT OR UPDATE OR DELETE ON "master_location"
FOR EACH ROW EXECUTE FUNCTION "touch_master_profile"();--> statement-breakpoint
CREATE TRIGGER "master_martial_art_touch_profile"
AFTER INSERT OR UPDATE OR DELETE ON "master_martial_art"
FOR EACH ROW EXECUTE FUNCTION "touch_master_profile"();--> statement-breakpoint
CREATE TRIGGER "media_touch_profile"
AFTER INSERT OR UPDATE OR DELETE ON "media"
FOR EACH ROW EXECUTE FUNCTION "touch_master_profile"();
