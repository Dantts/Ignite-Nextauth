import { setupApiClient } from "./api";

export const cookiesTerms = {
  token: "@Nextauth:token",
  refreshToken: "@Nextauth:refreshToken",
};

export const api = setupApiClient();
