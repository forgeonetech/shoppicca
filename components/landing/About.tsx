'use client';

export default function About() {
    return (
        <section className="about" id="about">
            <div className="container">
                <div className="about-content">
                    <span className="about-badge">About Shoppicca</span>
                    <h2 className="about-title">Empowering Entrepreneurs to Sell Online</h2>
                    <p className="about-text">
                        Shoppicca is a modern e-commerce platform designed specifically for small
                        businesses and entrepreneurs in Ghana and across Africa. We believe everyone
                        deserves the opportunity to reach customers online, regardless of technical
                        expertise or budget.
                    </p>
                    <p className="about-text">
                        Our platform provides everything you need to create a professional online store,
                        manage your products, and connect with customers through WhatsApp – the messaging
                        app your customers already love.
                    </p>
                </div>
                <div className="about-features">
                    <div className="feature">
                        <div className="feature-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h3 className="feature-title">No Coding Required</h3>
                        <p className="feature-text">Build your store with our intuitive dashboard. No technical skills needed.</p>
                    </div>
                    <div className="feature">
                        <div className="feature-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                        </div>
                        <h3 className="feature-title">WhatsApp Integration</h3>
                        <p className="feature-text">Connect with customers directly through WhatsApp for seamless communication.</p>
                    </div>
                    <div className="feature">
                        <div className="feature-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="3" y1="9" x2="21" y2="9" />
                                <line x1="9" y1="21" x2="9" y2="9" />
                            </svg>
                        </div>
                        <h3 className="feature-title">Mobile Optimized</h3>
                        <p className="feature-text">Your store looks perfect on any device – desktop, tablet, or mobile.</p>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .about {
          padding: 5rem 0;
          background: white;
        }

        .about .container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
        }

        @media (min-width: 1024px) {
          .about .container {
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
          }
        }

        .about-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(212, 175, 55, 0.1);
          color: var(--color-accent);
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .about-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: var(--color-text-primary);
        }

        @media (min-width: 768px) {
          .about-title {
            font-size: 2.5rem;
          }
        }

        .about-text {
          font-size: 1rem;
          color: var(--color-text-secondary);
          line-height: 1.8;
          margin-bottom: 1rem;
        }

        .about-features {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .feature {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .feature-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.1);
          color: var(--color-primary);
          border-radius: var(--radius-lg);
        }

        .feature-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--color-text-primary);
        }

        .feature-text {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
      `}</style>
        </section>
    );
}
