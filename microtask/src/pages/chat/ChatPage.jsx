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
  const [taskId, setTaskId] = useState(null);

const [taskStatus, setTaskStatus] = useState(null);
const [paymentStatus, setPaymentStatus] = useState(null);
const [budget, setBudget] = useState(null);

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

setTaskId(data.taskId);
setTaskStatus(data.taskStatus);
setPaymentStatus(data.paymentStatus);
setBudget(data.budget);
console.log({
  connectionStatus,
  taskStatus,
  paymentStatus,
  isProvider
});

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

   window.location.reload();

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

    window.location.reload();

    // 🔥 optional but recommended
    setTimeout(() => {
      window.location.reload();
    }, 500);

  } catch (err) {
    console.log("Worker confirm error:", err);
  }
};

const handleIncreaseBudget = async () => {
  try {
    const res = await fetch(
      `http://localhost:5000/api/connections/update-budget/${connectionId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ newAmount: budget }),
      }
    );

    if (!res.ok) {
      alert("Budget must be higher than original");
      return;
    }

    const resData = await res.json();
     setBudget(resData.amount);
     
      alert("Budget updated successfully");

  } catch (err) {
    console.error("Budget update error:", err);
  }
};

const handleTaskPayment = async () => {
  try {
    const res = await fetch(
      `http://localhost:5000/api/payment/task/create-order/${taskId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    // 🔥 THIS PART IS CRITICAL
    if (!res.ok) {
      const err = await res.json();
      alert(err.message);
      return;   // STOP if backend failed
    }

    const order = await res.json();

    console.log("Order received:", order);

    const options = {
      key: "rzp_test_RS7N4gK5yMwA9E",
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: "TaskNest Escrow",
      description: "Task Escrow Payment",

      handler: async function (response) {
        console.log("Razorpay response:", response);

        await fetch(
          `http://localhost:5000/api/payment/task/verify-payment/${taskId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(response),
          }
        );

        window.location.reload();  // 🔥 VERY IMPORTANT
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error("Payment error:", err);
  }
};
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

{/* ===== BUDGET INCREASE SECTION ===== */}

{connectionStatus === "accepted" && isProvider && (
  <div className="confirm-job-box provider-box">
    <p>Increase budget if needed (cannot reduce)</p>

    <input
      type="number"
      placeholder="Enter new amount"
      value={budget || ""}
      onChange={(e) => setBudget(e.target.value)}
    />

    <button onClick={handleIncreaseBudget}>
      Update Budget
    </button>
  </div>
)}

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

{/* ===== PAYMENT SECTION ===== */}

{isProvider &&
 connectionStatus === "confirmed" &&
 paymentStatus !== "paid" &&
 taskId && (
  <div className="confirm-job-box provider-box">
    <p>Escrow Amount: ₹{budget}</p>
    <button onClick={handleTaskPayment}>
      Pay & Start Work
    </button>
  </div>
)}

  {paymentStatus === "paid" && (
  <div className="confirm-job-box worker-box">
    <p>✅ Escrow locked.</p>
    <p>Escrow Amount: ₹{budget}</p>
    <p>Work started.</p>
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
