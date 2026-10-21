import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ENV } from "../env.public";

export const authClient = createAuthClient({
  baseURL: ENV.VITE_SERVER_URL,
  // The client and server are separate workspace packages, so the field is
  // declared here rather than inferred from the server auth instance.
  // https://www.better-auth.com/docs/concepts/typescript#additional-fields
  plugins: [
    inferAdditionalFields({
      user: {
        accountType: { input: false, required: true, type: "string" },
      },
    }),
  ],
});
