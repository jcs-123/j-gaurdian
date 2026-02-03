import React, { useEffect, useState } from "react";

function Dashboard() {
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [feeInfo, setFeeInfo] = useState(null);

  // ===============================
  // MESSCUT DAY CALCULATION
  // ===============================
  const calculateMesscutDays = (leave, ret, due = 0) => {
    if (Number(due) >= 10000) return 0;
    if (!leave || !ret) return 0;

    const d1 = new Date(leave);
    const d2 = new Date(ret);

    if (isNaN(d1) || isNaN(d2)) return 0;

    const diffDays = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
    const effectiveDays = diffDays - 1;

    return effectiveDays > 2 ? effectiveDays : 0;
  };

  // ===============================
  // FETCH OUTING REQUESTS
  // ===============================
useEffect(() => {
  const fetchOutingRequests = async () => {
    try {
      const parentUser = JSON.parse(localStorage.getItem("parentUser"));
      if (!parentUser?.admissionNumber) return;

      const admissionNo = parentUser.admissionNumber;

      const [fredboxRes, mimRes] = await Promise.allSettled([
        fetch(
          `https://fredbox-backend.onrender.com/outing/student/${admissionNo}`
        ),
        fetch(
          `https://mim-backend-b5cd.onrender.com/outing/student/${admissionNo}`
        ),
      ]);

      let allOutings = [];

      // ✅ Fredbox response
      if (fredboxRes.status === "fulfilled") {
        const data = await fredboxRes.value.json();
        if (data.success && Array.isArray(data.data)) {
          allOutings = [...allOutings, ...data.data];
        }
      }

      // ✅ MIM response
      if (mimRes.status === "fulfilled") {
        const data = await mimRes.value.json();
        if (data.success && Array.isArray(data.data)) {
          allOutings = [...allOutings, ...data.data];
        }
      }

      const outingNotifications = allOutings.map((item) => {
        const outingDate = new Date(item.date);
        const formattedDate = outingDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });

        return {
          id: `outing-${item._id}`,
          type: "outing",
          date: formattedDate,
          outingDate: item.date,
          leavingTime: item.leavingTime,
          returningTime: item.returningTime,
          reason: item.reason,
          studentName: item.studentName,
          parentStatus: item.parentStatus,
          adminStatus: item.adminStatus,
          createdAt: item.createdAt,
          priorityDate: item.createdAt,
        };
      });

      setNotifications((prev) => {
        const merged = [...prev, ...outingNotifications];
        const unique = merged.filter(
          (v, i, a) => a.findIndex((t) => t.id === v.id) === i
        );
        return unique.sort(
          (a, b) => new Date(b.priorityDate) - new Date(a.priorityDate)
        );
      });

    } catch (err) {
      console.error("❌ Outing request fetch error:", err);
    }
  };

  fetchOutingRequests();
}, []);


  // ===============================
  // FETCH MESSCUT REQUESTS
  // ===============================
useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const parentUser = JSON.parse(localStorage.getItem("parentUser"));
      if (!parentUser?.admissionNumber) return;

      const admissionNo = parentUser.admissionNumber;
      const todayDate = new Date().toISOString().split("T")[0];
      const notificationsList = [];

      /* ===================== MESSCUT (TWO BACKENDS) ===================== */
      const [fredboxMesscut, mimMesscut] = await Promise.allSettled([
        fetch(
          `https://fredbox-backend.onrender.com/messcut/student?admissionNo=${admissionNo}`
        ),
        fetch(
          `https://mim-backend-b5cd.onrender.com/messcut/student?admissionNo=${admissionNo}`
        ),
      ]);

      for (const res of [fredboxMesscut, mimMesscut]) {
        if (res.status === "fulfilled") {
          const data = await res.value.json();
          if (data.success && Array.isArray(data.data)) {
            data.data.forEach((item) => {
              notificationsList.push({
                id: `messcut-${item._id}`,
                type: "messcut",
                leavingDate: item.leavingDate,
                returnDate: item.returningDate,
                reason: item.reason,
                parentStatus: item.parentStatus,
                adminStatus: item.status,
                createdAt: item.createdAt,
                priorityDate: item.createdAt,
              });
            });
          }
        }
      }

      /* ===================== TODAY ABSENT (TWO BACKENDS) ===================== */
      const [fredboxToday, mimToday] = await Promise.allSettled([
        fetch(
          `https://fredbox-backend.onrender.com/attendance/parent/today?admissionNumber=${admissionNo}`
        ),
        fetch(
          `https://mim-backend-b5cd.onrender.com/attendance/parent/today?admissionNumber=${admissionNo}`
        ),
      ]);

      for (const res of [fredboxToday, mimToday]) {
        if (res.status === "fulfilled") {
          const data = await res.value.json();
          if (
            data?.success === true &&
            data?.published === "published" &&
            data?.absent === true &&
            data?.data?.date
          ) {
            notificationsList.push({
              id: `absent-${data.data.date}`,
              type: "absent",
              date: data.data.date,
              reason: "Student is absent today",
              createdAt: data.data.date,
              priorityDate: data.data.date,
            });
          }
        }
      }

      /* ===================== PAST ABSENT HISTORY (TWO BACKENDS) ===================== */
      const [fredboxHistory, mimHistory] = await Promise.allSettled([
        fetch(
          `https://fredbox-backend.onrender.com/attendance/parent/history?admissionNumber=${admissionNo}`
        ),
        fetch(
          `https://mim-backend-b5cd.onrender.com/attendance/parent/history?admissionNumber=${admissionNo}`
        ),
      ]);

      for (const res of [fredboxHistory, mimHistory]) {
        if (res.status === "fulfilled") {
          const data = await res.value.json();
          if (data?.success === true && Array.isArray(data.data)) {
            data.data.forEach((date) => {
              if (!date || date === todayDate) return;

              notificationsList.push({
                id: `absent-${date}`,
                type: "absent",
                date,
                reason: "Student was absent",
                createdAt: date,
                priorityDate: date,
              });
            });
          }
        }
      }

      /* ===================== MERGE SAFELY ===================== */
      setNotifications((prev) => {
        const merged = [...prev, ...notificationsList];
        const unique = merged.filter(
          (v, i, a) => a.findIndex((t) => t.id === v.id) === i
        );
        return unique.sort(
          (a, b) => new Date(b.priorityDate) - new Date(a.priorityDate)
        );
      });

    } catch (err) {
      console.error("❌ Notification fetch error", err);
    }
  };

  fetchNotifications();
}, []);


  // ===============================
  // FETCH APOLOGY REQUESTS
  // ===============================
 useEffect(() => {
  const fetchApologyNotifications = async () => {
    try {
      const parentUser = JSON.parse(localStorage.getItem("parentUser"));
      if (!parentUser?.admissionNumber) return;

      const admissionNo = parentUser.admissionNumber;

      const [fredboxRes, mimRes] = await Promise.allSettled([
        fetch(
          `https://fredbox-backend.onrender.com/by-student/apologyadmison?admissionNo=${admissionNo}`
        ),
        fetch(
          `https://mim-backend-b5cd.onrender.com/by-student/apologyadmison?admissionNo=${admissionNo}`
        ),
      ]);

      let allApologies = [];

      // ✅ Fredbox response
      if (fredboxRes.status === "fulfilled") {
        const data = await fredboxRes.value.json();
        if (data.success && Array.isArray(data.data)) {
          allApologies = [...allApologies, ...data.data];
        }
      }

      // ✅ MIM response
      if (mimRes.status === "fulfilled") {
        const data = await mimRes.value.json();
        if (data.success && Array.isArray(data.data)) {
          allApologies = [...allApologies, ...data.data];
        }
      }

      console.log("🟣 Combined Apology API Data:", allApologies);

      const apologyNotifications = allApologies.map((item) => ({
        id: `apology-${item._id}`,
        type: "apology",
        reason: item.reason,
        status: item.status,
        createdAt: item.createdAt,
        date: new Date(item.createdAt).toLocaleDateString("en-IN"),
        priorityDate: item.createdAt,
      }));

      setNotifications((prev) => {
        const merged = [...prev, ...apologyNotifications];
        const unique = merged.filter(
          (v, i, a) => a.findIndex((t) => t.id === v.id) === i
        );
        return unique.sort(
          (a, b) => new Date(b.priorityDate) - new Date(a.priorityDate)
        );
      });

    } catch (err) {
      console.error("❌ Apology notification error:", err);
    }
  };

  fetchApologyNotifications();
}, []);


  // ===============================
  // FETCH FEE DETAILS
  // ===============================
