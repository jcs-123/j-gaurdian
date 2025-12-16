import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
function Header() {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // 🔐 Change password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
const [loading, setLoading] = useState(false);

  // ✅ Read from localStorage
  const parentUser = JSON.parse(localStorage.getItem("parentUser")) || {};
const { username } = parentUser;

  const {
     
    parentName = "Parent User",
    studentName = "-",
    studentJecCode = "-",
    admissionNumber = "-",
    semester = "-",
    branch = "-",
    roomNumber = "-",
  } = parentUser;

  const initial = parentName.charAt(0).toUpperCase();

  /* Inject CSS */
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

      .top-header {
        height: 60px;
        background: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 18px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        font-family: Poppins, sans-serif;
      }

      .header-logo {
        font-size: 22px;
        font-weight: 600;
        color: #0096a8;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
      }

      .header-username {
        font-size: 15px;
        font-weight: 500;
        color: #333;
      }

      .profile-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #e9faff;
        border: 2px solid #00c2d6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        color: #008aa0;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 5000;
      }

      .modal-box {
        background: #fff;
        width: 95%;
        max-width: 460px;
        padding: 24px;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      }

      .modal-title {
        text-align: center;
        font-size: 18px;
        font-weight: 600;
        color: #0088a3;
        margin-bottom: 16px;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .info-card {
        background: #e9faff;
        border-left: 4px solid #00c2d6;
        border-radius: 12px;
        padding: 10px 12px;
      }

      .info-label {
        font-size: 12px;
        font-weight: 600;
        color: #006b7a;
      }

      .info-value {
        font-size: 14px;
        font-weight: 500;
        color: #00363f;
      }

      .modal-input {
        width: 100%;
        padding: 12px;
        margin-top: 10px;
        border-radius: 10px;
        border: 1px solid #bcd6e0;
      }

      .modal-btn {
        width: 100%;
        margin-top: 12px;
        padding: 12px;
        border-radius: 10px;
        border: none;
        font-weight: 600;
        cursor: pointer;
        background: #00eaff;
      }

      .logout-btn {
        background: #ff5252;
        color: #fff;
      }

      .close-btn {
        background: #dcdcdc;
      }

      @media (max-width: 480px) {
        .info-grid {
          grid-template-columns: 1fr;
        }
        .header-username {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  /* LOGOUT */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  /* CHANGE PASSWORD (Frontend validation only) */
 const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required ❌");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match ❌");
      return;
    }

    if (!username) {
      toast.error("Session expired. Please login again ❌");
      handleLogout();
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `https://fredbox-backend.onrender.com/api/parent/change-password`,
        {
          username,          // ✅ username matched correctly
          currentPassword,
          newPassword,
        }
      );

      if (res.data.success) {
        toast.success("Password updated successfully ✅");

        setShowPasswordFields(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.data.message || "Password update failed ❌");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Server error. Please try again ❌"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
       <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="colored"
      />
      {/* HEADER */}
      <header className="top-header">
        <div className="header-logo">J-Guardian</div>

        <div className="header-right" onClick={() => setOpenModal(true)}>
          <span className="header-username">{parentName}</span>
          <div className="profile-icon">{initial}</div>
        </div>
      </header>

      {/* MODAL */}
      {openModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-title">Parent & Student Details</div>

            <div className="info-grid">
              <Info label="Parent Name" value={parentName} />
              <Info label="Student Name" value={studentName} />
              <Info label="JEC Code" value={studentJecCode} />
              <Info label="Admission No" value={admissionNumber} />
              <Info label="Semester" value={semester} />
              <Info label="Branch" value={branch} />
              <Info label="Room Number" value={roomNumber} />
            </div>

            {!showPasswordFields && (
              <button
                className="modal-btn"
                onClick={() => setShowPasswordFields(true)}
              >
                Change Password
              </button>
            )}

       {showPasswordFields && (
  <>
    <input
      type="password"
      placeholder="Current Password"
      className="modal-input"
      value={currentPassword}
      onChange={(e) => setCurrentPassword(e.target.value)}
      autoComplete="current-password"
    />

    <input
      type="password"
      placeholder="New Password"
      className="modal-input"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      autoComplete="new-password"
    />

    <input
      type="password"
      placeholder="Confirm Password"
      className="modal-input"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      autoComplete="new-password"
    />

    <button
      type="button"
      className="modal-btn"
      onClick={handleChangePassword}
      disabled={loading}
    >
      {loading ? "Updating..." : "Update Password"}
    </button>
  </>
)}


            <button className="modal-btn logout-btn" onClick={handleLogout}>
              Logout
            </button>

            <button
              className="modal-btn close-btn"
              onClick={() => {
                setOpenModal(false);
                setShowPasswordFields(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* Reusable Info Card */
const Info = ({ label, value }) => (
  <div className="info-card">
    <div className="info-label">{label}</div>
    <div className="info-value">{value}</div>
  </div>
);

export default Header;
