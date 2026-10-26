-- Opposite moves can update the same two classes in either direction. Take
-- both row locks in id order before either update, matching the profile move
-- fix. FOR NO KEY UPDATE is compatible with the FK's KEY SHARE lock and is
-- sufficient because only updated_at changes.
CREATE OR REPLACE FUNCTION "touch_master_class_from_schedule"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF TG_OP = 'UPDATE' AND NEW."class_id" IS DISTINCT FROM OLD."class_id" THEN
		IF NEW."class_id" < OLD."class_id" THEN
			PERFORM 1 FROM "master_class" WHERE "id" = NEW."class_id" FOR NO KEY UPDATE;
			PERFORM 1 FROM "master_class" WHERE "id" = OLD."class_id" FOR NO KEY UPDATE;
		ELSE
			PERFORM 1 FROM "master_class" WHERE "id" = OLD."class_id" FOR NO KEY UPDATE;
			PERFORM 1 FROM "master_class" WHERE "id" = NEW."class_id" FOR NO KEY UPDATE;
		END IF;

		UPDATE "master_class"
		SET "updated_at" = GREATEST("updated_at", clock_timestamp()::timestamp)
		WHERE "id" = NEW."class_id";

		UPDATE "master_class"
		SET "updated_at" = GREATEST("updated_at", clock_timestamp()::timestamp)
		WHERE "id" = OLD."class_id";

		RETURN NULL;
	END IF;

	IF TG_OP = 'DELETE' THEN
		UPDATE "master_class"
		SET "updated_at" = GREATEST("updated_at", clock_timestamp()::timestamp)
		WHERE "id" = OLD."class_id";
		RETURN NULL;
	END IF;

	UPDATE "master_class"
	SET "updated_at" = GREATEST("updated_at", clock_timestamp()::timestamp)
	WHERE "id" = NEW."class_id";

	RETURN NULL;
END;
$$;
