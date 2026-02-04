import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // 🔗 Backend URL
const API_FREDBOX = "https://fredbox-backend.onrender.com";
const API_MIM = "https://mim-backend-b5cd.onrender.com";

  /* Inject CSS */
  useEffect(() => {
    const style = document.createElement("style");
 style.innerHTML = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: Poppins, sans-serif;
  background: #000;
}

.bg-animated {
  position: fixed;
  inset: -20%;
  background: radial-gradient(circle, rgba(0,234,255,0.25), transparent 70%);
  filter: blur(90px);
  animation: moveGlow 12s infinite alternate ease-in-out;
  z-index: 0;
}

@keyframes moveGlow {
  0% { transform: translate(0,0); }
  50% { transform: translate(10%,-10%); }
  100% { transform: translate(-10%,15%); }
}

.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  z-index: 2;
  position: relative;
}

.login-card {
  width: 100%;
  max-width: 380px;
  padding: 32px 26px;
  border-radius: 20px;
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(0,234,255,0.35);
  box-shadow: 0 0 25px rgba(0,234,255,0.25);
}

.login-title {
  text-align: center;
  color: #00eaff;
  font-size: 28px;
  font-weight: 600;
}

.login-subtitle {
  text-align: center;
  color: #cfd2d3;
  margin-bottom: 24px;
  font-size: 13px;
}

.input-group {
  margin-bottom: 18px;
  position: relative;
}

.input-group label {
  color: #00eaff;
  font-size: 13px;
}

.input-group input {
  width: 100%;
  padding: 13px 44px 13px 13px;
  margin-top: 6px;
  background: rgba(0,0,0,0.85);
  border: 1px solid rgba(0,234,255,0.4);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 38px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  color: #00eaff;
  user-select: none;
}

.login-btn {
  width: 100%;
  padding: 13px;
  background: #00eaff;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  font-size: 15px;
}

.login-btn:disabled {
  opacity: 0.7;
}

.footer-text {
  margin-top: 18px;
  text-align: center;
  color: #bfc2c3;
  font-size: 12px;
}

/* Mobile fine-tuning */
@media (max-width: 360px) {
  .login-card { padding: 26px 20px; }
  .login-title { font-size: 26px; }
}
`;

    document.head.appendChild(style);
  }, []);

  // 🔐 LOGIN
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const [fredboxRes, mimRes] = await Promise.allSettled([
      axios.post(`${API_FREDBOX}/api/parent/login`, { username, password }),
      axios.post(`${API_MIM}/api/parent/login`, { username, password }),
    ]);

    let res = null;
    let source = "";

    // ✅ Check Fredbox first
    if (fredboxRes.status === "fulfilled" && fredboxRes.value.data.success) {
      res = fredboxRes.value;
      source = "fredbox";
    }
    // ✅ Else check MIM
    else if (mimRes.status === "fulfilled" && mimRes.value.data.success) {
      res = mimRes.value;
      source = "mim";
    } else {
      throw new Error("Invalid username or password");
    }

    const user = res.data.user;

    // ✅ FORCE username into stored object
    const parentUser = {
      username,           // 👈 from login input
      sourceBackend: source,
      ...user,
    };

    localStorage.setItem("parentLoggedIn", "true");
    localStorage.setItem("parentUser", JSON.stringify(parentUser));

    toast.success(`Welcome back! Login successful `, {
      position: "top-center",
      autoClose: 2000,
    });

    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);

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
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />

  <span
    className="password-toggle"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? "👁️‍🗨️" : "👁️"}
  </span>
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
