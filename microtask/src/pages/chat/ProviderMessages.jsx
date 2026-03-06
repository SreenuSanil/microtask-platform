import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./ProviderMessages.css";
import ChatPage from "./ChatPage";

const ProviderMessages = () => {
  const [invites, setInvites] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeTab, setActiveTab] = useState("negotiation");
  const [selectedChat, setSelectedChat] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchInvites();
    fetchChats();
  }, []);

  useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id || storedUser?._id;

  socketRef.current = io("http://localhost:5000");

  socketRef.current.emit("join_user", userId);

  // 🔥 When unread updated (chat opened)
  socketRef.current.on("refresh_unread", () => {
    fetchChats(); // update worker cards
  });

  // 🔥 When new message arrives
  socketRef.current.on("new_unread", () => {
    fetchChats();
  });

  return () => {
    socketRef.current.disconnect();
  };
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

  const fetchChats = async () => {
    const res = await fetch(
      "http://localhost:5000/api/connections/my-chats",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const data = await res.json();
    if (res.ok) setChats(data);
  };


const negotiationList = chats.filter(
  c =>
    c.taskStatus === "open" ||
    c.taskStatus === "assigned"
);

const ongoingList = chats.filter(
  c => c.taskStatus === "in_progress"
);

const completedList = chats.filter(
  c => c.taskStatus === "completed"
);

  const renderList = (list) =>
    list.map(item => (
      <div
        key={item._id}
        className="message-row"
        onClick={() => setSelectedChat(item)}
      >
        <img
          className="profile-pic"
          src={
            item.worker?.profileImage
              ? `http://localhost:5000/${item.worker.profileImage}`
              : "/default-user.png"
          }
          alt="worker"
        />

        <div className="message-info">
            <div className="name-row">
          <h4>{item.worker?.name}</h4>
              {item.unreadCount > 0 && (
      <span className="chat-badge">
        {item.unreadCount}
      </span>
    )}
    </div>
          <p>{item.task?.requiredSkill}</p>
        </div>
      </div>
    ));

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
      <h2>Messages</h2>

      <div className="msg-tabs">
        <button
          className={activeTab === "negotiation" ? "active" : ""}
          onClick={() => setActiveTab("negotiation")}
        >
          Negotiation
        </button>

        <button
          className={activeTab === "ongoing" ? "active" : ""}
          onClick={() => setActiveTab("ongoing")}
        >
          Ongoing
        </button>

        <button
          className={activeTab === "completed" ? "active" : ""}
          onClick={() => setActiveTab("completed")}
        >
          Completed
        </button>
      </div>

      {activeTab === "negotiation" && renderList(negotiationList)}
      {activeTab === "ongoing" && renderList(ongoingList)}
      {activeTab === "completed" && renderList(completedList)}
    </div>
  );
};

export default ProviderMessages;