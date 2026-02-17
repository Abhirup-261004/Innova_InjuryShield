import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const userInfo = localStorage.getItem("userInfo");

  if (!userInfo) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;
