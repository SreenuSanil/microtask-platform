import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./ChatPage.css";


const ChatPage = ({ connectionId }) => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connectionStatus, setConnectionStatus] = useState(null);
 const [budgetConfirmed, setBudgetConfirmed] = useState(false);
   const [previewImage, setPreviewImage] = useState(null);
  const socketRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const [isProvider, setIsProvider] = useState(false);
 
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

  /* SOCKET CONNECT */
  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.emit("join_room", connectionId);

    socketRef.current.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [connectionId]);

  /* FETCH HISTORY */
  useEffect(() => {
   const fetchHistory = async () => {
  try {
    const res = await fetch(
      `http://localhost:5000/api/messages/${connectionId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!res.ok) {
      console.log("Chat fetch failed:", res.status);
      setMessages([]); // prevent crash
      return;
    }

    const data = await res.json();

setMessages(data.messages || []);
setConnectionStatus(data.status);
setBudgetConfirmed(data.budgetConfirmed);
setIsProvider(data.isProvider);

  } catch (err) {
    console.log("Fetch error:", err);
    setMessages([]);
  }
};


    fetchHistory();
  }, [connectionId]);



  /* SEND TEXT */
  const sendMessage = () => {
    if (!text.trim()) return;

    socketRef.current.emit("send_message", {
      connectionId,
      type: "text",
      message: text,
       token: localStorage.getItem("token"),
    });

    setText("");
  };

  /* IMAGE UPLOAD */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(
      `http://localhost:5000/api/messages/image/${connectionId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      }
    );
  const newMessage = await res.json();

  // 🔥 Directly broadcast saved message
  socketRef.current.emit("broadcast_message", {
    connectionId,
    message: newMessage,
  });
};
    
 const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const mediaRecorder = new MediaRecorder(stream);
  mediaRecorderRef.current = mediaRecorder;
  audioChunksRef.current = [];

  mediaRecorder.ondataavailable = (e) => {
    audioChunksRef.current.push(e.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, {
      type: "audio/webm",
    });

    const formData = new FormData();
    formData.append("voice", audioBlob);

    const res = await fetch(
      `http://localhost:5000/api/messages/voice/${connectionId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      }
    );

  const newMessage = await res.json();

  socketRef.current.emit("broadcast_message", {
    connectionId,
    message: newMessage,
  });
};

  mediaRecorder.start();
  setRecording(true);
};
const stopRecording = () => {
  mediaRecorderRef.current.stop();
  setRecording(false);
};

const confirmJob = async () => {

  const sure = window.confirm(
    "Are you sure you want to confirm this job and lock the budget?"
  );

  if (!sure) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/connections/confirm/${connectionId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!res.ok) {
      console.log("Confirm failed");
      return;
    }

    setConnectionStatus("provider_confirmed");
    setBudgetConfirmed(true);

  } catch (err) {
    console.log("Error confirming job:", err);
  }
};

const workerConfirm = async () => {
  try {
    const res = await fetch(
      `http://localhost:5000/api/connections/worker-confirm/${connectionId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!res.ok) {
      console.log("Worker confirm failed");
      return;
    }

    setConnectionStatus("confirmed");

    // 🔥 optional but recommended
    setTimeout(() => {
      window.location.reload();
    }, 500);

  } catch (err) {
    console.log("Worker confirm error:", err);
  }
};
  console.log("STATUS:", connectionStatus);
  console.log("IS PROVIDER:", isProvider);
  return (
    <div className="chat-container">
      
      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg._id}
            
className={`chat-message ${
  (msg.sender?._id || msg.sender)?.toString() === userId
    ? "sent"
    : "received"
}`}
          >
            {msg.type === "text" && (
              <div className="message-content">{msg.message}</div>
            )}

            {msg.type === "image" && (
              <img
                src={`http://localhost:5000/${msg.imageUrl}`}
                alt="chat"
                className="chat-image"
                 onClick={() =>
                  setPreviewImage(`http://localhost:5000/${msg.imageUrl}`)
               }
              />
            )}

            {msg.type === "voice" && (
  <audio
    controls
    src={`http://localhost:5000/${msg.voiceUrl}`}
  ></audio>
)}

          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
{/* ===== JOB CONFIRMATION SECTION ===== */}

{connectionStatus === "accepted" && isProvider && (
  <div className="confirm-job-box provider-box">
    <p>Lock the budget and confirm this worker?</p>
    <button onClick={confirmJob}>
      Confirm Job & Lock Budget
    </button>
  </div>
)}

{connectionStatus === "provider_confirmed" && !isProvider && (
  <div className="confirm-job-box worker-box">
    <p>Provider confirmed the job. Start working?</p>
    <button onClick={workerConfirm}>
      Accept & Start Work
    </button>
  </div>
)}

     
{connectionStatus !== "closed" && (
  <div className="chat-input-area">
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Type message..."
    />

    <input
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      style={{ display: "none" }}
      id="imageUpload"
    />

    <label htmlFor="imageUpload" className="image-btn">
      📎
    </label>

    {!recording ? (
      <button onClick={startRecording}>🎤</button>
    ) : (
      <button onClick={stopRecording}>⏹</button>
    )}

    <button onClick={sendMessage}>Send</button>
  </div>
)}

{connectionStatus === "closed" && (
  <div className="readonly-msg">Chat closed</div>
)}
{previewImage && (
  <div
    className="image-preview-overlay"
    onClick={() => setPreviewImage(null)}
  >
    <img
      src={previewImage}
      alt="preview"
      className="image-preview-large"
    />
  </div>
)}
      
    </div>
    
  );
};

export default ChatPage;
