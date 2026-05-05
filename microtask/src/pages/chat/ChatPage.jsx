import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./ChatPage.css";
import { useParams } from "react-router-dom";

const ChatPage = ({ connectionId: propConnectionId }) => {
  const params = useParams();
   const connectionId = propConnectionId || params.connectionId;
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?._id || storedUser?.id;
const [loading, setLoading] = useState(true);
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
const [taskDate, setTaskDate] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
 const [isWorkerBusy, setIsWorkerBusy] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
 const [popupMessage, setPopupMessage] = useState("");

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

  /* SOCKET CONNECT */
  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.emit("join_room", connectionId);
 socketRef.current.emit("join_user", userId);


socketRef.current.on("job_taken", (data) => {
  setPopupMessage(data.message);

  // close chat
  setConnectionStatus("closed");

  // auto hide after 3 sec
  setTimeout(() => {
    setPopupMessage("");
  }, 3000);
});
    socketRef.current.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

return () => {
  socketRef.current.off("job_taken");
  socketRef.current.off("receive_message");
  socketRef.current.disconnect();
};

  }, [connectionId]);

  /* FETCH HISTORY */
  useEffect(() => {
   const fetchHistory = async () => {
  try {
    setLoading(true);
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
setIsWorkerBusy(data.isWorkerBusy || false);
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

  if (isWorkerBusy) {
    const confirmProceed = window.confirm(
      "⚠ Worker already has another job on this date.\n\nYou may need to wait.\n\nDo you still want to confirm?"
    );

    if (!confirmProceed) return;
  }

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
        body: JSON.stringify({ 
        newAmount: budget,
        newDate: taskDate
        }),
      }
    );

    if (!res.ok) {
      alert("Budget must be higher than original");
      return;
    }

const resData = await res.json();

setBudget(resData.amount);
setTaskDate(resData.taskDate); 
setIsWorkerBusy(resData.isWorkerBusy);


setIsWorkerBusy(resData.isWorkerBusy || false);

alert("Budget & date updated successfully");

  } catch (err) {
    console.error("Budget update error:", err);
  }
};

const handleTaskPayment = async () => {

if (isWorkerBusy) {
  const confirmPay = window.confirm(
    "⚠ This worker already has another task on this date.\n\nYou may need to wait until the worker completes that work.\n\nDo you still want to continue with payment?"
  );

  if (!confirmPay) {
    // ✅ DO NOTHING (just stop payment)
    return;
  }

  }

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

    if (!res.ok) {
      const err = await res.json();
      alert(err.message);
      return;
    }

    const order = await res.json();

    const options = {
      key: "rzp_test_RS7N4gK5yMwA9E",
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: "TaskNest Escrow",
      description: "Task Escrow Payment",

      handler: async function (response) {
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

        window.location.reload();
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error("Payment error:", err);
  }
};

  return (
  <>
    {popupMessage && (
      <div className="popup-notification">
        {popupMessage}
      </div>
    )}

    <div className="chat-container">
      
      <div className="chat-messages">
        
        {messages.map((msg) => (
          <div
            key={msg._id}
            
className={`chat-message ${
  (
    (typeof msg.sender === "object"
      ? msg.sender._id
      : msg.sender
    )?.toString() === userId?.toString()
  )
    ? "sent"
    : "received"
}`}
          >
            <div className="message-content">
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
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
      
{/* ===== BUDGET INCREASE SECTION ===== */}

{connectionStatus === "accepted" && isProvider && (
  <div className="confirm-job-box provider-box">

    {/* ⚠ WARNING */}
<p
  style={{
    color: isWorkerBusy ? "#f59e0b" : "#10b981",
    fontWeight: "600",
  }}
>
  {isWorkerBusy
    ? "⚠ Worker is already working on another task for this date"
    : "✅ Worker is available for this date"}
</p>

<p style={{ fontSize: "14px", marginBottom: "10px" }}>
  {isWorkerBusy
    ? "Worker already has a confirmed job on this date. You can still proceed, but work may be delayed."
    : "You can proceed to confirm and start the work."}
</p>

    {/* 💰 BUDGET */}
    <input
      type="number"
      placeholder="Enter new amount"
      value={budget || ""}
      onChange={(e) => setBudget(e.target.value)}
    />

    {/* 📅 DATE */}
    <input
      type="date"
      value={taskDate}
      min={new Date().toISOString().split("T")[0]}
      onChange={(e) => setTaskDate(e.target.value)}
    />

    <button onClick={handleIncreaseBudget}>
      Update Budget & Date
    </button>

    {/* ✅ CONFIRM BUTTON (MOVED HERE) */}
    <div style={{ marginTop: "10px" }}>
<button 
  onClick={confirmJob}
>
  Confirm Job & Lock Budget
</button>
    </div>

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
  {isWorkerBusy ? "Pay Anyway (Worker Busy)" : "Pay & Start Work"}
</button>
  </div>
)}

  {paymentStatus === "paid" && taskStatus !== "completed" && (
    
  <div className="confirm-job-box worker-box">
    <p>✅ Escrow locked.</p>
    <p>Escrow Amount: ₹{budget}</p>
    <p>Work started.</p>
  </div>
)}
{taskStatus === "completed" && (
  <div className="confirm-job-box worker-box">
    <p>✅ Work Completed</p>
    <p>Final Amount: ₹{budget}</p>
    <p>Chat will be deleted after 30 days</p>
  </div>
)}
     
{connectionStatus !== "closed" && taskStatus !== "completed" && (
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
    
</>

  );
};

export default ChatPage;
