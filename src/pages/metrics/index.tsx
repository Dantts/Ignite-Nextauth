import { GetServerSideProps } from "next";
import React from "react";
import { setupApiClient } from "../../services/api";
import { withSSRAuth } from "../../utils/withSSRAuth";
import decode from "jwt-decode";

const Metrics = () => {
  return (
    <>
      <h1>Metrics</h1>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = withSSRAuth(
  async (ctx) => {
    const apiClient = setupApiClient(ctx);
    const res = await apiClient.get("/me");

    console.log(res.data);

    return {
      props: {},
    };
  },
  {
    permissions: ["metrics.list"],
    roles: ["administrator"],
  }
);

export default Metrics;
