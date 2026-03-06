import { useEffect, useState } from "react";
import "./ProviderTransactions.css";

const ProviderTransactions = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/wallet/my-transactions",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();
      console.log("Transactions:", data);
      setTransactions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="txn-container">

      <div className="txn-top">
        <h2>Transaction History</h2>
        <button className="download-btn">
          Download Statement
        </button>
      </div>

      <div className="wallet-summary">
        <div>
          <p className="label">Total Transactions</p>
          <h3>{transactions.length}</h3>
        </div>
      </div>

      <div className="txn-table">
        <div className="txn-head">
          <div>Task</div>
          <div>Type</div>
          <div>Amount</div>
          <div>Date</div>
          <div>Details</div>
        </div>

        {transactions.length === 0 ? (
          <div className="no-data">
            No transactions found
          </div>
        ) : (
          transactions.map((txn) => (
            <div key={txn._id} className="txn-row">
              <div>{txn.task?.title || "-"}</div>

              <div className={`txn-type ${txn.type}`}>
                {txn.type.replace("_", " ")}
              </div>

              <div className="txn-amount">
                ₹{txn.amount}
              </div>

              <div>{formatDate(txn.createdAt)}</div>

              <div className="txn-desc">
                {txn.description}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProviderTransactions;