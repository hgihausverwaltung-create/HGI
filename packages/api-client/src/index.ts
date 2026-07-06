import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@hgi/api";

export type { AppRouter };
export type ApiClient = ReturnType<typeof createApiClient>;

export interface CreateApiClientOptions {
  url: string;
  getToken: () => string | null;
}

export function createApiClient({ url, getToken }: CreateApiClientOptions) {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url,
        headers: () => {
          const token = getToken();
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
