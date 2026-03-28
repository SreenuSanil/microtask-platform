import { useEffect, useState } from "react";
import "./AdminRevenue.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

const AdminRevenue = () => {

  const [summary, setSummary] = useState({});
  const [monthly, setMonthly] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSummary();
    fetchMonthly();
    fetchTransactions();
  }, []);

  const fetchSummary = async () => {
    const res = await fetch(
      "http://localhost:5000/api/admin/revenue/summary",
      {
        headers:{ Authorization:`Bearer ${token}` }
      }
    );

    const data = await res.json();
    setSummary(data);
  };

  const fetchMonthly = async () => {
    const res = await fetch(
      "http://localhost:5000/api/admin/revenue/monthly",
      {
        headers:{ Authorization:`Bearer ${token}` }
      }
    );

    const data = await res.json();

    const formatted = data.map(item => ({
      month: `M${item._id.month}`,
      revenue: item.total
    }));

    setMonthly(formatted);
  };

  const fetchTransactions = async () => {
    const res = await fetch(
      "http://localhost:5000/api/admin/revenue/transactions",
      {
        headers:{ Authorization:`Bearer ${token}` }
      }
    );

    const data = await res.json();
    setTransactions(data);
  };
  const withdrawMoney = async () => {

  const amount = prompt("Enter withdraw amount");

  if (!amount) return;

  const res = await fetch(
    "http://localhost:5000/api/admin/revenue/withdraw",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    }
  );

  const data = await res.json();

  if (res.ok) {
    alert("Withdraw successful");
    fetchSummary();
    fetchTransactions();
  } else {
    alert(data.message);
  }
};

  // ✅ LABEL FIX
  const getTitle = (txn) => {
    if (txn.type === "registration_fee") {
      return "Worker Registration";
    }
    return txn.task?.title || "-";
  };

  const getType = (txn) => {
    if (txn.type === "registration_fee") return "Registration Fee";
    if (txn.type === "commission") return "Commission";
    if (txn.type === "withdrawal") return "Withdrawal";
    return txn.type;
  };

  return (

    <div className="revenue-container">

      <h2>Revenue Analytics</h2>

      {/* ================= CARDS ================= */}

<div className="revenue-cards">

  <div className="rev-card total">
    <p>Total Revenue</p>
    <h3>₹{summary.totalRevenue || 0}</h3>
  </div>

  <div className="rev-card commission">
    <p>Commission Revenue</p>
    <h3>₹{summary.commissionRevenue || 0}</h3>
  </div>

  <div className="rev-card registration">
    <p>Registration Revenue</p>
    <h3>₹{summary.registrationRevenue || 0}</h3>
  </div>

  <div className="rev-card withdraw">
    <p>Withdrawn</p>
    <h3>₹{summary.withdrawals || 0}</h3>
  </div>

  <div className="rev-card balance">
    <p>Wallet Balance</p>
    <h3>₹{summary.walletBalance || 0}</h3>
  </div>

</div>

      {/* ================= CHART ================= */}

      <div className="revenue-chart">

        <h3>Monthly Revenue</h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#0e8f6a"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>

      </div>

      {/* ================= TABLE ================= */}

      <div className="revenue-table">

        <h3>Revenue Transactions</h3>

        <div className="txn-top">
  <h2>Revenue Analytics</h2>

  <button className="withdraw-btn" onClick={withdrawMoney}>
    Withdraw Money
  </button>
</div>

        <div className="txn-head">
          <div>Source</div>
          <div>Provider</div>
          <div>Worker</div>
          <div>Amount</div>
          <div>Date</div>
        </div>

        {transactions.map(txn => (

          <div key={txn._id} className="txn-row">

            <div>{getTitle(txn)}</div>

            <div>{txn.user?.name || "-"}</div>

            <div>{txn.relatedUser?.name || "-"}</div>

            <div className={
              txn.type === "withdrawal"
                ? "amount debit"
                : "amount credit"
            }>
              {txn.type === "withdrawal" ? "-" : "+"}₹{txn.amount}
            </div>

            <div>
              {new Date(txn.createdAt).toLocaleDateString()}
            </div>

          </div>

        ))}

      </div>

    </div>
  );
};

export default AdminRevenue;