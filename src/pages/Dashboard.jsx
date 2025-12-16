import React, { useEffect, useState } from "react";

function Dashboard() {
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [feeInfo, setFeeInfo] = useState(null);
// ===============================
// MESSCUT DAY CALCULATION (FINAL)
// ===============================
// ===============================
// MESSCUT DAY CALCULATION (FINAL & CORRECT)
// ===============================
const calculateMesscutDays = (leave, ret, due = 0) => {
  // 🚫 Rule 1: Fee due >= 10000 → no messcut
  if (Number(due) >= 10000) return 0;

  if (!leave || !ret) return 0;

  const d1 = new Date(leave);
  const d2 = new Date(ret);

  if (isNaN(d1) || isNaN(d2)) return 0;

  const diffDays = Math.ceil(
    (d2 - d1) / (1000 * 60 * 60 * 24)
  );

  // Exclude leaving day
  const effectiveDays = diffDays - 1;

  // ✅ Rule 2: minimum 2 days required
  return effectiveDays > 2 ? effectiveDays : 0;
};


  // SAMPLE NOTIFICATIONS
useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const parentUser = JSON.parse(localStorage.getItem("parentUser"));
      if (!parentUser?.admissionNumber) return;

      const notificationsList = [];

      // MESSCUT
      const messcutRes = await fetch(
        `https://fredbox-backend.onrender.com/messcut/student?admissionNo=${parentUser.admissionNumber}`
      );
      const messcutData = await messcutRes.json();

      if (messcutData.success) {
        messcutData.data.forEach(item => {
          notificationsList.push({
            id: item._id,
            type: "messcut",
            leavingDate: item.leavingDate,
            returnDate: item.returningDate,
            reason: item.reason,
            parentStatus: item.parentStatus,
            adminStatus: item.status,
            createdAt: item.createdAt,
              priorityDate: item.createdAt, // ✅
          });
        });
      }

      // ABSENT
      const attendanceRes = await fetch(
        `https://fredbox-backend.onrender.com/attendance/parent/today?admissionNumber=${parentUser.admissionNumber}`
      );
      const attendanceData = await attendanceRes.json();

      if (attendanceData.success && attendanceData.absent) {
        notificationsList.push({
          id: "absent-today",
          type: "absent",
          date: attendanceData.data.date,
          reason: "Student is absent today",
          createdAt: new Date().toISOString(),
           priorityDate: new Date().toISOString(), // ✅
        });
      }

      // 🔥 MERGE — NOT OVERWRITE
      setNotifications(prev => {
        const merged = [...prev, ...notificationsList];
        const unique = merged.filter(
          (v, i, a) => a.findIndex(t => t.id === v.id) === i
        );
        return unique.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      });

    } catch (err) {
      console.error("❌ Notification fetch error", err);
    }
  };

  fetchNotifications();
}, []);

useEffect(() => {
  const fetchApologyNotifications = async () => {
    try {
      const parentUser = JSON.parse(localStorage.getItem("parentUser"));
      if (!parentUser?.admissionNumber) return;

      const res = await fetch(
        `https://fredbox-backend.onrender.com/by-student/apologyadmison?admissionNo=${parentUser.admissionNumber}`
      );

      const data = await res.json();
      console.log("🟣 Apology API Response:", data);

      if (data.success && Array.isArray(data.data)) {
        const apologyNotifications = data.data.map((item) => ({
          id: `apology-${item._id}`,
          type: "apology",
          reason: item.reason,
          status: item.status,
          createdAt: item.createdAt,
          date: new Date(item.createdAt).toLocaleDateString("en-IN"),
            priorityDate: item.createdAt, // ✅
        }));

        setNotifications((prev) => {
          const merged = [...prev, ...apologyNotifications];

          // remove duplicates
          const unique = merged.filter(
            (v, i, a) => a.findIndex(t => t.id === v.id) === i
          );

          // latest first
          return unique.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
        });
      }
    } catch (err) {
      console.error("❌ Apology notification error:", err);
    }
  };

  fetchApologyNotifications();
}, []);
useEffect(() => {
  const fetchFeeDetails = async () => {
    try {
      const parentUser = JSON.parse(localStorage.getItem("parentUser"));
      if (!parentUser?.admissionNumber) return;

      const res = await fetch(
        `https://fredbox-backend.onrender.com/fees/get/${parentUser.admissionNumber}`
      );
      const data = await res.json();

      if (data.success && data.data) {
        const due = Number(data.data.totalDue) || 0;
        const paid = Number(data.data.totalPaid) || 0;

        // ✅ 1️⃣ SET feeInfo STATE (VERY IMPORTANT)
        setFeeInfo({ due, paid });

        // ✅ 2️⃣ ADD / UPDATE fee notification
        setNotifications(prev => {
          const filtered = prev.filter(n => n.id !== "fee-info");

          const feeNotification = {
            id: "fee-info",
            type: "fee",
            paid,
            due,
            updatedAt: data.data.updatedAt,
            priorityDate: data.data.updatedAt, // single date system
          };

          return [...filtered, feeNotification].sort(
            (a, b) =>
              new Date(b.priorityDate) - new Date(a.priorityDate)
          );
        });
      }
    } catch (err) {
      console.error("❌ Fee fetch error", err);
    }
  };

  fetchFeeDetails();
}, []);

