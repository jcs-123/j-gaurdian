import { Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Header from "./component/Header";
import Footer from "./component/Footer";

function App() {
  const location = useLocation();

  // Pages where Header & Footer should NOT appear
  const hideLayout = location.pathname === "/";

  return (
    <>
      {!hideLayout && <Header />}

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>

      {!hideLayout && <Footer />}
    </>
  );
}

export default App;
