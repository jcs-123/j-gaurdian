import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔗 Backend URL
  const API_BASE =
    window.location.hostname === "localhost"
      ? "https://fredbox-backend.onrender.com"
      : "https://YOUR_RENDER_BACKEND.onrender.com";

  /* Inject CSS */
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
      body { margin:0; font-family:Poppins,sans-serif; background:#000; }
      .bg-animated {
        position:fixed; top:-20%; left:-20%;
        width:150%; height:150%;
        background:radial-gradient(circle, rgba(0,234,255,0.25), transparent 70%);
        filter:blur(80px);
        animation:moveGlow 12s infinite alternate ease-in-out;
        z-index:0;
      }
      @keyframes moveGlow {
        0% { transform: translate(0%,0%); }
        50% { transform: translate(10%,-10%); }
        100% { transform: translate(-10%,15%); }
      }
      .login-page { height:100vh; display:flex; justify-content:center; align-items:center; z-index:2; }
      .login-card {
        max-width:380px; width:100%;
        padding:35px 30px; border-radius:20px;
        background:rgba(255,255,255,0.07);
        backdrop-filter:blur(14px);
        border:1px solid rgba(0,234,255,0.35);
        box-shadow:0 0 25px rgba(0,234,255,0.25);
      }
      .login-title { text-align:center; color:#00eaff; font-size:30px; font-weight:600; }
      .login-subtitle { text-align:center; color:#cfd2d3; margin-bottom:25px; font-size:14px; }
      .input-group { margin-bottom:18px; }
      .input-group label { color:#00eaff; }
      .input-group input {
        width:100%; padding:13px; margin-top:6px;
        background:rgba(0,0,0,0.8);
        border:1px solid rgba(0,234,255,0.4);
        border-radius:10px; color:#fff;
      }
      .login-btn {
        width:100%; padding:13px;
        background:#00eaff; border:none;
        border-radius:12px; font-weight:600;
        cursor:pointer; margin-top:10px;
      }
      .footer-text { margin-top:20px; text-align:center; color:#bfc2c3; font-size:12px; }
    `;
    document.head.appendChild(style);
  }, []);

  // 🔐 LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/parent/login`, {
        username,
        password,
      });

 if (res.data.success) {
  const user = res.data.user;

  // ✅ FORCE username into stored object
  const parentUser = {
    username, // 👈 taken directly from login input
    ...user,
  };

  localStorage.setItem("parentLoggedIn", "true");
  localStorage.setItem("parentUser", JSON.stringify(parentUser));

  toast.success("Welcome back! Login successful.", {
    position: "top-center",
    autoClose: 2000,
  });

  setTimeout(() => {
    navigate("/dashboard");
  }, 1000);
}

    } catch (error) {
    toast.error(
  error.response?.data?.message || "Invalid username or password",
  {
    position: "top-center",
    autoClose: 2500,
    hideProgressBar: false,
  }
);

    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <ToastContainer
  position="top-center"
  newestOnTop
  closeOnClick
  pauseOnHover
  draggable={false}
/>

      <div className="bg-animated"></div>

      <div className="login-page">
        <div className="login-card">
          <h2 className="login-title">J-Guardian</h2>
          <p className="login-subtitle">
            Jyothi Engineering College • Hostel Parent App
          </p>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="footer-text">Powered by JCS</p>
        </div>
      </div>
    </>
  );
}

export default Login;
