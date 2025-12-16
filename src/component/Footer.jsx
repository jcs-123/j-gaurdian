import React, { useEffect } from "react";

function Footer() {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

      /* MAIN FOOTER */
      .footer-container {
        width: 100%;
        background: #000000;
        color: #cfd7da;
        padding: 60px 20px 40px;
        text-align: center;
        font-family: "Poppins", sans-serif;
        margin-top: 40px;
        position: relative;
        overflow: hidden;
        animation: footerFade 0.9s ease-out;

        /* CYAN BORDERS */
        border-top: 3px solid #00eaff;
        border-bottom: 3px solid #00eaff;
      }

      @keyframes footerFade {
        0% { opacity: 0; transform: translateY(25px); }
        100% { opacity: 1; transform: translateY(0); }
      }

      /* BACKGROUND CYAN ORB */
      .footer-container::before,
      .footer-container::after {
        content: "";
        position: absolute;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(0, 234, 255, 0.12), transparent 60%);
        z-index: 0;
      }

      .footer-container::before {
        top: -120px;
        left: -80px;
        animation: glowMove 8s infinite ease-in-out alternate;
      }

      .footer-container::after {
        bottom: -120px;
        right: -80px;
        animation: glowMove 9s infinite ease-in-out alternate-reverse;
      }

      @keyframes glowMove {
        0% { transform: translate(0,0); }
        100% { transform: translate(20px, 30px); }
      }

      /* TITLE */
      .footer-title {
        font-size: 26px;
        font-weight: 600;
        color: #00eaff;
        margin-bottom: 14px;
        letter-spacing: 1px;
        position: relative;
        z-index: 1;
      }

      .footer-title::after {
        content: "";
        width: 120px;
        height: 2px;
        background: linear-gradient(90deg, transparent, #00eaff, transparent);
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        animation: underlinePulse 3s infinite ease-in-out;
      }

      @keyframes underlinePulse {
        0%, 100% { opacity: 1; width: 120px; }
        50% { opacity: 0.6; width: 160px; }
      }

      /* DESCRIPTION */
      .footer-description {
        max-width: 700px;
        margin: 20px auto 30px auto;
        font-size: 15px;
        line-height: 1.7;
        color: #d4e2e7;
        opacity: 0.9;
        z-index: 1;
        position: relative;
      }

      /* JCS + JEC LIGHT CYAN HIGHLIGHT */
      .footer-description b,
      .footer-bottom b {
        color: #7ff6ff; /* Light cyan highlight */
        font-weight: 600;
      }

      /* DIVIDER */
      .footer-line {
        width: 80%;
        height: 1px;
        background: linear-gradient(90deg, transparent, #00eaff77, transparent);
        margin: 30px auto;
        z-index: 1;
      }

      /* COPYRIGHT */
      .footer-bottom {
        font-size: 14px;
        color: #a9b7bd;
        position: relative;
        z-index: 1;
      }

      .footer-bottom b:hover {
        text-shadow: 0 0 10px rgba(0, 234, 255, 0.7);
      }

      @media (max-width: 480px) {
        .footer-title { font-size: 22px; }
        .footer-description { font-size: 13px; }
        .footer-bottom { font-size: 12px; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <footer className="footer-container">
      <div className="footer-title">J-Guardian</div>

      <div className="footer-description">
        J-Guardian Parent Portal — a unified platform designed to simplify hostel 
        attendance, messcut tracking, notifications, and student monitoring for parents 
        at <b>Jyothi Engineering College</b>.
      </div>

      <div className="footer-line"></div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} All Rights Reserved —  
        <b> JCS </b> | Parent Information System
      </div>
    </footer>
  );
}

export default Footer;
