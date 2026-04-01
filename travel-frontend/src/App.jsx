import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home          from "./pages/Home";
import Login         from "./pages/Login";
import Profile       from "./pages/profile";
import Trips         from "./pages/trip";
import ResetPassword from "./pages/ResetPassword";
import Emergency     from "./pages/Emergency";
import Analytics     from "./pages/Analytics";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/profile"        element={<Profile />} />
        <Route path="/trips"          element={<Trips />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/emergency"      element={<Emergency />} />
        <Route path="/analytics"      element={<Analytics />} />
      </Routes>
    </Router>
  );
}

export default App;
