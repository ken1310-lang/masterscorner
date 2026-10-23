-- A class is public profile activity, and a schedule edit is a class edit.
-- Reuse the existing profile activity trigger for class writes, then make
-- schedule writes touch their parent class, whose trigger advances the
-- profile. The class timestamp stays monotonic under concurrent edits.
CREATE OR REPLACE FUNCTION "touch_master_class_from_schedule"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF TG_OP = 'DELETE' THEN
		UPDATE "master_class"
		SET "updated_at" = GREATEST("updated_at", clock_timestamp()::timestamp)
		WHERE "id" = OLD."class_id";
		RETURN NULL;
	END IF;

	UPDATE "master_class"
	SET "updated_at" = GREATEST("updated_at", clock_timestamp()::timestamp)
	WHERE "id" = NEW."class_id";

	IF TG_OP = 'UPDATE' AND NEW."class_id" IS DISTINCT FROM OLD."class_id" THEN
		UPDATE "master_class"
		SET "updated_at" = GREATEST("updated_at", clock_timestamp()::timestamp)
		WHERE "id" = OLD."class_id";
	END IF;

	RETURN NULL;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "master_class_touch_profile"
AFTER INSERT OR UPDATE OR DELETE ON "master_class"
FOR EACH ROW EXECUTE FUNCTION "touch_master_profile"();--> statement-breakpoint
CREATE TRIGGER "master_class_schedule_touch_class"
AFTER INSERT OR UPDATE OR DELETE ON "master_class_schedule"
FOR EACH ROW EXECUTE FUNCTION "touch_master_class_from_schedule"();
