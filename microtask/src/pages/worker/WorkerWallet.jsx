import { useEffect, useState } from "react";
import "./WorkerWallet.css";

const WorkerWallet = () => {

  const [wallet, setWallet] = useState({});
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
  }, []);

  const fetchSummary = async () => {

    const res = await fetch(
      "http://localhost:5000/api/wallet/worker-summary",
      {
        headers:{
          Authorization:`Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    const data = await res.json();
    setWallet(data);

  };

  const fetchTransactions = async () => {

    const res = await fetch(
      "http://localhost:5000/api/wallet/my-transactions",
      {
        headers:{
          Authorization:`Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    const data = await res.json();
    setTransactions(data);

  };

  /* -----------------------
     FORMAT TRANSACTION TYPE
  ----------------------- */

  const formatType = (type) => {

    if (type === "task_payment_release") return "Payment Received";
    if (type === "worker_earning") return "Payment Received";
    if (type === "withdrawal") return "Withdrawal";
    if (type === "escrow_payment") return "Escrow Payment";
    if (type === "refund") return "Refund";

    return type;

  };

  /* -----------------------
     WITHDRAW FUNCTION
  ----------------------- */

  const withdrawMoney = async () => {

  const amount = prompt("Enter withdraw amount");

  if (!amount) return;

  const res = await fetch(
    "http://localhost:5000/api/wallet/withdraw",
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ amount })
    }
  );

  const data = await res.json();

  if (res.ok) {

    alert("Withdrawal successful");

    fetchSummary();
    fetchTransactions();

  } else {

    alert(data.message);

  }

};
  return (

    <div className="wallet-container">

      <h2 className="wallet-title">Earnings & Wallet</h2>

      {/* WALLET CARDS */}

      <div className="wallet-cards">

        <div className="wallet-card balance">

          <p>Wallet Balance</p>

          <h3>₹{wallet.walletBalance || 0}</h3>

        </div>

        <div className="wallet-card earnings">

          <p>Total Earnings</p>

          <h3>₹{wallet.totalEarnings || 0}</h3>

        </div>

      </div>

      {/* WITHDRAW BUTTON */}

      <button
        className="withdraw-btn"
        onClick={withdrawMoney}
      >
        Withdraw Money
      </button>

      {/* TRANSACTIONS */}

      <div className="txn-table">

        <div className="txn-head">

          <div>Task</div>
          <div>Type</div>
          <div>Amount</div>
          <div>Date</div>

        </div>

        {transactions.length === 0 ? (

          <div className="no-data">
            No transactions yet
          </div>

        ) : (

          transactions.map(txn => (

            <div key={txn._id} className="txn-row">

              <div>{txn.task?.title || "-"}</div>

              <div className="txn-type">
                {formatType(txn.type)}
              </div>

              <div
                className={
                  txn.type === "withdrawal"
                    ? "txn-amount debit"
                    : "txn-amount credit"
                }
              >
                {txn.type === "withdrawal" ? "-" : "+"}₹{txn.amount}
              </div>

              <div>
                {new Date(txn.createdAt).toLocaleDateString()}
              </div>

            </div>

          ))

        )}

      </div>

    </div>

  );

};

export default WorkerWallet;