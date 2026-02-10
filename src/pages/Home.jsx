import "./Home.css";
import logo from "../assets/tasknest.png";
import Home_bg from "../assets/Home-bg.png";
import { useEffect, useState } from "react";


const Home = () => {

const [stats, setStats] = useState({ workers: 0, providers: 0 });

useEffect(() => {
  fetch("http://localhost:5000/api/stats/counts")
    .then(res => res.json())
    .then(data => setStats(data))
    .catch(err => console.error(err));
}, []);


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
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>Get Work Done. Earn with Skills.</h1>
            <p>
              Connecting task providers with verified skilled workers for quick, real-world jobs.
            </p>
            <a href="/register" className="primary-btn">Get Started</a>
          </div>
        </div>
      </section>

      {/* STATS */}
    <section className="stats-section">
      <div className="stat-card">
      <h3 className="gradient-text">{stats.workers}+</h3>
      <p>Active Workers</p>
     </div>

     <div className="stat-card">
       <h3 className="gradient-text">{stats.providers}+</h3>
       <p>Task Providers</p>
      </div>
    </section>


      {/* ABOUT */}
      <section id="about" className="section">
        <div className="section-box">
        <h2>About the Platform</h2>
        <p>
          Many skilled and daily-wage workers face difficulty finding consistent short-term work. Most existing platforms are designed for long-term jobs and do not support quick, location-based tasks.

          TaskNest bridges this gap by connecting task providers with verified workers for short-duration, skill-based tasks.
          Providers can post real-world jobs such as cleaning, repairs, delivery, or maintenance, and workers can earn income by accepting tasks that match their skills, location, and availability.
        </p>
        <p>
          TaskNest addresses this gap by enabling skill-based microtasks that can
          be completed within hours or days, benefiting both workers and task
          providers.
        </p>
         </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section">
        <div className="section-box">
        <h2>Core Features</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Smart Task Matching</h3>
            <p>
              TaskNest connects local workers and service providers by showing tasks based on skills, location, and availability.
              Workers see nearby tasks they can complete within hours or days, while providers quickly find reliable workers.
            </p>
            
          </div>

          <div className="feature-card">
            <h3>Trust & Verification</h3>
            <p>
              All workers are verified and approved by the admin before becoming active.
              Tasks are tracked from posting to completion, ensuring transparency and quality for both workers and providers.
            </p>
          </div>

          <div className="feature-card">
            <h3>Earnings & Payments</h3>
            <p>
              Workers can track completed tasks and earnings, and providers can view task expenses and payments.
              All transactions are clearly recorded to maintain trust and accountability on the platform.
            </p>
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="section">
        <div className="section-box">
        <h2>How TaskNest Works</h2>

        <div className="workflow">
          <div className="step">
            <span>1</span>
            <p>Users register as Workers or Providers and complete basic profile details.
               Workers are reviewed and approved by the admin before becoming active.</p>
          </div>
          <div className="step">
            <span>2</span>
            <p>Providers post a task by entering required skills, location (pin/city), duration, and payment details.</p>
          </div>
          <div className="step">
            <span>3</span>
            <p>The system automatically matches the task with available and approved workers based on:

               Skills

               Location

               Availability window</p>
          </div>
          <div className="step">
            <span>4</span>
            <p>Matched workers are notified, and the provider proceeds with task execution and completion.</p>
          </div>
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
