import { describe, expect, test } from "bun:test";

import {
  parseLoginSearch,
  parseSignupSearch,
  safeRedirectPath,
} from "./auth-redirect";

describe("auth redirect", () => {
  test("keeps same-origin absolute paths with their query and hash", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/dashboard/profile?tab=classes#top")).toBe(
      "/dashboard/profile?tab=classes#top"
    );
    expect(safeRedirectPath("/")).toBe("/");
  });

  test("drops external, protocol-relative and backslash targets", () => {
    for (const value of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "\\/evil.example",
      "javascript:alert(1)",
      "dashboard",
      "",
    ]) {
      expect(safeRedirectPath(value)).toBeUndefined();
    }
  });

  test("drops paths that normalize into a protocol-relative path", () => {
    for (const value of [
      "/..//evil.example",
      "/%2e%2e//evil.example",
      "/.%2e//evil.example",
      "/a/..//evil.example",
      "/\t/evil.example",
    ]) {
      expect(safeRedirectPath(value)).toBeUndefined();
    }
  });

  test("drops values that are not strings", () => {
    expect(safeRedirectPath(undefined)).toBeUndefined();
    expect(safeRedirectPath(null)).toBeUndefined();
    expect(safeRedirectPath(42)).toBeUndefined();
  });

  test("login defaults to sign-in and keeps a valid redirect", () => {
    expect(parseLoginSearch({})).toEqual({ form: "signin" });
    expect(
      parseLoginSearch({ form: "signin", redirect: "/dashboard" })
    ).toEqual({ form: "signin", redirect: "/dashboard" });
  });

  test("login renders sign-up only for form=signup", () => {
    expect(parseLoginSearch({ form: "signup" })).toEqual({ form: "signup" });
    expect(parseLoginSearch({ form: "anything" })).toEqual({ form: "signin" });
    expect(
      parseLoginSearch({ form: "signup", redirect: "//evil.example" })
    ).toEqual({ form: "signup" });
  });

  test("signup keeps only a valid redirect", () => {
    expect(parseSignupSearch({ redirect: "/dashboard/classes" })).toEqual({
      redirect: "/dashboard/classes",
    });
    expect(parseSignupSearch({ redirect: "https://evil.example" })).toEqual({});
  });
});
