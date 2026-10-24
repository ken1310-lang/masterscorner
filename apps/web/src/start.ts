import { createMiddleware, createStart } from "@tanstack/react-start";

const clickjackingProtection = createMiddleware({ type: "request" }).server(
  async ({ next }) => {
    const result = await next();
    result.response.headers.set(
      "Content-Security-Policy",
      "frame-ancestors 'none'"
    );
    result.response.headers.set("X-Frame-Options", "DENY");
    return result;
  }
);

export const startInstance = createStart(() => ({
  requestMiddleware: [clickjackingProtection],
}));
