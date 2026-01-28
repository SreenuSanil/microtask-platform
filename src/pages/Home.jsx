import "./Home.css";
import logo from "../assets/tasknest.png";
import Home_bg from "../assets/Home-bg.png";

const Home = () => {
  return (
    <div className="home-root">

      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo-area">
          <img src={logo} alt="TaskNest Logo" />
        </div>

        <nav className="nav-links">
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#workflow">How It Works</a>

          <a href="/login" className="login-btn">Login</a>
          <a href="/register" className="signup-btn">Sign Up</a>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <img
            src={Home_bg}
            alt=""
          />
        </div>

        <div className="hero-overlay">
          <div className="hero-content">
            <h1>Turn Your Skills Into Flexible Income</h1>
            <p>
              Connecting individuals seeking flexible income with short-duration,
              skill-based tasks through intelligent task matching and structured
              work management.
            </p>
            <a href="/register" className="primary-btn">Get Started</a>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section">
        <h2>About the Platform</h2>
        <p>
          Unemployment and underemployment remain major challenges for students,
          homemakers, and individuals seeking flexible or part-time income.
          Existing job portals primarily focus on full-time employment and often
          require prior experience.
        </p>
        <p>
          TaskNest addresses this gap by enabling skill-based microtasks that can
          be completed within hours or days, benefiting both workers and task
          providers.
        </p>
      </section>

      {/* FEATURES */}
      <section id="features" className="section light-bg">
        <h2>Core Features</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>AI-Based Task Matching</h3>
            <p>
              Rule-based intelligence matches tasks with users based on skills,
              availability, and performance history.
            </p>
          </div>

          <div className="feature-card">
            <h3>Trust & Reputation System</h3>
            <p>
              Ratings, feedback, and task verification ensure platform reliability
              and quality work.
            </p>
          </div>

          <div className="feature-card">
            <h3>Digital Wallet</h3>
            <p>
              Transparent tracking of earnings, transactions, and platform
              commissions for all users.
            </p>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="section">
        <h2>How It Works</h2>

        <div className="workflow">
          <div className="step">
            <span>1</span>
            <p>User registers and defines skills and availability</p>
          </div>
          <div className="step">
            <span>2</span>
            <p>Task providers post short-duration tasks</p>
          </div>
          <div className="step">
            <span>3</span>
            <p>System recommends tasks using intelligent matching</p>
          </div>
          <div className="step">
            <span>4</span>
            <p>Task completion, verification, and earnings credit</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2026 TaskNest. All Rights Reserved.</p>
      </footer>

    </div>
  );
};

export default Home;
