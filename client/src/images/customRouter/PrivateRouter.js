import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRouter = ({ element }) => {
  const firstLogin = localStorage.getItem("firstLogin");

  // Check if the user has logged in; if not, redirect to the login page
  return firstLogin ? element : <Navigate to="/" />;
};

export default PrivateRouter;
