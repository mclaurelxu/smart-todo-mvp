import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";

export function AppLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div>
          <h1>Smart To-Do MVP</h1>
          <p className="user-meta">{user ? `Signed in as ${user.displayName}` : null}</p>
        </div>
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

