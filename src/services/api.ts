import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/authContext";

export const cookiesKeies = {
  token: "@Nextauth:token",
  refreshToken: "@Nextauth:refreshToken",
};

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestQueue: any[] = [];

export const api = axios.create({
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
        cookies = parseCookies();
        const { "@Nextauth:refreshToken": refreshToken } = cookies;

        const originalConfig = err.config;

        if (!isRefreshing) {
          isRefreshing = true;
          api
            .post("/refresh", { refreshToken })
            .then((res) => {
              const { token, refreshToken: newRefreshToken } = res.data;
              setCookie(undefined, cookiesKeies.token, token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: "/",
              });

              setCookie(undefined, cookiesKeies.refreshToken, newRefreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: "/",
              });

              api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

              failedRequestQueue.forEach((request) => request.onSuccess(token));
              failedRequestQueue = [];
            })
            .catch((error) => {
              failedRequestQueue.forEach((request) => request.onFailure(error));
              failedRequestQueue = [];
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
        signOut();
      }
    }

    return Promise.reject(err);
  }
);
