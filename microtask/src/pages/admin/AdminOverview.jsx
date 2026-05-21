import { useEffect, useState } from "react";
import "./AdminOverview.css";

const AdminOverview = () => {

const token = localStorage.getItem("token");

const [stats,setStats] = useState({
workers:0,
providers:0,
tasks:0,
revenue:0
});

const [taskStats,setTaskStats] = useState({
open:0,
inProgress:0,
completed:0,
disputes:0
});

const [alerts,setAlerts] = useState({
pendingInterviews:0,
pendingWorkers:0,
activeDisputes:0
});

/* =========================
   FETCH DASHBOARD DATA
========================= */

useEffect(()=>{

const fetchDashboard = async()=>{

try{

const res = await fetch(
"https://microtask-platform-backend-y3xo.onrender.com/api/admin/dashboard",
{
headers:{
Authorization:`Bearer ${token}`
}
}
);

const data = await res.json();

if(res.ok){

setStats({
workers:data.totalWorkers || 0,
providers:data.totalProviders || 0,
tasks:data.totalTasks || 0,
revenue:data.totalRevenue || 0
});

setTaskStats({
open:data.openTasks || 0,
inProgress:data.inProgressTasks || 0,
completed:data.completedTasks || 0,
disputes:data.disputedTasks || 0
});

setAlerts({
pendingInterviews:data.pendingInterviews || 0,
pendingWorkers:data.pendingWorkers || 0,
activeDisputes:data.activeDisputes || 0
});

}

}catch(err){
console.log("Dashboard fetch failed");
}

};

fetchDashboard();

},[token]);


/* =========================
   UI
========================= */

return (

<div className="adminDashOverviewContainer">

<h2 className="adminDashOverviewTitle">
Platform Overview
</h2>


{/* =====================
   PLATFORM STATS
===================== */}

<div className="adminDashStatsGrid">

<div className="adminDashStatsCard">
<h4 className="adminDashStatsCardTitle">Total Workers</h4>
<p className="adminDashStatsCardValue">{stats.workers}</p>
</div>

<div className="adminDashStatsCard">
<h4 className="adminDashStatsCardTitle">Total Providers</h4>
<p className="adminDashStatsCardValue">{stats.providers}</p>
</div>

<div className="adminDashStatsCard">
<h4 className="adminDashStatsCardTitle">Total Tasks</h4>
<p className="adminDashStatsCardValue">{stats.tasks}</p>
</div>

<div className="adminDashStatsCard">
<h4 className="adminDashStatsCardTitle">Total Revenue</h4>
<p className="adminDashStatsCardValue">₹{stats.revenue}</p>
</div>

</div>


{/* =====================
   TASK SUMMARY
===================== */}

<div className="adminDashSectionBox">

<h3 className="adminDashSectionTitle">
Task Status
</h3>

<div className="adminDashSummaryGrid">

<div className="adminDashSummaryCard">
<span className="adminDashSummaryValue">
{taskStats.open}
</span>
<p className="adminDashSummaryLabel">
Open Tasks
</p>
</div>

<div className="adminDashSummaryCard">
<span className="adminDashSummaryValue">
{taskStats.inProgress}
</span>
<p className="adminDashSummaryLabel">
In Progress
</p>
</div>

<div className="adminDashSummaryCard">
<span className="adminDashSummaryValue">
{taskStats.completed}
</span>
<p className="adminDashSummaryLabel">
Completed
</p>
</div>

<div className="adminDashSummaryCard">
<span className="adminDashSummaryValue adminDashSummaryDispute">
{taskStats.disputes}
</span>
<p className="adminDashSummaryLabel">
Disputes
</p>
</div>

</div>

</div>


{/* =====================
   SYSTEM ALERTS
===================== */}

<div className="adminDashSectionBox">

<h3 className="adminDashSectionTitle">
System Alerts
</h3>

<div className="adminDashAlertGrid">

<div className="adminDashAlertCard">
<span className="adminDashAlertValue">
{alerts.pendingInterviews}
</span>
<p className="adminDashAlertLabel">
Pending Interviews
</p>
</div>

<div className="adminDashAlertCard">
<span className="adminDashAlertValue">
{alerts.pendingWorkers}
</span>
<p className="adminDashAlertLabel">
Worker Approvals
</p>
</div>

<div className="adminDashAlertCard">
<span className="adminDashAlertValue adminDashAlertDanger">
{alerts.activeDisputes}
</span>
<p className="adminDashAlertLabel">
Active Disputes
</p>
</div>

</div>

</div>

</div>

);

};

export default AdminOverview;