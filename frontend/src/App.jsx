import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/Register";
import Dashboard from "./pages/dashboard";
import ForgotPassword from "./pages/forgot_password";
import ResetPassword from "./pages/reset_password";

function PrivateRoute({ children }) {
  const user = localStorage.getItem("user");
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/forgot-password" 
        element={<ForgotPassword />} 
      />
      <Route 
        path="/forgot_password" 
        element={<ForgotPassword />} 
      />

      <Route 
        path="/reset-password/:token" 
        element={<ResetPassword />} 
      />
      <Route 
        path="/reset_password/:token" 
        element={<ResetPassword />} 
      />

      <Route 
        path="/dashboard" 
        element={<PrivateRoute><Dashboard /></PrivateRoute>} 
      />
    </Routes>
  );
}
