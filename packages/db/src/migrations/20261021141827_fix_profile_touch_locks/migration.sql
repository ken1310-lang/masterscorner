-- The activity migration is already recorded on databases that ran it, so its
-- function must be replaced by a new migration rather than editing history.
-- Keep the timestamp monotonic and use FOR NO KEY UPDATE: the foreign-key
-- check already holds FOR KEY SHARE on the new parent, and FOR UPDATE conflicts
-- with it. FOR NO KEY UPDATE is compatible with the FK lock and sufficient
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
$$;
