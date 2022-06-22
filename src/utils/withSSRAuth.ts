import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";
import { destroyCookie, parseCookies } from "nookies";
import { cookiesTerms } from "../services/apiClient";
import { AuthTokenError } from "../services/Errors/authTokenError";
import decode from "jwt-decode";
import { validateUserPermissions } from "./validateUserPermission";

type withSSRAuthProps = {
  permissions?: string[];
  roles?: string[];
};

export const withSSRAuth = <P>(
  fn: GetServerSideProps<P>,
  options?: withSSRAuthProps
): GetServerSideProps => {
  return async (
    ctx: GetServerSidePropsContext
  ): Promise<GetServerSidePropsResult<P>> => {
    const cookies = parseCookies(ctx);
    const token = cookies["@Nextauth:token"];

    if (!token) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    if (options) {
      const user = decode<{ permissions: string[]; roles: string[] }>(token);
      const { permissions, roles } = options;

      const useHasValidPermissions = validateUserPermissions({
        user,
        permissions,
        roles,
      });

      if (!useHasValidPermissions) {
        return {
          redirect: {
            destination: "/dashboard",
            permanent: false,
          },
        };
      }
    }

    try {
      return await fn(ctx);
    } catch (err) {
      if (err instanceof AuthTokenError) {
        destroyCookie(ctx, cookiesTerms.token);
        destroyCookie(ctx, cookiesTerms.refreshToken);

        return {
          redirect: {
            destination: "/",
            permanent: false,
          },
        };
      }
    }
  };
};
