import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);

    // ❌ Wrong role
    if (allowedRole && decoded.role !== allowedRole) {
      return <Navigate to="/login" replace />;
    }

    // 🚫 Worker but NOT approved
    if (
      decoded.role === "worker" &&
      user.approvalStatus !== "approved"
    ) {
      return <Navigate to="/pending-approval" replace />;
    }

    return children;

  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
