import { defineConfig } from "@neon/config/v1";

/**
 * Neon configuration as code — see docs/specs/SPEC-platform.md §7.
 *
 * Services declared here exist on every branch, so `development` and
 * `production` each get their own media bucket and their own branch-scoped S3
 * credentials. Apply with `neon deploy`; inspect with `neon status`.
 */

/** Branches the release depends on. They must never be auto-expired or retuned. */
const LONG_LIVED_BRANCHES: Record<string, true> = {
  development: true,
  production: true,
};

export default defineConfig({
  buckets: {
    // Master and class media (Task 8). Public read: profile and class images are
    // served straight from the branch's storage endpoint.
    media: { access: "public_read" },
  },
  branch: (branch) => {
    if (branch.isDefault || Object.hasOwn(LONG_LIVED_BRANCHES, branch.name)) {
      // `production` is the default branch; `development` is created once by
      // `neon checkout development --create`. Neither is a throwaway, so
      // neither gets a TTL or a compute profile from this policy.
      return {};
    }
    // Everything else is a throwaway (a preview for a risky change, CI), and
    // that includes branches that already exist: leaving `branch.exists` out of
    // the exemption above is deliberate, because a branch created before
    // `neon deploy` would otherwise keep no expiry and stay forever.
    return {
      ttl: "7d",
      postgres: {
        computeSettings: {
          autoscalingLimitMinCu: 0.25,
          autoscalingLimitMaxCu: 0.25,
        },
      },
    };
  },
});
