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

   /* Admin */
    <Route
      path="/admin-dashboard"
      element={
        <ProtectedRoute allowedRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      }
/>


      </Routes>
      </>
  );
};

export default App;
