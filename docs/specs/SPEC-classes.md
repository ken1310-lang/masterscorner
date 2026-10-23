# SPEC-classes: class schema and weekly schedules

## 1. Objective

A master owns classes that the console and public directory can read without inventing data (PRD §10.2, §19.3). Each class names one of the master's martial arts, one of their locations, an audience, a level and a status; it may carry a structured fee; it has one or more weekly schedule rows. This task delivers the persisted contract and migration. The console write path and public listing consume it in Tasks 10 and 11.

Success: the development branch stores a class and all its schedule rows, every table constraint rejects an invalid row, a referenced location cannot be deleted, and one relational query returns a master's classes with their schedules.

## 2. Scope

### 2.1 In scope (one PR, Task 9)

- Dependency-free class vocabulary shared by the schema and later browser code.
- `master_class` and `master_class_schedule` Drizzle tables with checks, indexes, foreign keys and relations.
- A versioned migration generated from the schema and applied to the development branch.
- Contract tests for ownership, references, fee/status vocabulary, schedule validity and the class-with-schedules query.

### 2.2 Out of scope

- Class CRUD, authorization and the console form are delivered in Task 10 and documented in §4-5.
- Public class listing, filters and next-session calculation (Task 11).
- Pro Site rendering (Task 16), trials, capacity, programme descriptions and media.
- Attendance, memberships, payments and recurring exceptions.

### 2.3 Boundaries

- Always: derive ownership from the master profile; reference a location and martial art by id; keep schedule times as wall-clock values; test constraints against the development branch.
- Ask first: changing the audience, level, status or fee-period vocabulary; changing fee units; adding a timezone or currency column; changing the day-of-week convention.
- Never: store schedules as free text or JSON; accept a class without a location; cascade-delete a referenced location or martial art; expose another master's location or art through a class.

## 3. Contract

`packages/db/src/schema/class-kinds.ts` is dependency-free so later browser code can reuse the vocabulary without importing Drizzle:

```ts
export const CLASS_AUDIENCES = ["children", "adults", "all"] as const;
export const CLASS_LEVELS = ["beginner", "intermediate", "advanced", "all"] as const;
export const CLASS_STATUSES = ["active", "paused", "full"] as const;
export const CLASS_FEE_PERIODS = ["session", "week", "month", "term"] as const;
```

### 3.1 `master_class`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid | primary key, random default |
| `profile_id` | uuid | required; references `master_profile.id`; cascade with the account |
| `martial_art_id` | uuid | required; references `master_martial_art.id`; delete restricted |
| `location_id` | uuid | required; references `master_location.id`; delete restricted |
| `name` | text | required; at least one non-space character |
| `audience` | text | required; one of `CLASS_AUDIENCES` |
| `level` | text | required; one of `CLASS_LEVELS` |
| `status` | text | required; one of `CLASS_STATUSES`; defaults to `active` |
| `fee_amount` | numeric(10,2) | nullable; when present, greater than zero |
| `fee_period` | text | nullable; one of `CLASS_FEE_PERIODS`; present exactly when `fee_amount` is present |
| `created_at`, `updated_at` | timestamp | required timestamps |

The fee amount is an exact rupee amount (INR) with at most two decimal places, not a float. The first release is India-only and has no currency switcher, so the schema omits a currency column. Indexes cover `profile_id`, `martial_art_id` and `location_id`.

### 3.2 `master_class_schedule`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | uuid | primary key, random default |
| `class_id` | uuid | required; references `master_class.id`; cascade with the class |
| `day_of_week` | integer | required; ISO weekday, 1 = Monday through 7 = Sunday |
| `start_time`, `end_time` | time(0) without time zone | required wall-clock times; `end_time > start_time` |
| `created_at`, `updated_at` | timestamp | required timestamps |

`(class_id, day_of_week, start_time)` is unique. Times are wall-clock values for the class location; India uses one timezone, so no per-row timezone is stored.

### 3.3 Cardinality and ownership