useEffect(() => {
  if (!feeInfo) return;

  setNotifications(prev =>
    prev.map(n =>
      n.type === "messcut"
        ? { ...n, due: Number(feeInfo.due) || 0 }
        : n
    )
  );
}, [feeInfo]);


const getAdminStatusClass = (status) => {
  if (status === "ACCEPT") return "approved";
  if (status === "REJECT") return "rejected";
  return "pending";
};

const getParentStatusText = (status) => {
  if (status === "APPROVE") return "APPROVED";
  if (status === "REJECT") return "REJECTED";
  return "PENDING";
};


const updateParentStatus = async (id, parentStatus) => {
  try {
    console.log("Updating Parent Status for ID:", id); // 🔍 debug

    const res = await fetch(
      `https://fredbox-backend.onrender.com/parent-status/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentStatus }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to update status");
      return;
    }

    if (data.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, parentStatus } : n
        )
      );
    }
  } catch (err) {
    console.error("❌ Parent status update error", err);
  }
};



  // Inject CSS
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

        /* Prevent wrap — FORCE one row */
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
    `;
    document.head.appendChild(style);
  }, []);



  // Filtering
const filtered = (
  activeFilter === "all"
    ? notifications
    : notifications.filter((n) => n.type === activeFilter)
).sort(
  (a, b) => new Date(b.priorityDate) - new Date(a.priorityDate)
);

  return (
    <div className="dashboard-wrapper">
      {/* TOP NAV */}
      <div className="nav-container">
        {["all", "messcut", "absent", "fee", "apology"].map((category) => (
          <button
            key={category}
            className={`nav-btn ${
              activeFilter === category ? "active" : ""
            }`}
            onClick={() => setActiveFilter(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <h2 className="section-title">Notifications</h2>

   {filtered.map((item) => {
  /* ================= ABSENT NOTIFICATION ================= */
  if (item.type === "absent") {
    return (
    <div key={item.id} className="notif-card absent-card">
  <div className="notif-header">
    <div className="notif-type absent-title">
      🚨 Attendance Alert
    </div>
    <div className="notif-date">{item.date}</div>
  </div>

  <div className="notif-body">
    <div className="absent-text">
      Student is marked <strong>ABSENT</strong> today
    </div>

    <div className="absent-badge">
      ABSENT
    </div>

    <div style={{ marginTop: "8px", fontSize: "13px", color: "#7f1d1d" }}>
      Please contact hostel / warden if this is unexpected.
    </div>
  </div>
</div>

    );
  }
/* ================= APOLOGY NOTIFICATION ================= */
if (item.type === "apology") {
  const displayDate =
    item.date ||
    new Date(item.createdAt).toLocaleDateString("en-IN");

  return (
    <div key={item.id} className="notif-card apology-card">
      <div className="notif-header">
        <div className="notif-type apology-title">
          📄 Apology Request
        </div>
        <div className="notif-date">{displayDate}</div>
      </div>

      <div className="notif-body">
        <div>
          <span className="notif-label">Reason:</span>{" "}
          {item.reason}
        </div>
      </div>

      <div className={`status-badge ${
        item.status === "Approved"
          ? "approved"
          : item.status === "Rejected"
          ? "rejected"
          : "pending"
      }`}>
        STATUS : {item.status}
      </div>
    </div>
  );
}
/* ================= FEE NOTIFICATION ================= */
if (item.type === "fee") {
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
          <strong style={{ color: "#15803d" }}>
            ₹{item.paid}
          </strong>
        </div>

        <div style={{ marginTop: "6px" }}>
          <span className="notif-label">Fee Due:</span>{" "}
          <strong style={{ color: item.due >= 10000 ? "#dc2626" : "#16a34a" }}>
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
}



  /* ================= MESSCUT NOTIFICATION ================= */
  return (
    <div key={item.id} className="notif-card">
      <div className="notif-header">
        <div className="notif-type">Messcut Notification</div>
        <div className="notif-date">{item.date}</div>
      </div>

     <div className="notif-body">
  <div>
    <span className="notif-label">Leaving:</span>{" "}
    {item.leavingDate}
  </div>

  <div>
    <span className="notif-label">Return:</span>{" "}
    {item.returnDate}
  </div>

  <div>
    <span className="notif-label">Messcut count:</span>{" "}
    <strong style={{ color: "#dc2626" }}>
      {calculateMesscutDays(
  item.leavingDate,
  item.returnDate,
  feeInfo?.due || 0
)
}
    </strong>
  </div>

  {item.due >= 10000 && (
    <div className="status-badge rejected" style={{ marginTop: "8px" }}>
      🚫 Messcut blocked (Fee Due ₹{item.due})
    </div>
  )}
</div>


      {/* STATUS SECTION */}
      <div style={{ marginTop: "12px" }}>
        {/* ADMIN STATUS */}
        <div
          className={`status-badge ${getAdminStatusClass(item.adminStatus)}`}
        >
          ADMIN STATUS : {item.adminStatus || "Pending"}
        </div>

        {/* PARENT STATUS */}
        <div style={{ marginTop: "6px", fontWeight: 600, color: "#555" }}>
          PARENT STATUS : {getParentStatusText(item.parentStatus)}
        </div>
      </div>

      {/* PARENT ACTION BUTTONS */}
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



  
})}

    </div>
  );
}

export default Dashboard;
