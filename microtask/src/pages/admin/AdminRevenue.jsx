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
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    const data = await res.json();
    setSummary(data);

  };

  const fetchMonthly = async () => {

    const res = await fetch(
      "http://localhost:5000/api/admin/revenue/monthly",
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
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
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    const data = await res.json();
    setTransactions(data);

  };

  return (

    <div className="revenue-container">

      <h2>Revenue Analytics</h2>

      <div className="revenue-cards">

        <div className="rev-card">
          <p>Total Revenue</p>
          <h3>₹{summary.totalRevenue || 0}</h3>
        </div>

        <div className="rev-card">
          <p>Total Tasks</p>
          <h3>{summary.totalTasks || 0}</h3>
        </div>

        <div className="rev-card">
          <p>Total Payments</p>
          <h3>₹{summary.totalPayments || 0}</h3>
        </div>

      </div>


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


      <div className="revenue-table">

        <h3>Revenue Transactions</h3>

        <div className="txn-head">

          <div>Task</div>
          <div>Provider</div>
          <div>Worker</div>
          <div>Commission</div>
          <div>Date</div>

        </div>

        {transactions.map(txn => (

          <div key={txn._id} className="txn-row">

            <div>{txn.task?.title}</div>
            <div>{txn.user?.name}</div>
            <div>{txn.relatedUser?.name}</div>
            <div>₹{txn.amount}</div>
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