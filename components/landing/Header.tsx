'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0rem', fontFamily: "'Cookie', cursive", fontWeight: 400, fontSize: '2rem', textDecoration: 'none' }}>
            <img 
              src="https://vcipbyfipxlhbzuyrtiq.supabase.co/storage/v1/object/public/shoppica_images/shoppicca_logo.png" 
              alt="Shoppicca Logo" 
              style={{ height: '45px', width: 'auto' }}
            />
            Shoppicca
          </Link>

          <nav className={`nav ${mobileMenuOpen ? 'open' : ''}`}>
            <Link href="#about" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
            <Link href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
            <Link href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          </nav>

          <div className="header-actions">
            <Link href="/auth/login" className="btn btn-secondary">
              Login
            </Link>
            <Link href="/onboarding" className="btn btn-primary">
              Get Started
            </Link>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          <nav>
            <Link href="#about" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
            <Link href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
            <Link href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          </nav>
          <div className="mobile-actions">
            <Link href="/auth/login" className="btn btn-secondary" onClick={() => setMobileMenuOpen(false)}>
              Login
            </Link>
            <Link href="/onboarding" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
              Get Started
            </Link>
          </div>
        </div>
      )}

      <style jsx>{`
        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--color-border-light);
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }

        
        .nav {
          display: none;
        }

        @media (min-width: 1024px) {
          .nav {
            display: flex;
            gap: 2rem;
          }

          .nav :global(a) {
            font-size: 0.9375rem;
            font-weight: 500;
            color: var(--color-text-secondary);
            text-decoration: none;
            transition: color var(--transition-fast);
          }

          .nav :global(a:hover) {
            color: var(--color-primary);
          }
        }

        .header-actions {
          display: none;
        }

        @media (min-width: 1024px) {
          .header-actions {
            display: flex;
            gap: 0.75rem;
          }
        }

        .mobile-menu-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-primary);
        }

        @media (min-width: 1024px) {
          .mobile-menu-btn {
            display: none;
          }
        }

        .mobile-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border-bottom: 1px solid var(--color-border);
          padding: 1.5rem;
          animation: slideDown var(--transition-fast) ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mobile-menu nav {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .mobile-menu nav :global(a) {
          font-size: 1rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          text-decoration: none;
          padding: 0.5rem 0;
        }

        .mobile-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .mobile-actions :global(.btn) {
          width: 100%;
          justify-content: center;
        }
      `}</style>
    </header>
  );
}
