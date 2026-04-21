import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  function handleLogin() {
    login();
    navigate("/today");
  }

  if (isAuthenticated) {
    return <Navigate to="/today" replace />;
  }

  return (
    <main className="centered-card">
      <h1>Login</h1>
      <p>Use the button below to start a session for this MVP shell.</p>
      <button type="button" onClick={handleLogin}>
        Continue to app
      </button>
    </main>
  );
}

