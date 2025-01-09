import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import io from "socket.io-client";

import PageRender from "./customRouter/PageRender";
import PrivateRouter from "./customRouter/PrivateRouter";
import Login from "./pages/login";
import Register from "./pages/register";
import Home from "./pages/home";
import Alert from "./components/alert/Alert";
import Header from "./components/header/Header";
import StatusModal from "./components/StatusModal";
import { refreshToken } from "./redux/actions/authAction";
import { getPosts } from "./redux/actions/postAction";
import { getSuggestions } from "./redux/actions/suggestionsAction";
import { getNotifies } from "./redux/actions/notifyAction";

import AdminDashboard from "./pages/adminDashboard";
import { GLOBALTYPES } from "./redux/actions/globalTypes";
import SocketClient from "./SocketClient";

function App() {
  const { auth, status, modal, userType } = useSelector((state) => state);
  const dispatch = useDispatch();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    dispatch(refreshToken());

    const socket = io();
    dispatch({ type: GLOBALTYPES.SOCKET, payload: socket });
    return () => socket.close();
  }, [dispatch]);

  useEffect(() => {
    if (auth.token) {
      dispatch(getPosts(auth.token));
      dispatch(getSuggestions(auth.token));
      dispatch(getNotifies(auth.token));
    }
  }, [dispatch, auth.token]);

  useEffect(() => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
    } else if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const renderHomePage =
    userType === "user"
      ? auth.token
        ? <Home />
        : <Login />
      : auth.token
      ? <AdminDashboard />
      : <Login />;

  return (
    <Router>
      <Alert />
      <input
        type="checkbox"
        id="theme"
        onChange={(e) => setIsDarkMode(e.target.checked)}
      />
      <div className={`App ${isDarkMode ? "mode" : ""}`}>
        <div className="main">
          {userType === "user" && auth.token && <Header />}
          {status && <StatusModal />}
          {auth.token && <SocketClient />}
          <Routes>
            <Route path="/" element={renderHomePage} />
            {userType === "user" && (
              <>
                <Route path="/register" element={<Register />} />
                {/* Private routes */}
                <Route
                  path="/:page"
                  element={<PrivateRouter element={<PageRender />} />}
                />
                <Route
                  path="/:page/:id"
                  element={<PrivateRouter element={<PageRender />} />}
                />
              </>
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
