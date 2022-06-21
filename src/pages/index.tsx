import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { parseCookies } from "nookies";
import { FormEvent, useState } from "react";
import { useAuth } from "../contexts/authContext";
import { withSSRGuest } from "../utils/withSSRGuest";
import styles from "./home.module.scss";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data = {
      email,
      password,
    };

    await signIn(data);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <input
        type={"text"}
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type={"password"}
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}

export const getServerSideProps: GetServerSideProps = withSSRGuest(
  async (ctx: GetServerSidePropsContext) => {
    return {
      props: {},
    };
  }
);
