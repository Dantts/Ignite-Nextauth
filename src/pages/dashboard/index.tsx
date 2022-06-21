import React from "react";
import { useAuth } from "../../contexts/authContext";

// import { Container } from './styles';

const Dashboard = () => {
  const { user } = useAuth();
  return (
    <>
      <h1>Dashboard: {user?.email}</h1>
    </>
  );
};

export default Dashboard;
