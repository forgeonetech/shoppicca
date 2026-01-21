'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            // Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        phone: phone,
                    },
                },
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            if (authData.user) {
                // Create user record in users table
                const { error: userError } = await supabase.from('users').insert({
                    id: authData.user.id,
                    full_name: fullName,
                    phone: phone,
                    email: email,
                });

                if (userError) {
                    console.error('Error creating user:', userError);
                }

                // Redirect to onboarding to create store
                router.push('/onboarding?step=store');
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <Link href="/" className="auth-logo" style={{ fontFamily: "'Cookie', cursive", fontWeight: 400, fontSize: '2rem', textDecoration: 'none' }}>Shoppicca</Link>
                        <h1 className="auth-title">Create Your Account</h1>
                        <p className="auth-subtitle">Start your e-commerce journey today</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && (
                            <div className="error-message">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="label" htmlFor="fullName">Full Name</label>
                            <input
                                type="text"
                                id="fullName"
                                className="input"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="label" htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="label" htmlFor="phone">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                className="input"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+233 XX XXX XXXX"
                            />
                        </div>

                        <div className="form-group">
                            <label className="label" htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="label" htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className="input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link href="/auth/login">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 50%, #F0F7FF 100%);
          padding: 2rem 1rem;
        }

        .auth-container {
          width: 100%;
          max-width: 420px;
        }

        .auth-card {
          background: white;
          border-radius: var(--radius-xl);
          padding: 2.5rem;
          box-shadow: var(--shadow-xl);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-logo {
          font-family: var(--font-title);
          font-size: 1.75rem;
          font-weight: 400;
          color: var(--color-text-primary);
          text-decoration: none;
          display: block;
          margin-bottom: 1.5rem;
        }

        .auth-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 0.5rem;
        }

        .auth-subtitle {
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-error);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .submit-btn {
          width: 100%;
          margin-top: 0.5rem;
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--color-border);
        }

        .auth-footer p {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .auth-footer :global(a) {
          color: var(--color-primary);
          font-weight: 500;
          text-decoration: none;
        }

        .auth-footer :global(a:hover) {
          text-decoration: underline;
        }
      `}</style>
        </div>
    );
}
