'use client';

import Link from 'next/link';

export default function Hero() {
    return (
        <section className="hero">
            <div className="container">
                <div className="hero-content">
                    <span className="hero-badge">Launch Your Online Store Today</span>
                    <h1 className="hero-title">
                        Create Your <span className="text-accent">Beautiful</span> Online Store in Minutes
                    </h1>
                    <p className="hero-subtitle">
                        Shoppicca helps entrepreneurs and small businesses launch professional
                        e-commerce stores with zero technical skills. Get discovered, sell more,
                        and grow your business.
                    </p>
                    <div className="hero-buttons">
                        <Link href="/onboarding" className="btn btn-dark btn-lg">
                            Set Up Your Store
                        </Link>
                        <Link href="#how-it-works" className="btn btn-outline btn-lg">
                            Learn More
                        </Link>
                    </div>
                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-value">500+</span>
                            <span className="stat-label">Active Stores</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">10K+</span>
                            <span className="stat-label">Products Listed</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">50K+</span>
                            <span className="stat-label">Happy Customers</span>
                        </div>
                    </div>
                </div>
                <div className="hero-image">
                    <div className="hero-mockup">
                        <div className="mockup-header">
                            <div className="mockup-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                        <div className="mockup-content">
                            <div className="mockup-store-header">
                                <span className="mockup-store-name">Your Store</span>
                            </div>
                            <div className="mockup-products">
                                <div className="mockup-product"></div>
                                <div className="mockup-product"></div>
                                <div className="mockup-product"></div>
                                <div className="mockup-product"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .hero {
          padding: 6rem 0 4rem;
          background: linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 50%, #F0F7FF 100%);
          overflow: hidden;
        }

        .hero .container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          align-items: center;
        }

        @media (min-width: 1024px) {
          .hero .container {
            grid-template-columns: 1fr 1fr;
          }

          .hero {
            padding: 8rem 0 6rem;
          }
        }

        .hero-content {
          text-align: center;
        }

        @media (min-width: 1024px) {
          .hero-content {
            text-align: left;
          }
        }

        .hero-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(59, 130, 246, 0.1);
          color: var(--color-primary);
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
        }

        .hero-title {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          color: var(--color-text-primary);
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: 3.5rem;
          }
        }

        .text-accent {
          color: var(--color-primary);
        }

        .hero-subtitle {
          font-size: 1.125rem;
          color: var(--color-text-secondary);
          margin-bottom: 2rem;
          max-width: 520px;
        }

        @media (min-width: 1024px) {
          .hero-subtitle {
            margin-left: 0;
          }
        }

        .hero-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 3rem;
        }

        @media (min-width: 640px) {
          .hero-buttons {
            flex-direction: row;
            justify-content: center;
          }
        }

        @media (min-width: 1024px) {
          .hero-buttons {
            justify-content: flex-start;
          }
        }

        .hero-stats {
          display: flex;
          gap: 2rem;
          justify-content: center;
        }

        @media (min-width: 1024px) {
          .hero-stats {
            justify-content: flex-start;
          }
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--color-text-tertiary);
        }

        .hero-image {
          display: none;
        }

        @media (min-width: 1024px) {
          .hero-image {
            display: block;
          }
        }

        .hero-mockup {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          max-width: 450px;
          margin-left: auto;
        }

        .mockup-header {
          background: #F3F4F6;
          padding: 0.75rem 1rem;
        }

        .mockup-dots {
          display: flex;
          gap: 0.5rem;
        }

        .mockup-dots span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #D1D5DB;
        }

        .mockup-dots span:first-child {
          background: #EF4444;
        }

        .mockup-dots span:nth-child(2) {
          background: #F59E0B;
        }

        .mockup-dots span:last-child {
          background: #10B981;
        }

        .mockup-content {
          padding: 1.5rem;
        }

        .mockup-store-header {
          text-align: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--color-border);
          margin-bottom: 1rem;
        }

        .mockup-store-name {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .mockup-products {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .mockup-product {
          aspect-ratio: 1;
          background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
          border-radius: 0.5rem;
        }
      `}</style>
        </section>
    );
}
