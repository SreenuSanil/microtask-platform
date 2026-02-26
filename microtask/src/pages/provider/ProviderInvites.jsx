import { useEffect, useState } from "react";
import ChatPage from "../chat/ChatPage";
import "./ProviderInvites.css";

const ProviderInvites = () => {
  const [invites, setInvites] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    const res = await fetch(
      "http://localhost:5000/api/connections/provider-invites",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();
    if (res.ok) setInvites(data);
  };

  // 🔥 SHOW CHAT FULL PAGE (LIKE WORKER PAGE)
  if (selectedChat) {
    return (
      <div className="full-chat-wrapper">
        <div
          className="chat-back-btn"
          onClick={() => setSelectedChat(null)}
        >
          ← Back
        </div>

        <ChatPage connectionId={selectedChat._id} />
      </div>
    );
  }

  return (
    <div className="messages-page">
      <h2>Worker Invitations</h2>

      {invites.length === 0 ? (
        <p>No worker responses</p>
      ) : (
       invites.map(inv => {

  const requiredSkill = inv.task?.requiredSkill?.toLowerCase();

  const matchedSkill = inv.worker?.skillRatings?.find(
    s => s.skill.toLowerCase() === requiredSkill
  );

  const rating =
    matchedSkill && matchedSkill.ratingAverage > 0
      ? matchedSkill.ratingAverage.toFixed(1)
      : "New";


     const formatName = (name = "") =>
  name
    .toLowerCase()
    .split(" ")
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" "); 

  return (
    <div key={inv._id} className="invite-card">

      <img
        src={
          inv.worker?.profileImage
            ? `http://localhost:5000/${inv.worker.profileImage}`
            : "/default-user.png"
        }
        alt="worker"
      />

      <div className="invite-info">
        
        <h4>{formatName(inv.worker?.name)}</h4>

        <p>🛠 {inv.task?.requiredSkill}</p>

        <p>⭐ {rating}</p>

        <p className={`status ${inv.status}`}>
          {inv.status.toUpperCase()}
        </p>

        {inv.status === "accepted" && (
          <button onClick={() => setSelectedChat(inv)}>
            Open Chat
          </button>
        )}
      </div>

    </div>
  );
})
        
      )}
    </div>
  );
};

export default ProviderInvites;