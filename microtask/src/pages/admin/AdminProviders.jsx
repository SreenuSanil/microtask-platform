import { useEffect, useState } from "react";
import defaultAvatar from "../../assets/default-avatar.png";
import "./AdminProviders.css";

const AdminProviders = () => {
  const token = localStorage.getItem("token");

  const [providers, setProviders] = useState([]);
  const [providerTab, setProviderTab] = useState("active");
  const [search, setSearch] = useState("");
const [showBlockModal, setShowBlockModal] = useState(false);
const [selectedProvider, setSelectedProvider] = useState(null);
const [blockReason, setBlockReason] = useState("");
const [blockDate, setBlockDate] = useState("");
  const getProfileImage = (user) => {
    if (user.profileImage) {
      return `https://microtask-platform-backend-y3xo.onrender.com/${user.profileImage}`;
    }
    return defaultAvatar;
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch(
        "https://microtask-platform-backend-y3xo.onrender.com/api/admin/providers",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setProviders(Array.isArray(data) ? data : []);
    } catch {
      alert("Failed to load providers");
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

const submitBlockProvider = async () => {
  if (!blockReason) {
    alert("Enter reason");
    return;
  }

  let days = null;

  if (blockDate) {
    const selected = new Date(blockDate);
    const today = new Date();

    const diffTime = selected - today;
    days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/providers/block", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      providerId: selectedProvider,
      reason: blockReason,
      days,
    }),
  });

  setShowBlockModal(false);
  setBlockReason("");
  setBlockDate("");

  fetchProviders();
};

  const unblockProvider = async (id) => {
    await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/providers/unblock", {
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

    await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/providers/remove", {
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

      {/* SEARCH + TABS */}
      <div className="top-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

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
      </div>

      <div className="approved-grid">
        {providers
          .filter((p) => {
            const statusMatch =
              providerTab === "active"
                ? p.accountStatus === "active"
                : providerTab === "blocked"
                ? p.accountStatus === "blocked"
                : p.accountStatus === "removed";

            const nameMatch = p.name
              ?.toLowerCase()
              .includes(search.toLowerCase());

            return statusMatch && nameMatch;
          })
          .map((provider) => {

            const highlightId = localStorage.getItem("highlightUser");
const isHighlighted = highlightId === provider._id;
            // ✅ CORRECT PLACE
            const totalTasks =
              provider.completedTasks + provider.cancelCount;

            const cancelRate =
              totalTasks > 0
                ? (provider.cancelCount / totalTasks) * 100
                : 0;

            return (
            <div
  key={provider._id}
  className={`approved-card ${isHighlighted ? "highlight-card" : ""}`}
>

                <span className={`status-badge ${provider.accountStatus}`}>
                  {provider.accountStatus?.toUpperCase()}
                </span>

                <div className="card-top">
                  <img
                    src={getProfileImage(provider)}
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

                  {/* ✅ NEW CANCEL RATE */}
                  <p
                    className={`cancel-count ${
                      cancelRate > 15
                        ? "danger"
                        : cancelRate > 5
                        ? "warning"
                        : ""
                    }`}
                  >
                    Cancels: {provider.cancelCount} ({cancelRate.toFixed(1)}%)
                  </p>
                </div>

                {providerTab === "blocked" && (
                  <div className="reason-section">
                    <p><strong>Reason:</strong> {provider.blockReason}</p>
                  </div>
                )}
                {provider.blockedUntil && (
  <p className="blocked-until">
    Blocked Until: {new Date(provider.blockedUntil).toLocaleDateString()}
  </p>
)}

                <div className="card-actions">
                  {providerTab === "active" && (
                    <>
<button
  className="btn-block"
  onClick={() => {
    setSelectedProvider(provider._id);
    setShowBlockModal(true);
  }}
>
  Block
</button>
                      <button className="btn-remove" onClick={() => removeProvider(provider._id)}>
                        Remove
                      </button>
                    </>
                  )}

                  {providerTab === "blocked" && (
                    <>
                      <button className="btn-unblock" onClick={() => unblockProvider(provider._id)}>
                        Unblock
                      </button>
                      <button className="btn-remove" onClick={() => removeProvider(provider._id)}>
                        Remove
                      </button>
                    </>
                  )}
                </div>

              </div>
            );
          })}
      </div>
      {showBlockModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h3>Block Provider</h3>

      <input
        type="text"
        placeholder="Enter reason"
        value={blockReason}
        onChange={(e) => setBlockReason(e.target.value)}
      />

      <label>Block Until (optional)</label>
      <input
        type="date"
        value={blockDate}
        onChange={(e) => setBlockDate(e.target.value)}
      />

      <div className="modal-actions">
        <button className="btn-submit" onClick={submitBlockProvider}>
          Confirm
        </button>

        <button
          className="btn-cancel"
          onClick={() => setShowBlockModal(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default AdminProviders;