import Router, { useRouter } from "next/router";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, cookiesTerms } from "../services/apiClient";
import { setCookie, parseCookies, destroyCookie } from "nookies";

type UserProps = {
  email: string;
  permissions: string[];
  roles: string[];
};

type SigninCredentialsProps = {
  email: string;
  password: string;
};

type AuthContextType = {
  signIn: (credencials: SigninCredentialsProps) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  user: UserProps;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext({} as AuthContextType);

let authChannel: BroadcastChannel;

export const signOut = () => {
  destroyCookie(undefined, cookiesTerms.token);
  destroyCookie(undefined, cookiesTerms.refreshToken);
  authChannel.postMessage("signOut");
  Router.push("/");
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const router = useRouter();
  const [user, setUser] = useState<UserProps>(null);
  const isAuthenticated = !!user;

  useEffect(() => {
    authChannel = new BroadcastChannel("auth");

    authChannel.onmessage = (message) => {
      switch (message.data) {
        case "signOut":
          destroyCookie(undefined, cookiesTerms.token);
          destroyCookie(undefined, cookiesTerms.refreshToken);
          Router.push("/");
          break;
        default:
          break;
      }
    };
  }, []);

  useEffect(() => {
    const { "@Nextauth:token": token } = parseCookies();

    if (token) {
      api
        .get("/me")
        .then((res) => {
          const { email, permissions, roles } = res.data;
          setUser({ email, permissions, roles });
        })
        .catch((_) => {
          signOut();
        });
    }
  }, []);

  const signIn = async ({ email, password }: SigninCredentialsProps) => {
    try {
      const res = await api.post("/sessions", { email, password });

      const { token, refreshToken, permissions, roles } = res.data;

      setUser({
        email,
        permissions,
        roles,
      });

      setCookie(undefined, cookiesTerms.token, token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      setCookie(undefined, cookiesTerms.refreshToken, refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      router.push("/dashboard");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
