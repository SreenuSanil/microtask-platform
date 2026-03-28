import React, { useState } from "react";
import "./Payment.css";

const Payment = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        "http://localhost:5000/api/payment/create-order",
        { method: "POST" }
      );

      const order = await res.json();

      const options = {
        key: "rzp_test_RS7N4gK5yMwA9E",
        amount: order.amount,
        currency: "INR",
        name: "TaskNest",
        description: "Worker Registration Fee",
        order_id: order.id,
handler: async function (response) {

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Session expired. Please login again.");
    window.location.href = "/login";
    return;
  }

  const verifyRes = await fetch(
    "http://localhost:5000/api/payment/verify-payment",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(response),
    }
  );

  const data = await verifyRes.json();

  if (data.success) {
    setSuccess(true);

    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  } else {
    alert("Payment failed");
  }
}
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      setLoading(false);
    } catch (err) {
      setLoading(false);
      alert("Payment error");
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-card">

        {/* ICON */}
        <div className="payment-icon">💳</div>

        {/* TITLE */}
        <h2>Complete Your Registration</h2>
        <p>Pay ₹99 to complete your registration</p>
        {/* BUTTON */}
        <button
          className="payment-btn"
          onClick={handlePayment}
          disabled={loading}
        >
          {loading ? "Processing..." : "Pay Registration Fee"}
        </button>

        {/* SECURITY */}
        <div className="payment-security">
          🔒 Secure payment powered by Razorpay
        </div>

        {/* SUCCESS */}
        {success && (
          <div className="payment-success">
            ✅ Payment Successful!
          </div>
        )}

      </div>
    </div>
  );
};

export default Payment;