useEffect(() => {
  const fetchFeeDetails = async () => {
    try {
      const parentUser = JSON.parse(localStorage.getItem("parentUser"));
      if (!parentUser?.admissionNumber) return;

      const admissionNo = parentUser.admissionNumber;

      const [fredboxRes, mimRes] = await Promise.allSettled([
        fetch(
          `https://fredbox-backend.onrender.com/fees/get/${admissionNo}`
        ),
        fetch(
          `https://mim-backend-b5cd.onrender.com/fees/get/${admissionNo}`
        ),
      ]);

      let feeData = null;

      // ✅ Fredbox first
      if (fredboxRes.status === "fulfilled") {
        const data = await fredboxRes.value.json();
        if (data.success && data.data) {
          feeData = data.data;
        }
      }

      // ✅ Fallback to MIM
      if (!feeData && mimRes.status === "fulfilled") {
        const data = await mimRes.value.json();
        if (data.success && data.data) {
          feeData = data.data;
        }
      }

      if (!feeData) return;

      const due = Number(feeData.totalDue) || 0;
      const paid = Number(feeData.totalPaid) || 0;

      setFeeInfo({ due, paid });

      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.id !== "fee-info");

        const feeNotification = {
          id: "fee-info",
          type: "fee",
          paid,
          due,
          updatedAt: feeData.updatedAt,
          priorityDate: feeData.updatedAt,
        };

        return [...filtered, feeNotification].sort(
          (a, b) => new Date(b.priorityDate) - new Date(a.priorityDate)
        );
      });

    } catch (err) {
      console.error("❌ Fee fetch error", err);
    }
  };

  fetchFeeDetails();
}, []);


  // ===============================
  // UPDATE FEE INFO FOR MESSCUT
  // ===============================
  useEffect(() => {
    if (!feeInfo) return;

    setNotifications((prev) =>
      prev.map((n) =>
        n.type === "messcut" ? { ...n, due: Number(feeInfo.due) || 0 } : n
      )
    );
  }, [feeInfo]);

  // ===============================
  // STATUS HELPER FUNCTIONS
  // ===============================
  const getAdminStatusClass = (status) => {
    if (status === "ACCEPT" || status === "APPROVED") return "approved";
    if (status === "REJECT" || status === "REJECTED") return "rejected";
    return "pending";
  };

  const getParentStatusText = (status) => {
    if (status === "APPROVE" || status === "APPROVED") return "APPROVED";
    if (status === "REJECT" || status === "REJECTED") return "REJECTED";
    return "PENDING";
  };

  // ===============================
  // UPDATE MESSCUT PARENT STATUS
  // ===============================
 const updateParentStatus = async (id, parentStatus) => {
  try {
    console.log("Updating Parent Status for ID:", id);

    // 🔑 Extract real MongoDB ID (remove prefixes like outing-, messcut-, apology-)
    const realId = id.includes("-") ? id.split("-").pop() : id;
    console.log("Using DB ID:", realId);

    /* ================= TRY FREDBOX ================= */
    let res = await fetch(
      `https://fredbox-backend.onrender.com/parent-status/${realId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentStatus }),
      }
    );

    let data = await res.json();

    if (res.ok && data.success) {
      // ✅ Update UI
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, parentStatus } : n
        )
      );
      return;
    }

    console.warn("⚠️ Fredbox failed, trying MIM backend...");

    /* ================= FALLBACK TO MIM ================= */
    res = await fetch(
      `https://mim-backend-b5cd.onrender.com/parent-status/${realId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentStatus }),
      }
    );

    data = await res.json();

    if (res.ok && data.success) {
      // ✅ Update UI
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, parentStatus } : n
        )
      );
      return;
    }

    // ❌ Both backends failed
    alert(data?.message || "Invalid request ID");

  } catch (err) {
    console.error("❌ Parent status update error", err);
    alert("Server error. Please try again.");
  }
};


  // ===============================
  // UPDATE OUTING PARENT STATUS
  // ===============================
 const updateOutingParentStatus = async (id, status) => {
  try {
    console.log("Updating Outing Parent Status:", id, status);

    // 🔑 Extract real DB ID (remove "outing-" prefix if present)
    const realId = id.includes("-") ? id.split("-").pop() : id;
    console.log("Using DB ID:", realId);

    /* ================= TRY FREDBOX ================= */
    let res = await fetch(
      `https://fredbox-backend.onrender.com/outing/parent/${realId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );

    let data = await res.json();
    console.log("Fredbox outing update:", data);

    if (res.ok && data.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === `outing-${realId}`
            ? { ...n, parentStatus: status }
            : n
        )
      );
      alert(`Outing request ${status.toLowerCase()} successfully!`);
      return;
    }

    console.warn("⚠️ Fredbox failed, trying MIM...");

    /* ================= FALLBACK TO MIM ================= */
    res = await fetch(
      `https://mim-backend-b5cd.onrender.com/outing/parent/${realId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );

    data = await res.json();
    console.log("MIM outing update:", data);

    if (res.ok && data.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === `outing-${realId}`
            ? { ...n, parentStatus: status }
            : n
        )
      );
      alert(`Outing request ${status.toLowerCase()} successfully!`);
      return;
    }

    // ❌ Both failed
    alert(data?.message || "Invalid outing request ID");

  } catch (err) {
    console.error("❌ Outing parent status update error", err);
    alert("Failed to update. Please try again.");
  }
};


  // ===============================
  // INJECT CSS STYLES
  // ===============================
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

      .dashboard-wrapper {
        padding: 20px;
        font-family: "Poppins", sans-serif;
        background: #f4f9fb;
        min-height: 100vh;
      }

      /* TOP NAV BAR */
      .nav-container {
        background: #ffffff;
        padding: 12px 10px;
        border-radius: 18px;
        margin-bottom: 18px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.07);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 6px;
        flex-wrap: nowrap;
      }

      .nav-btn {
        flex: 1;
        text-align: center;
        padding: 8px 0;
        font-size: 13px;
        border-radius: 30px;
        background: #ffffff;
        border: 2px solid #00d6e8;
        color: #007d8b;
        font-weight: 600;
        cursor: pointer;
        transition: 0.25s;
        white-space: nowrap;
      }

      .nav-btn.active {
        background: #00eaff;
        color: #00363f;
        border-color: #00eaff;
        box-shadow: 0 4px 12px rgba(0, 234, 255, 0.45);
        transform: scale(1.04);
      }

      @media(max-width:480px){
        .nav-btn {
          font-size: 11px;
          padding: 6px 0;
          border-radius: 22px;
        }
        .nav-container {
          gap: 4px;
        }
      }

      /* TITLE */
      .section-title {
        text-align: center;
        font-size: 22px;
        font-weight: 600;
        color: #009db0;
        margin-bottom: 15px;
      }

      /* CARD */
      .notif-card {
        background: #ffffff;
        padding: 20px;
        border-radius: 18px;
        margin-bottom: 15px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.08);
        animation: fadeIn 0.4s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .notif-header {
        display: flex;
        justify-content: space-between;
      }

      .notif-type {
        font-size: 15px;
        font-weight: 600;
        color: #00a8b5;
        text-transform: capitalize;
      }

      .notif-date { font-size: 13px; color: #7f8c8d; }

      .notif-body {
        margin-top: 10px;
        font-size: 14px;
        color: #34495e;
      }

      .notif-label { color: #00a8b5; font-weight: 600; }

      .status-badge {
        margin-top: 12px;
        padding: 8px 14px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        width: fit-content;
      }

      .pending { background: #fff3cd; color: #8a6d00; }
      .approved { background: #d4f4dd; color: #137a1e; }
      .rejected { background: #f8d7da; color: #a30013; }
      .info { background: #dceeff; color: #005a8e; }

      /* ABSENT CARD */
      .absent-card {
        border-left: 4px solid #ff6b6b;
      }

      .absent-title {
        color: #ff6b6b;
      }

      .absent-badge {
        display: inline-block;
        background: #ff6b6b;
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin-top: 8px;
      }

      /* APOLOGY CARD */
      .apology-card {
        border-left: 4px solid #9370db;
      }

      .apology-title {
        color: #9370db;
      }

      /* ACTION BUTTONS */
      .action-btns {
        display: flex;
        gap: 10px;
        margin-top: 14px;
      }

      .btn {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: 0.25s;
      }

      .approve-btn { background: #00eaff; color: #003c47; }
      .approve-btn:hover { background: #00c7d9; }

      .reject-btn { background: #ff6b6b; color: #fff; }
      .reject-btn:hover { background: #ff4b4b; }

      @media(max-width:480px){
        .btn { padding: 8px; font-size: 12px; }
      }

      /* NO NOTIFICATIONS */
      .no-notifications {
        text-align: center;
        color: #666;
        padding: 40px 20px;
        font-size: 16px;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // ===============================
  // FILTER NOTIFICATIONS
  // ===============================
  const filtered = (
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeFilter)
  ).sort((a, b) => new Date(b.priorityDate) - new Date(a.priorityDate));

  // ===============================
  // RENDER NOTIFICATIONS
  // ===============================
  const renderNotification = (item) => {
    switch (item.type) {
      case "absent":
        return (
          <div key={item.id} className="notif-card absent-card">
            <div className="notif-header">
              <div className="notif-type absent-title">🚨 Attendance Alert</div>
              <div className="notif-date">{item.date}</div>
            </div>
            <div className="notif-body">
              <div className="absent-text">
                Student is marked <strong>ABSENT</strong> today
              </div>
              <div className="absent-badge">ABSENT</div>
              <div style={{ marginTop: "8px", fontSize: "13px", color: "#7f1d1d" }}>
                Please contact hostel / warden if this is unexpected.
              </div>
            </div>
          </div>
        );

      case "apology":
        const displayDate =
          item.date || new Date(item.createdAt).toLocaleDateString("en-IN");
        return (
          <div key={item.id} className="notif-card apology-card">
            <div className="notif-header">
              <div className="notif-type apology-title">📄 Apology Request</div>
              <div className="notif-date">{displayDate}</div>
            </div>
            <div className="notif-body">
              <div>
                <span className="notif-label">Reason:</span> {item.reason}
              </div>
            </div>
            <div
              className={`status-badge ${
                item.status === "Approved"
                  ? "approved"
                  : item.status === "Rejected"
                  ? "rejected"
                  : "pending"
              }`}
            >
              STATUS : {item.status}
            </div>
          </div>
        );

      case "fee":
        return (
          <div key={item.id} className="notif-card">
            <div className="notif-header">
              <div className="notif-type">💰 Fee Status</div>
              <div className="notif-date">
                {item.updatedAt
                  ? new Date(item.updatedAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </div>
            </div>
            <div className="notif-body">
              <div>
                <span className="notif-label">Paid Amount:</span>{" "}
                <strong style={{ color: "#15803d" }}>₹{item.paid}</strong>
              </div>
              <div style={{ marginTop: "6px" }}>
                <span className="notif-label">Fee Due:</span>{" "}
                <strong
                  style={{ color: item.due >= 10000 ? "#dc2626" : "#16a34a" }}
                >
                  ₹{item.due}
                </strong>
              </div>
              {item.due >= 10000 && (
                <div className="status-badge rejected" style={{ marginTop: "10px" }}>
                  ⚠️ Fee Due Exceeds Limit
                </div>
              )}
            </div>
          </div>
        );

      case "messcut":
        return (
          <div key={item.id} className="notif-card">
            <div className="notif-header">
              <div className="notif-type">Messcut Notification</div>
              <div className="notif-date">{item.date}</div>
            </div>
            <div className="notif-body">
              <div>
                <span className="notif-label">Leaving:</span> {item.leavingDate}
              </div>
              <div>
                <span className="notif-label">Return:</span> {item.returnDate}
              </div>
              <div>
                <span className="notif-label">Messcut count:</span>{" "}
                <strong style={{ color: "#dc2626" }}>
                  {calculateMesscutDays(
                    item.leavingDate,
                    item.returnDate,
                    feeInfo?.due || 0
                  )}
                </strong>
              </div>
              {item.due >= 10000 && (
                <div className="status-badge rejected" style={{ marginTop: "8px" }}>
                  🚫 Messcut blocked (Fee Due ₹{item.due})
                </div>
              )}
            </div>
            <div style={{ marginTop: "12px" }}>
              <div
                className={`status-badge ${getAdminStatusClass(item.adminStatus)}`}
              >
                ADMIN STATUS : {item.adminStatus || "Pending"}
              </div>
              <div style={{ marginTop: "6px", fontWeight: 600, color: "#555" }}>
                PARENT STATUS : {getParentStatusText(item.parentStatus)}
              </div>
            </div>
            {item.parentStatus === "Pending" && (
              <div className="action-btns">
                <button
                  className="btn approve-btn"
                  onClick={() => updateParentStatus(item.id, "APPROVE")}
                >
                  Approve
                </button>
                <button
                  className="btn reject-btn"
                  onClick={() => updateParentStatus(item.id, "REJECT")}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        );

      case "outing":
        return (
          <div key={item.id} className="notif-card">
            <div className="notif-header">
              <div className="notif-type">🎒 Day Outing Request</div>
              <div className="notif-date">{item.date}</div>
            </div>
            <div className="notif-body">
              <div>
                <span className="notif-label">Student:</span> {item.studentName}
              </div>
              <div>
                <span className="notif-label">Leaving Time:</span>{" "}
                {item.leavingTime}
              </div>
              <div>
                <span className="notif-label">Returning Time:</span>{" "}
                {item.returningTime}
              </div>
              <div>
                <span className="notif-label">Reason:</span> {item.reason}
              </div>
            </div>
            <div style={{ marginTop: "12px" }}>
              <div
                className={`status-badge ${
                  item.adminStatus === "APPROVED"
                    ? "approved"
                    : item.adminStatus === "REJECTED"
                    ? "rejected"
                    : "pending"
                }`}
              >
                ADMIN STATUS : {item.adminStatus || "PENDING"}
              </div>
              <div
                className={`status-badge ${
                  item.parentStatus === "APPROVED"
                    ? "approved"
                    : item.parentStatus === "REJECTED"
                    ? "rejected"
                    : "pending"
                }`}
                style={{ marginTop: "6px" }}
              >
                PARENT STATUS : {item.parentStatus || "PENDING"}
              </div>
            </div>
            {item.parentStatus === "PENDING" && (
              <div className="action-btns">
                <button
                  className="btn approve-btn"
                  onClick={() =>
                    updateOutingParentStatus(
                      item.id.replace("outing-", ""),
                      "APPROVED"
                    )
                  }
                >
                  Approve Outing
                </button>
                <button
                  className="btn reject-btn"
                  onClick={() =>
                    updateOutingParentStatus(
                      item.id.replace("outing-", ""),
                      "REJECTED"
                    )
                  }
                >
                  Reject Outing
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ===============================
  // MAIN RENDER
  // ===============================
  return (
    <div className="dashboard-wrapper">
      {/* TOP NAV */}
      <div className="nav-container">
        {["all", "outing", "messcut", "absent", "fee", "apology"].map(
          (category) => (
            <button
              key={category}
              className={`nav-btn ${activeFilter === category ? "active" : ""}`}
              onClick={() => setActiveFilter(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          )
        )}
      </div>

      <h2 className="section-title">Notifications</h2>

      {filtered.length === 0 ? (
        <div className="notif-card no-notifications">
          No notifications found
        </div>
      ) : (
        filtered.map((item) => renderNotification(item))
      )}
    </div>
  );
}

export default Dashboard;