'use client';

import { useState } from 'react';

interface FAQItem {
    question: string;
    answer: string;
}

const faqData: FAQItem[] = [
    {
        question: 'How much does it cost to create a store?',
        answer: 'We offer a free plan that lets you get started with up to 3 categories and 5 products per category. Our paid plan at GHC 50/month gives you unlimited categories, unlimited products, custom themes, and the ability to change your store URL.',
    },
    {
        question: 'Do I need technical skills to use Shoppicca?',
        answer: 'Not at all! Shoppicca is designed for everyone. Our intuitive dashboard makes it easy to add products, manage orders, and customize your store without any coding knowledge.',
    },
    {
        question: 'How do payments work?',
        answer: 'Shoppicca connects you with customers through WhatsApp. When a customer is interested in your products, they can send you a message directly. You handle payments through mobile money, bank transfer, or cash on delivery – whatever works best for your business.',
    },
    {
        question: 'Can I customize the look of my store?',
        answer: 'Yes! Free plan users get a beautiful default theme. Paid plan subscribers can customize their theme colors, accent colors, and add their own banner images to match their brand identity.',
    },
    {
        question: 'What happens if I want to cancel my subscription?',
        answer: 'You can cancel your paid subscription anytime. Your store will revert to the free plan limits, but your products and data will be preserved. You can upgrade again whenever you want.',
    },
    {
        question: 'Can I use my own domain name?',
        answer: 'Currently, all stores are hosted on Shoppicca subdomains (yourstore.shoppicca.com). We\'re working on custom domain support for a future update.',
    },
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="faq" id="faq">
            <div className="container">
                <div className="section-header">
                    <span className="section-badge">FAQ</span>
                    <h2 className="section-title">Frequently Asked Questions</h2>
                    <p className="section-subtitle">
                        Got questions? We&apos;ve got answers. If you can&apos;t find what you&apos;re looking for,
                        feel free to contact us.
                    </p>
                </div>

                <div className="faq-list">
                    {faqData.map((item, index) => (
                        <div
                            key={index}
                            className={`faq-item ${openIndex === index ? 'open' : ''}`}
                        >
                            <button
                                className="faq-question"
                                onClick={() => toggleFAQ(index)}
                                aria-expanded={openIndex === index}
                            >
                                <span>{item.question}</span>
                                <svg
                                    className="faq-icon"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="6,9 12,15 18,9" />
                                </svg>
                            </button>
                            <div className="faq-answer">
                                <p>{item.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
        .faq {
          padding: 5rem 0;
          background: white;
        }

        .section-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .section-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(212, 175, 55, 0.1);
          color: var(--color-accent);
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

        .faq-list {
          max-width: 800px;
          margin: 0 auto;
        }

        .faq-item {
          border-bottom: 1px solid var(--color-border);
        }

        .faq-question {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem 0;
          background: none;
          border: none;
          text-align: left;
          font-size: 1rem;
          font-weight: 500;
          color: var(--color-text-primary);
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .faq-question:hover {
          color: var(--color-primary);
        }

        .faq-icon {
          flex-shrink: 0;
          transition: transform var(--transition-normal);
          color: var(--color-text-tertiary);
        }

        .faq-item.open .faq-icon {
          transform: rotate(180deg);
        }

        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height var(--transition-normal), padding var(--transition-normal);
        }

        .faq-item.open .faq-answer {
          max-height: 300px;
          padding-bottom: 1.5rem;
        }

        .faq-answer p {
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          line-height: 1.7;
        }
      `}</style>
        </section>
    );
}
