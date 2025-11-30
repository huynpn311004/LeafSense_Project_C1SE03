import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import heroImage from '../../assets/cay-cafe-2.jpg';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="logo">
          <span role="img" aria-label="leaf">🍃</span> LeafSense
        </div>
        <div className="auth-buttons">
          <Link to="/login" className="btn btn-login">Login</Link>
          <Link to="/signup" className="btn btn-register">Sign Up</Link>
        </div>
      </header>

      <section 
        className="hero-section"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${heroImage})`
        }}
      >
        <div className="hero-content">
          <h1> Coffee Leaf Disease Detection System</h1>
          <p>
            LeafSense uses artificial intelligence to detect diseases on coffee plants, 
            connect the community, and provide the best care solutions for your coffee garden.
          </p>
          <Link to="/signup" className="cta-button">Get Started</Link>
        </div>
      </section>

      <section className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Coffee Disease Detection</h3>
            <p>Take a photo of coffee leaves and get instant disease diagnosis with high accuracy using AI technology.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛒</div>
            <h3>Agricultural Supplies</h3>
            <p>Shop for specialized products for coffee plants, fertilizers, and quality plant protection products.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Coffee Community</h3>
            <p>Connect, share experiences, and learn from other farmers and coffee experts.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>Expert AI Assistant</h3>
            <p>Get answers to all questions about cultivation techniques and disease treatment for coffee plants 24/7.</p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>About LeafSense Project</h2>
        <p>
          LeafSense is a scientific research project aiming to bring high-tech solutions to agriculture and coffee farmers. 
          We are committed to accompanying you to create high-yield and sustainable coffee gardens.
        </p>
      </section>

      <footer className="footer">
        <p>&copy; 2025 LeafSense Project. All rights reserved.</p>
        <p>Contact Support: leafsensehotro@gmail.com</p>
      </footer>
    </div>
  );
};

export default LandingPage;
