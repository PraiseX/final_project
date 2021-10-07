import React from "react";
import { Link } from "react-router-dom";
import useUser from "../hooks/useUser";
import "./css/navigation_style.css";
//import "./css/general_style.css";

const NavigationBar = (props) => {
  const { user, loggedOut, mutate, loading } = useUser();
  const logOut = async () => {
    console.log("Logout");
    await fetch("/me", { method: "DELETE" });
    mutate();
    window.location.href = "/";
  };
  return (
    <div class="topNav" id="headerDiv">
      <Link to="/">Home</Link>

      {loggedOut ? (
        <Link to="/login">Login</Link>
      ) : loading ? (
        <div>Loading</div>
      ) : (
        <button onClick={logOut}>Log Out</button>
      )}
    </div>
  );
};

export default NavigationBar;
