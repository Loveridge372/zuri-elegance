import API_BASE from "../../services/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCrown,
  FaFloppyDisk,
  FaMagnifyingGlass,
  FaShieldHalved,
  FaTrashCan,
  FaUser,
  FaUsers,
} from "react-icons/fa6";
import AdminLayout from "./AdminLayout";

const WINE = "#50242A";
const GOLD = "#A38560";

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("LOAD USERS ERROR:", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateUser = async (user) => {
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(user),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "User update failed.");
        return;
      }

      setMessage(`User #${user.id} updated successfully ✨`);
      loadUsers();
    } catch (err) {
      console.error("UPDATE USER ERROR:", err);
      setMessage("Could not connect to server.");
    }
  };

  const deleteUser = async (user) => {
    setMessage("");

    if (user.is_admin) {
      setMessage("Admin accounts cannot be deleted here.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${user.full_name || user.email || "this customer"}? This will remove their account so the email can be registered again.`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Could not delete customer.");
        return;
      }

      setMessage(data.message || "Customer deleted successfully.");
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
    } catch (err) {
      console.error("DELETE USER ERROR:", err);
      setMessage("Could not connect to server.");
    }
  };

  const changeUser = (id, field, value) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, [field]: value } : user
      )
    );
  };

  const filteredUsers = users.filter((user) => {
    const text = `${user.id} ${user.full_name || ""} ${user.email || ""} ${user.phone || ""} ${user.city || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <main className="admin-users-page">
      <style>{css}</style>

      <button className="back-btn" onClick={() => navigate("/admin")}>
        <FaArrowLeft /> Back to Dashboard
      </button>

      <section className="hero">
        <div>
          <p>ZURI ADMIN</p>
          <h1>Users Manager</h1>
          <span>Manage customers, profile details, verification and admin access.</span>
        </div>

        <div className="hero-badge">
          <FaUsers />
          <strong>{users.length}</strong>
          <small>Total users</small>
        </div>
      </section>

      <section className="toolbar">
        <div className="search-box">
          <FaMagnifyingGlass />
          <input
            placeholder="Search users by name, email, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {message && <div className="message">{message}</div>}
      </section>

      <section className="users-list">
        {filteredUsers.length === 0 ? (
          <div className="empty">No users found.</div>
        ) : (
          filteredUsers.map((user) => (
            <article className="user-card" key={user.id}>
              <div className="user-top">
                <div className="avatar">
                  {user.is_admin ? <FaCrown /> : <FaUser />}
                </div>

                <div>
                  <p>USER #{user.id}</p>
                  <h2>{user.full_name || "Unnamed Customer"}</h2>
                  <span>{user.email || "No email"}</span>
                </div>

                <div className={user.is_admin ? "role admin" : "role"}>
                  <FaShieldHalved />
                  {user.is_admin ? "Admin" : "Customer"}
                </div>

                {!user.is_admin && (
                  <button
                    className="icon-delete-btn"
                    onClick={() => deleteUser(user)}
                    title="Delete customer"
                  >
                    <FaTrashCan />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              <div className="user-grid">
                <Field
                  label="Full Name"
                  value={user.full_name || ""}
                  onChange={(v) => changeUser(user.id, "full_name", v)}
                />

                <Field
                  label="Email"
                  value={user.email || ""}
                  onChange={(v) => changeUser(user.id, "email", v)}
                />

                <Field
                  label="Phone"
                  value={user.phone || ""}
                  onChange={(v) => changeUser(user.id, "phone", v)}
                />

                <Field
                  label="City"
                  value={user.city || ""}
                  onChange={(v) => changeUser(user.id, "city", v)}
                />
              </div>

              <label className="address-label">
                <span>Address</span>
                <textarea
                  value={user.address || ""}
                  onChange={(e) => changeUser(user.id, "address", e.target.value)}
                  placeholder="Customer delivery address"
                />
              </label>

              <div className="toggles">
                <label>
                  <input
                    type="checkbox"
                    checked={!!user.is_verified}
                    onChange={(e) => changeUser(user.id, "is_verified", e.target.checked)}
                  />
                  Verified User
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={!!user.is_admin}
                    onChange={(e) => changeUser(user.id, "is_admin", e.target.checked)}
                  />
                  Admin Access
                </label>
              </div>

              <div className="user-actions">
                <button className="save-btn" onClick={() => updateUser(user)}>
                  <FaFloppyDisk /> Save User
                </button>

                <button
                  className="delete-btn"
                  onClick={() => deleteUser(user)}
                  disabled={!!user.is_admin}
                  title={user.is_admin ? "Admin accounts cannot be deleted here" : "Delete customer"}
                >
                  <FaTrashCan /> Delete Customer
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

const css = `
.admin-users-page {
  min-height: 100vh;
  padding: 34px;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,.18), transparent 34%),
    #f8f4ee;
  font-family: Inter, Arial, sans-serif;
  color: #2b2023;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${WINE};
  color: white;
  border: none;
  padding: 13px 17px;
  border-radius: 16px;
  font-weight: 900;
  cursor: pointer;
  margin-bottom: 18px;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 38px;
  border-radius: 34px;
  background: linear-gradient(135deg, ${WINE}, #1f0f12);
  color: white;
  box-shadow: 0 24px 60px rgba(80,36,42,.25);
  margin-bottom: 22px;
}

.hero p {
  margin: 0;
  color: ${GOLD};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
}

.hero h1 {
  margin: 8px 0;
  font-family: Georgia, serif;
  font-size: 46px;
}

.hero span {
  color: rgba(255,255,255,.75);
  font-weight: 700;
}

.hero-badge {
  min-width: 150px;
  padding: 20px;
  border-radius: 24px;
  text-align: center;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.16);
}

