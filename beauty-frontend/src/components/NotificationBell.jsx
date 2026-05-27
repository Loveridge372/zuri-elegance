import API_BASE from "../services/api";
import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";

const WINE = "#50242A";
const GOLD = "#A38560";

export default function NotificationBell() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id;

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = async () => {
    if (!userId) return;

    try {
      const res = await fetch(`${API_BASE}/notifications/${userId}`);
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("NOTIFICATION ERROR:", err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const markAllRead = async () => {
    if (!userId) return;

    await fetch(`${API_BASE}/notifications/${userId}/read-all`, {
      method: "PATCH",
    });

    loadNotifications();
  };

  return (
    <div style={styles.wrap}>
      <button style={styles.bell} onClick={() => setOpen(!open)}>
        <FaBell />
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.top}>
            <strong>Notifications</strong>
            <button style={styles.readBtn} onClick={markAllRead}>
              Mark read
            </button>
          </div>

          {notifications.length > 0 ? (
            notifications.map((item) => (
              <div
                key={item.id}
                style={{
                  ...styles.item,
                  ...(item.is_read ? {} : styles.unread),
                }}
              >
                <strong>{item.title}</strong>
                <p>{item.message}</p>
              </div>
            ))
          ) : (
            <p style={styles.empty}>No notifications yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    position: "relative",
  },
  bell: {
    position: "relative",
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,.12)",
    color: "#fff",
    cursor: "pointer",
  },
  badge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    minWidth: "18px",
    height: "18px",
    borderRadius: "999px",
    background: GOLD,
    color: WINE,
    fontSize: "11px",
    fontWeight: "900",
    display: "grid",
    placeItems: "center",
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "48px",
    width: "320px",
    maxWidth: "85vw",
    background: "#fff",
    color: "#2b2023",
    borderRadius: "18px",
    padding: "14px",
    boxShadow: "0 20px 50px rgba(0,0,0,.18)",
    zIndex: 9999,
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    color: WINE,
  },
  readBtn: {
    border: "none",
    background: "transparent",
    color: GOLD,
    fontWeight: "900",
    cursor: "pointer",
  },
  item: {
    padding: "12px",
    borderRadius: "14px",
    background: "#f8f4ee",
    marginBottom: "8px",
  },
  unread: {
    borderLeft: `4px solid ${GOLD}`,
  },
  empty: {
    color: "#777",
    fontWeight: "700",
  },
};