At least one schedule row is a write-contract invariant owned by Task 10. PostgreSQL cannot express child cardinality without a deferred trigger, and the Neon HTTP path must not depend on deferred transaction state. Task 10 writes the class and its schedule rows in one batch and rejects a write with no schedule. Reads treat a class with no schedules as incomplete rather than inventing a session.

A class references the profile, martial art and location by id. The foreign keys guarantee that the referenced rows exist and cannot be deleted while a class uses them, but they do not compare owners. Task 10 must validate submitted location and martial-art ids against the caller's profile before writing; database owner isolation for those ids is an application invariant until then.

Profile activity includes classes and their schedules. `master_class_touch_profile` reuses `touch_master_profile`, so a class insert, edit or delete advances `master_profile.updated_at`. `master_class_schedule_touch_class` advances the parent class's `updated_at` on schedule inserts, edits and deletes; the class trigger then advances the profile. Both timestamps use `GREATEST(..., clock_timestamp())`, matching the existing monotonic profile trigger and avoiding stale writes under concurrency. Migration `20261023072509_touch_profile_on_class_change` installs the triggers.

When an update moves a schedule between classes, the trigger acquires both class rows with `FOR NO KEY UPDATE` in UUID order before either update, matching `touch_master_profile`'s move handling. Migration `20261023073055_fix_schedule_move_lock_order` installs that order, so opposite-direction moves cannot form a lock cycle.

### 3.4 Query

`createDb` exposes a class with its schedule rows:

```ts
db.query.masterClass.findMany({
  where: { profileId },
  with: { schedules: true, location: true, martialArt: true },
  orderBy: { createdAt: "desc" },
});
```

The query is the read shape Tasks 10, 11, 13 and 16 extend. No presentation formatting belongs in the schema.

## 4. Console API contract (Task 10)

`packages/api/src/classes.ts` owns the shared Zod schemas, form types and the `MasterClassView`/`ClassesPayload` read shapes. The browser imports this file, not the Drizzle schema.

`classes.list` is a protected query returning the caller's classes newest-first with `martialArt`, `location` and sorted `schedules`, plus the profile's ordered martial art and location options. The list is empty before a profile exists.

`classes.save` creates when `id` is omitted and updates an owned class when present. It requires a master profile and rejects a martial-art or location id that is not in that profile's children. A profile with no options cannot create a class. The write is one `db.batch` transaction: the class row and its complete schedule. Updates delete and reinsert the schedule, so schedule ids are not stable; the class id is. Schedules must contain at least one row. PostgreSQL remains the final check for every Task 9 constraint.

`classes.setStatus` and `classes.remove` scope the row by the caller's profile id. A missing or foreign class returns `NOT_FOUND`. Removing a class cascades its schedules. A profile save that would delete a martial art or location still referenced by a class maps PostgreSQL `23001` to an actionable `CONFLICT` rather than the raw constraint message.

## 5. Console screen (Task 10)

`/dashboard/classes` lists the classes in the prototype's row table: class and teaching details, weekly slots, fee, status and actions. Desktop shows the table header and fee column; below the `md` breakpoint the header stays in the assistive tree, the fee column is hidden, and each row becomes a compact class/schedule/status/actions grid without horizontal page scroll.

The same screen hosts the create/edit panel. It covers name, martial art, location, audience, level, status, an optional fee amount plus period, and one or more weekly schedule rows. Client validation mirrors the API for the fee pair, positive two-decimal fee, ISO weekday, valid `HH:MM` times, end-after-start, unique day/start and at least one schedule. The profile editor is the recovery path when the master has no martial art or location.

Pause/resume is a row action; removal opens an inline confirmation that names the class and warns that the schedule is removed too. Save, status and remove responses update the cached list immediately. Those cache writes are generation-scoped to the session and cancel in-flight list reads first, matching the profile save contract. The editor disables row actions while open so a status change or another draft cannot race it, and profile options refetch when the screen mounts so a profile edit is visible without a manual reload.
