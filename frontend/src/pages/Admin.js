import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});

  const API = "http://localhost:8000/api/admin";

  const loadUsers = async () => {
    const res = await axios.get(`${API}/users?is_admin=true`);
    setUsers(res.data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    await axios.delete(`${API}/users/${id}?is_admin=true`);
    loadUsers();
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setForm(user);
  };

  const saveEdit = async () => {
    await axios.put(`${API}/users/${editingId}?is_admin=true`, form);
    setEditingId(null);
    loadUsers();
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* 🔥 SIDEBAR */}
      <div style={{
        width: "220px",
        background: "#1b5e20",
        color: "white",
        padding: "20px"
      }}>
        <h2>Admin</h2>

        <div style={{ marginTop: "30px" }}>
          <p style={{ cursor: "pointer" }}>👥 Users</p>
          <p style={{ cursor: "pointer" }}>📊 Analytics</p>
          <p style={{ cursor: "pointer" }}>⚙ Settings</p>
        </div>
      </div>

      {/* 🔥 MAIN CONTENT */}
      <div style={{ flex: 1, padding: "20px", background: "#f5f5f5" }}>
        <h2>👨‍💼 Farmer Management</h2>

        <table border="1" cellPadding="10" width="100%" style={{ background: "white" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>District</th>
              <th>Land Size</th>
              <th>Crops</th>
              <th>Badges</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {editingId === u.id ? (
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  ) : (
                    u.name
                  )}
                </td>

                <td>
                  {editingId === u.id ? (
                    <input
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  ) : (
                    u.email
                  )}
                </td>

                <td>
                  {editingId === u.id ? (
                    <input
                      value={form.district}
                      onChange={(e) =>
                        setForm({ ...form, district: e.target.value })
                      }
                    />
                  ) : (
                    u.district
                  )}
                </td>

                <td>
                  {editingId === u.id ? (
                    <input
                      value={form.land_size}
                      onChange={(e) =>
                        setForm({ ...form, land_size: e.target.value })
                      }
                    />
                  ) : (
                    u.land_size
                  )}
                </td>

                <td>{u.total_crops}</td>
                <td>{u.badges}</td>

                <td>
                  {editingId === u.id ? (
                    <>
                      <button onClick={saveEdit}>💾</button>
                      <button onClick={() => setEditingId(null)}>❌</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(u)}>✏️</button>
                      <button onClick={() => deleteUser(u.id)}>🗑</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}