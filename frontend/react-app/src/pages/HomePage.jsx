import { useNavigate } from "react-router-dom";
import { getToken } from "../api";

function HomePage() {
  const navigate = useNavigate();

  const goToStarted = () => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    navigate("/dashboard");
  };

  return (
    <main className="hero-page">
      <section className="hero">
        <p className="hero-tag">Student Productivity, Simplified</p>
        <h1>Organize your study life with StudyHub Lite</h1>
        <p>
          Keep your tasks clear, your notes handy, and your goals on track with a clean dashboard
          built for students.
        </p>
        <div className="hero-actions">
          <button type="button" className="primary-btn" onClick={goToStarted}>
            Get Started
          </button>
          <button type="button" className="secondary-btn" onClick={() => navigate("/signup")}>
            Create Free Account
          </button>
        </div>
      </section>
      <section className="feature-grid">
        <article className="feature-card">
          <h3>Track Tasks</h3>
          <p>Create, complete, and manage tasks daily with a simple workflow.</p>
        </article>
        <article className="feature-card">
          <h3>Secure Login</h3>
          <p>JWT-based authentication keeps student data private.</p>
        </article>
        <article className="feature-card">
          <h3>Focus Better</h3>
          <p>Minimal UI helps you concentrate on what matters most.</p>
        </article>
      </section>
    </main>
  );
}

export default HomePage;
