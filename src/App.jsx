import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import WorkerDashboard from "./pages/WorkerDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <>
     <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
