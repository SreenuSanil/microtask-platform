import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./WorkerMessages.css";
import ChatPage from "./ChatPage";

const WorkerMessages = () => {
  const [chats, setChats] = useState([]);
  const [activeTab, setActiveTab] = useState("negotiation");
  const [selectedChat, setSelectedChat] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id || storedUser?._id;

  socketRef.current = io("http://localhost:5000");

  socketRef.current.emit("join_user", userId);

  socketRef.current.on("refresh_unread", () => {
    fetchChats();
  });

  socketRef.current.on("new_unread", () => {
    fetchChats();
  });

  return () => {
    socketRef.current.disconnect();
  };
}, []);

  const fetchChats = async () => {
    try {
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
    } catch (err) {
      console.error("Failed to fetch chats");
    }
  };

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

      {/* ===== TAB BUTTONS ===== */}
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

      {/* ===== NEGOTIATION ===== */}
      {activeTab === "negotiation" && (
        <>
          <h3 className="section-title">Negotiation</h3>

          {chats.filter(
            (c) =>
              c.status === "accepted" ||
              c.status === "provider_confirmed"
          ).length === 0 ? (
            <p>No negotiation chats</p>
          ) : (
            chats
              .filter(
                (c) =>
                  c.status === "accepted" ||
                  c.status === "provider_confirmed"
              )
              .map((chat) => (
                <div
                  key={chat._id}
                  className="message-card"
                  onClick={() =>
                    setSelectedChat(chat)
                  }
                >
                  <div className="msg-row">
                    <img
                      src={
                        chat.provider?.profileImage
                          ? `http://localhost:5000/${chat.provider.profileImage}`
                          : "/default-user.png"
                      }
                      alt="provider"
                    />
<div className="title-row">
  <h4>{chat.task?.title}</h4>

  {chat.unreadCount > 0 && (
    <span className="chat-badge">
      {chat.unreadCount}
    </span>
  )}
</div>

<p>{chat.provider?.name}</p>
                  </div>
                </div>
              ))
          )}
        </>
      )}

      {/* ===== ONGOING ===== */}
      {activeTab === "ongoing" && (
        <>
          <h3 className="section-title">Ongoing Works</h3>

          {chats.filter((c) => c.status === "confirmed").length === 0 ? (
            <p>No ongoing chats</p>
          ) : (
            chats
              .filter((c) => c.status === "confirmed")
              .map((chat) => (
                <div
                  key={chat._id}
                  className="message-card"
                  onClick={() =>
                   setSelectedChat(chat)
                  }
                >
                  <div className="msg-row">
                    <img
                      src={
                        chat.provider?.profileImage
                          ? `http://localhost:5000/${chat.provider.profileImage}`
                          : "/default-user.png"
                      }
                      alt="provider"
                    />
<div className="title-row">
  <h4>{chat.task?.title}</h4>

  {chat.unreadCount > 0 && (
    <span className="chat-badge">
      {chat.unreadCount}
    </span>
  )}
</div>

<p>{chat.provider?.name}</p>
                  </div>
                </div>
              ))
          )}
        </>
      )}

      {/* ===== COMPLETED ===== */}
      {activeTab === "completed" && (
        <>
          <h3 className="section-title">Completed Works</h3>

          {chats.filter((c) => c.status === "closed").length === 0 ? (
            <p>No completed chats</p>
          ) : (
            chats
              .filter((c) => c.status === "closed")
              .map((chat) => (
                <div
                  key={chat._id}
                  className="message-card completed"
                  onClick={() =>
                   setSelectedChat(chat)
                  }
                >
                  <div className="msg-row">
                    <img
                      src={
                        chat.provider?.profileImage
                          ? `http://localhost:5000/${chat.provider.profileImage}`
                          : "/default-user.png"
                      }
                      alt="provider"
                    />
 <div className="title-row">
  <h4>{chat.task?.title}</h4>

  {chat.unreadCount > 0 && (
    <span className="chat-badge">
      {chat.unreadCount}
    </span>
  )}
</div>

<p>{chat.provider?.name}</p>

                  </div>
                </div>
              ))
          )}
        </>
      )}


    </div>
  );
};

export default WorkerMessages;