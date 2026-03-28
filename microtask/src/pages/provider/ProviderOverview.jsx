import { useEffect, useState } from "react";
import "./ProviderOverview.css";

const ProviderOverview = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/provider-stats/overview",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    }
  };

  if (!data) return <div>Loading...</div>;

const getActivityLabel = (item) => {

  if (item.task?.status === "completed" && item.type === "escrow_payment") {

    const commissionTxn = data.recentActivity.find(
      (t) => t.task?._id === item.task?._id && t.type === "commission"
    );

    const commission = commissionTxn?.amount || 0;

    return `Paid to worker (₹${commission} fee)`;
  }

  if (item.task?.status === "cancelled") {
    return "Refunded";
  }

  if (item.type === "escrow_payment") {
    return "Escrow locked";
  }

  return item.type.replace("_", " ");
};

const getFinalAmount = (item) => {

  if (item.task?.status === "completed" && item.type === "escrow_payment") {

    const commissionTxn = data.recentActivity.find(
      (t) => t.task?._id === item.task?._id && t.type === "commission"
    );

    const commission = commissionTxn?.amount || 0;

    return item.amount - commission;
  }

  return item.amount;
};

  return (
    <div className="provider-overview-container">

      {/* MAIN STATS */}
      <div className="provider-stats">
        <div className="provider-card">
          <span>Total Tasks Posted</span>
          <h3>{data.totalTasks}</h3>
        </div>

        <div className="provider-card">
          <span>Active Tasks</span>
          <h3>{data.activeTasks}</h3>
        </div>

        <div className="provider-card">
          <span>Completed Tasks</span>
          <h3>{data.completedTasks}</h3>
        </div>

        <div className="provider-card">
          <span>Total Spent</span>
          <h3>₹{data.totalSpent}</h3>
        </div>
      </div>

      {/* FINANCIAL SNAPSHOT */}
      <div className="provider-financial">
        <h2>Financial Snapshot</h2>

        <div className="financial-grid">
          <div className="financial-box">
            <span>Escrow Locked</span>
            <h4>₹{data.escrowLocked}</h4>
          </div>

          <div className="financial-box">
            <span>Refunds</span>
            <h4>₹{data.refunds}</h4>
          </div>

          <div className="financial-box">
            <span>Platform Fees Paid</span>
            <h4>₹{data.commission}</h4>
          </div>
        </div>
      </div>

{/* RECENT ACTIVITY */}
<div className="provider-activity">
  <h2>Recent Activity</h2>

  <div className="activity-box">
    {data.recentActivity.length === 0 ? (
      <p>No recent activity.</p>
    ) : (
      data.recentActivity.map((item) => (
       <p key={item._id}>
  {getActivityLabel(item)} – ₹{getFinalAmount(item)} (
  {item.task?.title || "Task"})
</p>
      ))
    )}
  </div>
</div>

    </div>
  );
};

export default ProviderOverview;