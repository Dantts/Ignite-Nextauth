import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/authContext";
import { cookiesTerms } from "./apiClient";
import { AuthTokenError } from "./Errors/authTokenError";

let isRefreshing = false;
let failedRequestQueue: any[] = [];

export const setupApiClient = (ctx: any = undefined) => {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies["@Nextauth:token"]}`,
    },
  });

  api.interceptors.response.use(
    (res) => {
      return res;
    },
    (err: any) => {
      if (err.response.status === 401) {
        if (err.response.data?.code === "token.expired") {
          cookies = parseCookies(ctx);
          const { "@Nextauth:refreshToken": refreshToken } = cookies;

          const originalConfig = err.config;

          if (!isRefreshing) {
            isRefreshing = true;
            api
              .post("/refresh", { refreshToken })
              .then((res) => {
                const { token, refreshToken: newRefreshToken } = res.data;
                setCookie(ctx, cookiesTerms.token, token, {
                  maxAge: 60 * 60 * 24 * 30, // 30 days
                  path: "/",
                });

                setCookie(ctx, cookiesTerms.refreshToken, newRefreshToken, {
                  maxAge: 60 * 60 * 24 * 30, // 30 days
                  path: "/",
                });

                api.defaults.headers.common[
                  "Authorization"
                ] = `Bearer ${token}`;

                failedRequestQueue.forEach((request) =>
                  request.onSuccess(token)
                );
                failedRequestQueue = [];
              })
              .catch((error) => {
                failedRequestQueue.forEach((request) =>
                  request.onFailure(error)
                );
                failedRequestQueue = [];
                if (typeof window !== "undefined") {
                  signOut();
                } else {
                  return Promise.reject(new AuthTokenError());
                }
              })
              .finally(() => {
                isRefreshing = false;
              });
          }

          return new Promise((resolve, reject) => {
            failedRequestQueue.push({
              onSuccess: (token: string) => {
                originalConfig.headers["Authorization"] = `Bearer ${token}`;

                resolve(api(originalConfig));
              },
              onFailure: (err: AxiosError) => {
                reject(err);
              },
            });
          });
        } else {
          if (typeof window !== "undefined") {
            signOut();
          } else {
            return Promise.reject(new AuthTokenError());
          }
        }
      }

      return Promise.reject(err);
    }
  );

  return api;
};
