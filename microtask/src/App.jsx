import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import WorkerDashboard from "./pages/WorkerDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";
import PendingApproval from "./pages/PendingApproval";
import VerifyEmail from "./pages/VerifyEmail";
import MyTasks from "./pages/provider/MyTasks";
import PostTask from "./pages/provider/PostTask";
import TaskWorkers from "./pages/provider/TaskWorkers";
import WorkerProfile from "./pages/WorkerProfile";
import Notifications from "./pages/worker/Notifications";
import ChatPage from "./pages/chat/ChatPage";

 
const App = () => {
  return (
    <>
     <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        
        <Route
  path="/provider/worker/:workerId"
  element={
    <ProtectedRoute allowedRole="provider">
      <WorkerProfile />
    </ProtectedRoute>
  }
/>



        <Route
  path="/worker-dashboard"
  element={
    <ProtectedRoute allowedRole="worker">
      <WorkerDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/provider-dashboard"
  element={
    <ProtectedRoute allowedRole="provider">
      <ProviderDashboard />
    </ProtectedRoute>
  }
  />
  <Route
  path="/provider/post-task"
  element={
    <ProtectedRoute allowedRole="provider">
      <PostTask />
    </ProtectedRoute>
  }
/>


   {/* Admin */}
    <Route
      path="/admin-dashboard"
      element={
        <ProtectedRoute allowedRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      }
/>
<Route
  path="/provider/my-tasks"
  element={<ProtectedRoute><MyTasks /></ProtectedRoute>}
/>

<Route
  path="/provider/task/:taskId/workers"
  element={<ProtectedRoute allowedRole="provider"><TaskWorkers /></ProtectedRoute>}
/>

<Route
  path="/worker/notifications"
  element={
    <ProtectedRoute allowedRole="worker">
      <Notifications />
    </ProtectedRoute>
  }
/>
<Route
  path="/worker/chat/:connectionId"
  element={<ChatPage />}
/>

<Route
  path="/provider/chat/:connectionId"
  element={<ChatPage />}
/>

      </Routes>
      </>
  );
};

export default App;
