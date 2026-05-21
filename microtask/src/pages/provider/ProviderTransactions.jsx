import { useEffect, useState } from "react";
import "./ProviderTransactions.css";

const ProviderTransactions = () => {

  const [transactions, setTransactions] = useState([]);
  const [wallet, setWallet] = useState({});
  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, []);

  const fetchTransactions = async () => {

    try {

      const res = await fetch(
        "https://microtask-platform-backend-y3xo.onrender.com/api/wallet/my-transactions",
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

  /* ===========================
     TRANSACTION TYPE LOGIC
  =========================== */

const getTypeLabel = (txn) => {

  if (txn.type === "withdrawal") return "withdrawal";

  if (txn.task?.status === "completed") {
    return "completed";
  }

  if (txn.task?.status === "cancelled") {
    return "refund";
  }

  return txn.type;

};

const getDescription = (txn) => {

  if (txn.task?.status === "completed" && txn.type === "escrow_payment") {

    const commissionTxn = transactions.find(
      (t) => t.task?._id === txn.task?._id && t.type === "commission"
    );

    const commission = commissionTxn?.amount || 0;

    return `Paid to worker (₹${commission} platform fee deducted)`;
  }

  if (txn.task?.status === "cancelled") {
    return "Task cancelled — amount refunded";
  }

  if (txn.type === "withdrawal") {
  return "Money withdrawn from wallet";
}

  if (txn.type === "escrow_payment") {
    return "Escrow payment locked for task";
  }

  return txn.description;
};

const getFinalAmount = (txn) => {

  // withdrawal → direct amount
  if (txn.type === "withdrawal") {
    return txn.amount;
  }

  // completed task → minus commission
  if (txn.task?.status === "completed" && txn.type === "escrow_payment") {

    const commissionTxn = transactions.find(
      (t) => t.task?._id === txn.task?._id && t.type === "commission"
    );

    const commission = commissionTxn?.amount || 0;

    return txn.amount - commission;
  }

  return txn.amount;
};

const withdrawMoney = async () => {

  const amount = prompt("Enter withdraw amount");

  if (!amount) return;

  const res = await fetch(
    "https://microtask-platform-backend-y3xo.onrender.com/api/wallet/withdraw",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ amount })
    }
  );

  const data = await res.json();

  if (res.ok) {
    alert("Withdrawal successful");
    fetchTransactions();
  } else {
    alert(data.message);
  }
};
const fetchSummary = async () => {

  const res = await fetch(
    "https://microtask-platform-backend-y3xo.onrender.com/api/wallet/provider-summary",
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }
  );

  const data = await res.json();
  setWallet(data);

};

  return (

    <div className="txn-container">

<div className="txn-top">

  <h2>Transaction History</h2>

  <div className="txn-actions">
    <button className="withdraw-btn" onClick={withdrawMoney}>
      Withdraw Money
    </button>
  </div>

</div>
<div className="wallet-cards">

  <div className="wallet-card balance">
    <p>Wallet Balance</p>
    <h3>₹{wallet.walletBalance || 0}</h3>
  </div>

</div>

      <div className="wallet-summary">

        <div>

          <p className="label">Total Transactions</p>

          <h3>
 {transactions.filter((txn) => txn.type !== "commission").length}
</h3>

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

          transactions
  .filter((txn) => txn.type !== "commission")
  .map((txn) => (

            <div key={txn._id} className="txn-row">

              <div>
                {txn.task?.title || "-"}
              </div>

              <div className={`txn-type ${getTypeLabel(txn)}`}>
                {getTypeLabel(txn).replace("_", " ")}
              </div>

<div
  className={
    txn.type === "withdrawal"
      ? "txn-amount debit"
      : "txn-amount credit"
  }
>
  {txn.type === "withdrawal" ? "-" : "+"}
  ₹{getFinalAmount(txn)}
</div>

              <div>
                {formatDate(txn.createdAt)}
              </div>

              <div className="txn-desc">
                {getDescription(txn)}
              </div>

            </div>

          ))

        )}

      </div>

    </div>

  );

};

export default ProviderTransactions;