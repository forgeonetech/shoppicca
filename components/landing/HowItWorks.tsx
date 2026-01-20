'use client';

export default function HowItWorks() {
    const steps = [
        {
            number: '01',
            title: 'Create Your Account',
            description: 'Sign up with your email and basic information. It takes less than a minute to get started.',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
        {
            number: '02',
            title: 'Set Up Your Store',
            description: 'Choose your store name, add your logo, and customize your theme colors to match your brand.',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
            ),
        },
        {
            number: '03',
            title: 'Add Your Products',
            description: 'Upload product images, set prices, and organize items into categories for easy browsing.',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
            ),
        },
        {
            number: '04',
            title: 'Start Selling',
            description: 'Share your store link and start receiving orders via WhatsApp. It\'s that simple!',
            icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,12 20,22 4,22 4,12" />
                    <rect x="2" y="7" width="20" height="5" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </svg>
            ),
        },
    ];

    return (
        <section className="how-it-works" id="how-it-works">
            <div className="container">
                <div className="section-header">
                    <span className="section-badge">Simple Process</span>
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-subtitle">
                        Get your online store up and running in just four simple steps
                    </p>
                </div>

                <div className="steps-grid">
                    {steps.map((step, index) => (
                        <div key={step.number} className="step-card">
                            <div className="step-number">{step.number}</div>
                            <div className="step-icon">{step.icon}</div>
                            <h3 className="step-title">{step.title}</h3>
                            <p className="step-description">{step.description}</p>
                            {index < steps.length - 1 && (
                                <div className="step-connector">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
        .how-it-works {
          padding: 5rem 0;
          background: var(--color-background-secondary);
        }

        .section-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .section-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(59, 130, 246, 0.1);
          color: var(--color-primary);
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .section-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--color-text-primary);
        }

        @media (min-width: 768px) {
          .section-title {
            font-size: 2.5rem;
          }
        }

        .section-subtitle {
          font-size: 1.125rem;
          color: var(--color-text-secondary);
          max-width: 500px;
          margin: 0 auto;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .steps-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .steps-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .step-card {
          position: relative;
          background: white;
          padding: 2rem;
          border-radius: var(--radius-xl);
          text-align: center;
          box-shadow: var(--shadow-md);
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
        }

        .step-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .step-number {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-primary);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .step-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.1);
          color: var(--color-primary);
          border-radius: 50%;
          margin: 0 auto 1.5rem;
        }

        .step-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--color-text-primary);
        }

        .step-description {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }

        .step-connector {
          display: none;
        }

        @media (min-width: 1024px) {
          .step-connector {
            display: block;
            position: absolute;
            right: -28px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--color-border);
          }
        }
      `}</style>
        </section>
    );
}
