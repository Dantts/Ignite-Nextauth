import { GetServerSideProps } from "next";
import React from "react";
import Can from "../../components/can";
import { useAuth } from "../../contexts/authContext";
import { useCan } from "../../hooks/useCan";
import { setupApiClient } from "../../services/api";
import { withSSRAuth } from "../../utils/withSSRAuth";

// import { Container } from './styles';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const userCanSeeMetrics = useCan({
    permissions: ["metrics.list"],
  });

  return (
    <>
      <button onClick={signOut}>SignOut</button>

      <h1>Dashboard: {user?.email}</h1>

      <Can permissions={["metrics.list"]}>
        <div>
          <h1>Metricas</h1>
        </div>
      </Can>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = withSSRAuth(
  async (ctx) => {
    const apiClient = setupApiClient(ctx);

    const res = await apiClient.get("/me");

    return {
      props: {},
    };
  }
);

export default Dashboard;
