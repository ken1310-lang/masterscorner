const LOCAL_ORIGIN = "http://localhost";

/**
 * Accepts only an absolute path on this origin. The login form is reachable
 * from the public site, so `redirect` is attacker-controlled: protocol-relative
 * (`//host`), backslash (`/\host`) and absolute URLs are dropped rather than
 * normalised.
 */
export function safeRedirectPath(value: unknown): string | undefined {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return undefined;
  }

  const url = new URL(value, LOCAL_ORIGIN);
  if (url.origin !== LOCAL_ORIGIN) {
    return undefined;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export interface LoginSearch {
  form: "signin" | "signup";
  redirect?: string;
}

export interface SignupSearch {
  redirect?: string;
}

/** `/login` keeps the legacy `?form=signup` address working. */
export function parseLoginSearch(search: Record<string, unknown>): LoginSearch {
  const form = search.form === "signup" ? "signup" : "signin";
  const redirect = safeRedirectPath(search.redirect);
  return redirect === undefined ? { form } : { form, redirect };
}

export function parseSignupSearch(
  search: Record<string, unknown>
): SignupSearch {
  const redirect = safeRedirectPath(search.redirect);
  return redirect === undefined ? {} : { redirect };
}
