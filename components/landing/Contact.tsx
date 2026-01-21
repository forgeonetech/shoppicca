'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

    const handleChange = (e:any) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSubmit = async (e:any) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus({ type: '', message: '' });

        try {
            // Format the message for SMS
            const smsMessage = `NEW CONTACT FORM SUBMISSION

Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}`;

            // Make API call to your backend endpoint
            const response = await fetch('/api/send-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                    smsMessage: smsMessage
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitStatus({
                    type: 'success',
                    message: 'Thank you! Your message has been sent successfully.'
                });
                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: ''
                });
            } else {
                throw new Error(data.error || 'Failed to send message');
            }
        } catch (error) {
            setSubmitStatus({
                type: 'error',
                message: 'Sorry, there was an error sending your message. Please try again.'
            });
            console.error('Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="contact" id="contact">
            <div className="container">
                <div className="contact-grid">
                    <div className="contact-info">
                        <span className="contact-badge">Get in Touch</span>
                        <h2 className="contact-title">Have Questions? We&apos;re Here to Help</h2>
                        <p className="contact-text">
                            Whether you need help setting up your store or have questions about our
                            plans, our team is ready to assist you.
                        </p>

                        <div className="contact-methods">
                            <div className="contact-method">
                                <div className="method-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </div>
                                <div>
                                  <Link href="mailto:forgeonetech@gmail.com">
                                    <h4 className="method-title">Email Us</h4>
                                    <p className="method-value">forgeonetech@gmail.com</p>
                                  </Link>
                                </div>
                            </div>

                            <div className="contact-method">
                                <div className="method-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                    </svg>
                                </div>
                                <div>
                                  <Link href="https://wa.me/233249497164">
                                    <h4 className="method-title">WhatsApp</h4>
                                    <p className="method-value">+233 24 949 7164</p>
                                  </Link>
                                </div>
                            </div>

                            <div className="contact-method">
                                <div className="method-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12,6 12,12 16,14" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="method-title">Business Hours</h4>
                                    <p className="method-value">Mon - Fri: 8AM - 6PM GMT</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="contact-form-wrapper">
                        <div className="contact-form">
                            <div className="form-group">
                                <label className="label" htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    className="input"
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="label" htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="input"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="label" htmlFor="subject">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    className="input"
                                    placeholder="How can we help?"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="label" htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    className="input textarea"
                                    placeholder="Type your message here..."
                                    rows={4}
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {submitStatus.message && (
                                <div className={`status-message ${submitStatus.type}`}>
                                    {submitStatus.message}
                                </div>
                            )}

                            <button 
                                onClick={handleSubmit}
                                className="btn btn-primary btn-lg submit-btn"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .contact {
          padding: 5rem 0;
          background: var(--color-background-secondary);
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
        }

        @media (min-width: 1024px) {
          .contact-grid {
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
          }
        }

        .contact-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(59, 130, 246, 0.1);
          color: var(--color-primary);
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .contact-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--color-text-primary);
        }

        @media (min-width: 768px) {
          .contact-title {
            font-size: 2.5rem;
          }
        }

        .contact-text {
          font-size: 1rem;
          color: var(--color-text-secondary);
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        .contact-methods {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .contact-method {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .method-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          color: var(--color-primary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .method-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 0.25rem;
        }

        .method-value {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .contact-form-wrapper {
          background: white;
          border-radius: var(--radius-xl);
          padding: 2rem;
          box-shadow: var(--shadow-lg);
        }

        .contact-form {
          display: flex;
          flex-direction: column;
        }

        .textarea {
          resize: vertical;
          min-height: 100px;
        }

        .submit-btn {
          width: 100%;
          margin-top: 0.5rem;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .status-message {
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .status-message.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #6ee7b7;
        }

        .status-message.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }
      `}</style>
        </section>
    );
}