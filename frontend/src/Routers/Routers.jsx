import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { LandingPage } from "../pages";

export const Routers = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
};
