import './landing.css'

export default function About() {
  return (
    <section id="about" className="section about-section premium-about-section">
      <div className="container about-grid premium-about-grid">
        <div className="about-left reveal-up">
          <span className="section-badge">About AgroMitra</span>
          <h2>A smarter digital bridge between farmers and buyers</h2>
          <p>
            AgroMitra is a modern agricultural marketplace designed to make
            buying and selling more transparent, efficient, and accessible.
          </p>
          <p>
            We help farmers showcase products directly to buyers while giving
            customers a clean, premium, and trustworthy shopping experience.
          </p>

          <div className="about-points">
            <div className="about-point">
              <span>✔</span>
              <p>Fair pricing with direct marketplace access</p>
            </div>
            <div className="about-point">
              <span>✔</span>
              <p>Modern product discovery and cleaner buying flow</p>
            </div>
            <div className="about-point">
              <span>✔</span>
              <p>Built for real agricultural commerce growth</p>
            </div>
          </div>
        </div>

        <div className="about-right reveal-up reveal-delay-2">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&q=80"
            alt="AgroMitra farming"
            className="about-image"
          />

          <div className="about-card premium-about-card">
            <strong>100%</strong>
            <span>Farmer-focused experience</span>
          </div>
        </div>
      </div>
    </section>
  )
} 

// test change