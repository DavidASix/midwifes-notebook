import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@midwifes-notebook/server/router";

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3001/trpc",
    }),
  ],
});
