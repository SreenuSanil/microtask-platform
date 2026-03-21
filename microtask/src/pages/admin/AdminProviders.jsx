import { useEffect, useState } from "react";
import defaultAvatar from "../../assets/default-avatar.png";
import "./AdminProviders.css";

const AdminProviders = () => {
  const token = localStorage.getItem("token");

  const [providers, setProviders] = useState([]);
  const [providerTab, setProviderTab] = useState("active");

  const getProfileImage = (user) => {
    if (user.profileImage) {
      return `http://localhost:5000/${user.profileImage}`;
    }
    return defaultAvatar;
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/admin/providers",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setProviders(data);
    } catch {
      alert("Failed to load providers");
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const blockProvider = async (id) => {
    const reason = prompt("Reason for blocking?");
    if (!reason) return;

    const days = prompt(
      "Block for how many days?\nLeave empty for permanent block"
    );

    await fetch("http://localhost:5000/api/admin/providers/block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        providerId: id,
        reason,
        days: days ? Number(days) : null,
      }),
    });

    alert("Provider blocked");
    fetchProviders();
  };

  const unblockProvider = async (id) => {
    await fetch("http://localhost:5000/api/admin/providers/unblock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ providerId: id }),
    });

    alert("Provider unblocked");
    fetchProviders();
  };

  const removeProvider = async (id) => {
    const reason = prompt("Reason for removal?");
    if (!reason) return;

    await fetch("http://localhost:5000/api/admin/providers/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ providerId: id, reason }),
    });

    alert("Provider removed");
    fetchProviders();
  };

  return (
    <div className="provider-management">
      <h2 className="section-title">Provider Management</h2>

      <div className="worker-tabs">
        <button
          className={providerTab === "active" ? "active" : ""}
          onClick={() => setProviderTab("active")}
        >
          Active
        </button>
        <button
          className={providerTab === "blocked" ? "active" : ""}
          onClick={() => setProviderTab("blocked")}
        >
          Blocked
        </button>
        <button
          className={providerTab === "removed" ? "active" : ""}
          onClick={() => setProviderTab("removed")}
        >
          Removed
        </button>
      </div>

      <div className="approved-grid">
        {providers
          .filter((p) =>
            providerTab === "active"
              ? p.accountStatus === "active"
              : providerTab === "blocked"
              ? p.accountStatus === "blocked"
              : p.accountStatus === "removed"
          )
          .map((provider) => (
            <div key={provider._id} className="approved-card">

              <span className={`status-badge ${provider.accountStatus}`}>
                {provider.accountStatus?.toUpperCase()}
              </span>

              <div className="card-top">
                <img
                  src={getProfileImage(provider)}
                  alt={provider.name}
                  className="profile-img"
                />

                <div className="worker-main">
                  <h4>{provider.name}</h4>
                  <p className="email">{provider.email}</p>
                </div>
              </div>

              <div className="card-details">
                <p><strong>Organization:</strong> {provider.organization}</p>
                <p><strong>Location:</strong> {provider.address}</p>
              </div>

              {providerTab === "blocked" && (
                <div className="reason-section">
                  <p><strong>Reason:</strong> {provider.blockReason}</p>
                </div>
              )}

              <div className="card-actions">
                {providerTab === "active" && (
                  <>
                    <button className="btn-block" onClick={() => blockProvider(provider._id)}>Block</button>
                    <button className="btn-remove" onClick={() => removeProvider(provider._id)}>Remove</button>
                  </>
                )}

                {providerTab === "blocked" && (
                  <>
                    <button className="btn-unblock" onClick={() => unblockProvider(provider._id)}>Unblock</button>
                    <button className="btn-remove" onClick={() => removeProvider(provider._id)}>Remove</button>
                  </>
                )}
              </div>

            </div>
          ))}
      </div>
    </div>
  );
};

export default AdminProviders;