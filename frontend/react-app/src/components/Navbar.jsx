import { Link, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../api";

function Navbar() {
  const navigate = useNavigate();
  const loggedIn = Boolean(getToken());

  const handleDashboardClick = (event) => {
    event.preventDefault();
    if (loggedIn) {
      navigate("/dashboard");
      return;
    }
    navigate("/login");
  };

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <header className="nav-wrap">
      <nav className="navbar">
        <Link to="/" className="brand">
          StudyHub Lite
        </Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          {!loggedIn && <Link to="/login">Login</Link>}
          {!loggedIn && <Link to="/signup">Signup</Link>}
          <a href="/dashboard" onClick={handleDashboardClick}>
            Dashboard
          </a>
          {loggedIn && (
            <button type="button" className="ghost-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
