-- A profile's public activity includes its locations, arts and media. Bump the
-- parent row in the same transaction as the child change so listings can sort
-- by one timestamp without joining every child table. Keep the timestamp
-- monotonic: a child write in a long transaction must not rewind a profile
-- edited later in the same transaction. For a child transfer, lock both parent
-- rows in UUID order before touching either one. Use FOR NO KEY UPDATE, not
-- FOR UPDATE: the foreign-key check already holds FOR KEY SHARE on the new
-- parent, and FOR UPDATE conflicts with it, so sorted FOR UPDATE can still
-- deadlock. FOR NO KEY UPDATE is compatible with the FK lock and sufficient
-- because only updated_at changes.
CREATE OR REPLACE FUNCTION "touch_master_profile"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF TG_OP = 'DELETE' THEN
		UPDATE "master_profile"
		SET "updated_at" = GREATEST("updated_at", clock_timestamp()::timestamp)
		WHERE "id" = OLD."profile_id";
		RETURN NULL;
	END IF;

	IF TG_OP = 'UPDATE' AND NEW."profile_id" IS DISTINCT FROM OLD."profile_id" THEN
		IF NEW."profile_id" < OLD."profile_id" THEN
			PERFORM 1 FROM "master_profile" WHERE "id" = NEW."profile_id" FOR NO KEY UPDATE;
			PERFORM 1 FROM "master_profile" WHERE "id" = OLD."profile_id" FOR NO KEY UPDATE;
		ELSE
			PERFORM 1 FROM "master_profile" WHERE "id" = OLD."profile_id" FOR NO KEY UPDATE;
			PERFORM 1 FROM "master_profile" WHERE "id" = NEW."profile_id" FOR NO KEY UPDATE;
		END IF;

		UPDATE "master_profile"
		SET "updated_at" = GREATEST("updated_at", clock_timestamp()::timestamp)
		WHERE "id" = NEW."profile_id";

		UPDATE "master_profile"
		SET "updated_at" = GREATEST("updated_at", clock_timestamp()::timestamp)
		WHERE "id" = OLD."profile_id";

		RETURN NULL;
	END IF;

	UPDATE "master_profile"
	SET "updated_at" = GREATEST("updated_at", clock_timestamp()::timestamp)
	WHERE "id" = NEW."profile_id";

	RETURN NULL;
END;
$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS "master_location_touch_profile" ON "master_location";--> statement-breakpoint
CREATE TRIGGER "master_location_touch_profile"
AFTER INSERT OR UPDATE OR DELETE ON "master_location"
FOR EACH ROW EXECUTE FUNCTION "touch_master_profile"();--> statement-breakpoint
DROP TRIGGER IF EXISTS "master_martial_art_touch_profile" ON "master_martial_art";--> statement-breakpoint
CREATE TRIGGER "master_martial_art_touch_profile"
AFTER INSERT OR UPDATE OR DELETE ON "master_martial_art"
FOR EACH ROW EXECUTE FUNCTION "touch_master_profile"();--> statement-breakpoint
DROP TRIGGER IF EXISTS "media_touch_profile" ON "media";--> statement-breakpoint
CREATE TRIGGER "media_touch_profile"
AFTER INSERT OR UPDATE OR DELETE ON "media"
FOR EACH ROW EXECUTE FUNCTION "touch_master_profile"();