.hero-badge svg {
  color: ${GOLD};
  font-size: 24px;
}

.hero-badge strong {
  display: block;
  font-size: 28px;
  margin: 6px 0;
}

.hero-badge small {
  color: rgba(255,255,255,.75);
}

.toolbar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  margin-bottom: 20px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border-radius: 18px;
  padding: 0 15px;
  color: ${GOLD};
  box-shadow: 0 14px 34px rgba(80,36,42,.09);
}

.search-box input {
  width: 100%;
  border: none;
  outline: none;
  padding: 16px 0;
  background: transparent;
  font-weight: 800;
}

.message {
  padding: 14px 18px;
  border-radius: 18px;
  background: rgba(18,140,86,.10);
  color: #128c56;
  font-weight: 900;
}

.users-list {
  display: grid;
  gap: 18px;
}

.user-card {
  background: rgba(255,255,255,.9);
  border: 1px solid rgba(80,36,42,.08);
  box-shadow: 0 18px 42px rgba(80,36,42,.11);
  border-radius: 30px;
  padding: 24px;
}

.user-top {
  display: grid;
  grid-template-columns: 74px 1fr auto;
  gap: 16px;
  align-items: center;
  margin-bottom: 18px;
}

.avatar {
  width: 74px;
  height: 74px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, ${WINE}, #2b1114);
  color: ${GOLD};
  font-size: 27px;
}

.user-top p {
  margin: 0;
  color: ${GOLD};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
}

.user-top h2 {
  margin: 6px 0;
  font-family: Georgia, serif;
  font-size: 28px;
  color: ${WINE};
}

.user-top span {
  color: #777;
  font-weight: 800;
}

.role {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8f4ee;
  color: ${WINE};
  padding: 11px 14px;
  border-radius: 999px;
  font-weight: 900;
}

.role.admin {
  background: linear-gradient(135deg, rgba(163,133,96,.22), #fff);
  color: ${WINE};
  box-shadow: inset 0 0 0 1px rgba(163,133,96,.22);
}

.icon-delete-btn {
  border: none;
  border-radius: 999px;
  padding: 11px 14px;
  background: rgba(161,50,50,.10);
  color: #a13232;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 900;
  cursor: pointer;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.field span,
.address-label span {
  display: block;
  color: ${WINE};
  font-weight: 900;
  font-size: 13px;
  margin-bottom: 7px;
}

.field input,
.address-label textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #eadfd6;
  outline: none;
  border-radius: 16px;
  background: #f8f4ee;
  padding: 14px;
  color: #2b2023;
  font-weight: 800;
}

.address-label {
  display: block;
  margin-top: 14px;
}

.address-label textarea {
  min-height: 78px;
  resize: vertical;
}

.toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin: 18px 0;
}

.toggles label {
  display: flex;
  align-items: center;
  gap: 9px;
  background: #f8f4ee;
  color: ${WINE};
  padding: 11px 14px;
  border-radius: 999px;
  font-weight: 900;
}

.toggles input {
  accent-color: ${WINE};
}

.user-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.save-btn,
.delete-btn {
  width: 100%;
  border: none;
  border-radius: 17px;
  padding: 15px;
  cursor: pointer;
  font-weight: 900;
  background: linear-gradient(135deg, ${WINE}, #2b1114);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
}

.delete-btn {
  width: auto;
  min-width: 190px;
  background: #fff;
  color: #a13232;
  border: 1px solid rgba(161,50,50,.22);
}

.delete-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.empty {
  padding: 24px;
  background: white;
  border-radius: 24px;
  color: ${WINE};
  font-weight: 900;
  box-shadow: 0 14px 34px rgba(80,36,42,.09);
}

@media (max-width: 1000px) {
  .user-grid {
    grid-template-columns: 1fr 1fr;
  }

  .toolbar {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .admin-users-page {
    padding: 18px;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 28px;
  }

  .hero h1 {
    font-size: 34px;
  }

  .user-top {
    grid-template-columns: 64px 1fr;
  }

  .role {
    grid-column: 1 / -1;
    width: fit-content;
  }

  .icon-delete-btn {
    grid-column: 1 / -1;
    width: 100%;
  }

  .user-grid {
    grid-template-columns: 1fr;
  }

  .user-actions {
    grid-template-columns: 1fr;
  }

  .delete-btn {
    width: 100%;
  }
}
`;
