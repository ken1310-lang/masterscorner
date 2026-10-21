-- Keep the activity timestamp monotonic: a child write in a long transaction
-- must not rewind a profile edited later in the same transaction. For a child
-- transfer, lock both parent rows in UUID order before touching either one so
-- opposite-direction transfers cannot deadlock.
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
			PERFORM 1 FROM "master_profile" WHERE "id" = NEW."profile_id" FOR UPDATE;
			PERFORM 1 FROM "master_profile" WHERE "id" = OLD."profile_id" FOR UPDATE;
		ELSE
			PERFORM 1 FROM "master_profile" WHERE "id" = OLD."profile_id" FOR UPDATE;
			PERFORM 1 FROM "master_profile" WHERE "id" = NEW."profile_id" FOR UPDATE;
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
$$;
