import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";

export function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <h1>Smart To-Do MVP</h1>
        <nav aria-label="Primary navigation">
          <Link to="/today">Today</Link>
          <Link to="/tasks">All Tasks</Link>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}

