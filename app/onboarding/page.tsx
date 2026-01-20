'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { generateSlug, isValidSlug, isValidWhatsAppNumber } from '@/lib/utils';
import type { Plan } from '@/lib/types/database';

type Step = 'account' | 'store' | 'plan' | 'complete';

const OnboardingContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Check if coming from signup
    const initialStep = (searchParams.get('step') as Step) || 'account';
    const [currentStep, setCurrentStep] = useState<Step>(initialStep);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    // Account form
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    // Store form
    const [storeName, setStoreName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [storeCategory, setStoreCategory] = useState('');
    const [description, setDescription] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [snapchatUrl, setSnapchatUrl] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');

    // Plan selection
    const [selectedPlanId, setSelectedPlanId] = useState('');

    useEffect(() => {
        // Check if user is already logged in
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                // Check if user already has a store
                const { data: store } = await supabase
                    .from('stores')
                    .select('slug')
                    .eq('owner_id', user.id)
                    .single();

                if (store) {
                    router.push('/admin');
                    return;
                }

                if (currentStep === 'account') {
                    setCurrentStep('store');
                }
            }
        };
        checkUser();
    }, [supabase, router, currentStep]);

    useEffect(() => {
        // Fetch plans
        const fetchPlans = async () => {
            const { data } = await supabase.from('plans').select('*').order('price_cedis');
            if (data) {
                setPlans(data);
                if (data.length > 0) {
                    setSelectedPlanId(data[0].id);
                }
            }
        };
        fetchPlans();
    }, [supabase]);

    // Auto-generate slug from store name
    useEffect(() => {
        if (storeName) {
            const generatedSlug = generateSlug(storeName);
            setSlug(generatedSlug);
        }
    }, [storeName]);

    // Check slug availability
    useEffect(() => {
        const checkSlug = async () => {
            if (!slug || !isValidSlug(slug)) {
                setSlugAvailable(null);
                return;
            }

            const { data } = await supabase
                .from('stores')
                .select('id')
                .eq('slug', slug)
                .single();

            setSlugAvailable(!data);
        };

        const debounce = setTimeout(checkSlug, 500);
        return () => clearTimeout(debounce);
    }, [slug, supabase]);

    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName, phone },
                },
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            if (authData.user) {
                await supabase.from('users').insert({
                    id: authData.user.id,
                    full_name: fullName,
                    phone,
                    email,
                });
                setUserId(authData.user.id);
                setCurrentStep('store');
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleStoreSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isValidSlug(slug)) {
            setError('Please enter a valid store URL (letters, numbers, hyphens only)');
            return;
        }

        if (!slugAvailable) {
            setError('This store URL is already taken');
            return;
        }

        if (!isValidWhatsAppNumber(whatsappNumber)) {
            setError('Please enter a valid WhatsApp number with country code');
            return;
        }

        setCurrentStep('plan');
    };

    const handlePlanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const selectedPlan = plans.find(p => p.id === selectedPlanId);

        if (!selectedPlan) {
            setError('Please select a plan');
            setLoading(false);
            return;
        }

        try {
            // For paid plan, redirect to Paystack
            if (selectedPlan.name === 'paid') {
                // Initialize payment
                const response = await fetch('/api/subscription/pay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        planId: selectedPlanId,
                        storeName,
                        slug,
                        storeCategory,
                        description,
                        whatsappNumber,
                        instagramUrl,
                        snapchatUrl,
                        linkedinUrl,
                    }),
                });

                const data = await response.json();

                if (data.authorization_url) {
                    window.location.href = data.authorization_url;
                    return;
                } else {
                    setError(data.error || 'Failed to initialize payment');
                }
            } else {
                // Free plan - create store directly
                const response = await fetch('/api/store/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: storeName,
                        slug,
                        category: storeCategory,
                        description,
                        whatsapp_number: whatsappNumber,
                        instagram_url: instagramUrl,
                        snapchat_url: snapchatUrl,
                        linkedin_url: linkedinUrl,
                        plan_id: selectedPlanId,
                    }),
                });

                const data = await response.json();

                if (data.error) {
                    setError(data.error);
                } else {
                    setCurrentStep('complete');
                }
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 'account', label: 'Account', number: 1 },
        { id: 'store', label: 'Store Info', number: 2 },
        { id: 'plan', label: 'Select Plan', number: 3 },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="onboarding-page">
            <div className="onboarding-container">
                <div className="onboarding-header">
                    <Link href="/" className="logo">Shoppicca</Link>

                    {currentStep !== 'complete' && (
                        <div className="steps">
                            {steps.map((step, index) => (
                                <div
                                    key={step.id}
                                    className={`step ${currentStepIndex >= index ? 'active' : ''} ${currentStepIndex > index ? 'completed' : ''}`}
                                >
                                    <div className="step-number">{step.number}</div>
                                    <span className="step-label">{step.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {currentStep === 'complete' ? (
                    <div className="complete-card">
                        <div className="success-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h1>Your Store is Ready!</h1>
                        <p>Congratulations! Your store has been created successfully.</p>
                        <p className="store-url">
                            Your store: <a href={`/store/${slug}`} target="_blank">{slug}.shoppicca.com</a>
                        </p>
                        <div className="complete-actions">
                            <Link href="/admin" className="btn btn-primary btn-lg">
                                Go to Dashboard
                            </Link>
                            <Link href={`/store/${slug}`} className="btn btn-secondary btn-lg">
                                View Your Store
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="onboarding-card">
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

                        {currentStep === 'account' && (
                            <form onSubmit={handleAccountSubmit}>
                                <h2>Create Your Account</h2>
                                <p className="form-subtitle">Let&apos;s start with your basic information</p>

                                <div className="form-group">
                                    <label className="label">Full Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">Email Address</label>
                                    <input
                                        type="email"
                                        className="input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="input"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+233 XX XXX XXXX"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">Password</label>
                                    <input
                                        type="password"
                                        className="input"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Create a password (min 6 characters)"
                                        minLength={6}
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary btn-lg submit-btn" disabled={loading}>
                                    {loading ? 'Creating Account...' : 'Continue'}
                                </button>

                                <p className="login-link">
                                    Already have an account? <Link href="/auth/login">Sign in</Link>
                                </p>
                            </form>
                        )}

                        {currentStep === 'store' && (
                            <form onSubmit={handleStoreSubmit}>
                                <h2>Set Up Your Store</h2>
                                <p className="form-subtitle">Tell us about your business</p>

                                <div className="form-group">
                                    <label className="label">Store Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={storeName}
                                        onChange={(e) => setStoreName(e.target.value)}
                                        placeholder="e.g., Nancy Shoes"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">Store URL</label>
                                    <div className="slug-input">
                                        <input
                                            type="text"
                                            className={`input ${slugAvailable === false ? 'input-error' : ''}`}
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value.toLowerCase())}
                                            placeholder="your-store"
                                            required
                                        />
                                        <span className="slug-suffix">.shoppicca.com</span>
                                    </div>
                                    {slug && (
                                        <span className={`slug-status ${slugAvailable ? 'available' : 'taken'}`}>
                                            {slugAvailable === null ? 'Checking...' : slugAvailable ? '✓ Available' : '✗ Taken'}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="label">Category</label>
                                    <select
                                        className="input"
                                        value={storeCategory}
                                        onChange={(e) => setStoreCategory(e.target.value)}
                                    >
                                        <option value="">Select a category</option>
                                        <option value="fashion">Fashion & Clothing</option>
                                        <option value="shoes">Shoes & Footwear</option>
                                        <option value="bags">Bags & Accessories</option>
                                        <option value="electronics">Electronics</option>
                                        <option value="beauty">Beauty & Skincare</option>
                                        <option value="food">Food & Beverages</option>
                                        <option value="home">Home & Living</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="label">Description</label>
                                    <textarea
                                        className="input"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Briefly describe your store..."
                                        rows={3}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="label">WhatsApp Number (Required)</label>
                                    <input
                                        type="tel"
                                        className="input"
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        placeholder="+233 XX XXX XXXX"
                                        required
                                    />
                                    <span className="input-hint">Customers will contact you via this number</span>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="label">Instagram (Optional)</label>
                                        <input
                                            type="url"
                                            className="input"
                                            value={instagramUrl}
                                            onChange={(e) => setInstagramUrl(e.target.value)}
                                            placeholder="https://instagram.com/..."
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="label">Snapchat (Optional)</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={snapchatUrl}
                                            onChange={(e) => setSnapchatUrl(e.target.value)}
                                            placeholder="Your Snapchat username"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="label">LinkedIn (Optional)</label>
                                    <input
                                        type="url"
                                        className="input"
                                        value={linkedinUrl}
                                        onChange={(e) => setLinkedinUrl(e.target.value)}
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary btn-lg submit-btn">
                                    Continue
                                </button>
                            </form>
                        )}

                        {currentStep === 'plan' && (
                            <form onSubmit={handlePlanSubmit}>
                                <h2>Choose Your Plan</h2>
                                <p className="form-subtitle">Select the best plan for your business</p>

                                <div className="plans-grid">
                                    {plans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            className={`plan-card ${selectedPlanId === plan.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedPlanId(plan.id)}
                                        >
                                            <div className="plan-header">
                                                <h3>{plan.name === 'free' ? 'Free' : 'Pro'}</h3>
                                                <div className="plan-price">
                                                    <span className="price-amount">GHC {plan.price_cedis}</span>
                                                    {plan.price_cedis > 0 && <span className="price-period">/month</span>}
                                                </div>
                                            </div>
                                            <ul className="plan-features">
                                                <li>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    {plan.category_limit === null ? 'Unlimited categories' : `Up to ${plan.category_limit} categories`}
                                                </li>
                                                <li>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    {plan.products_per_category === null ? 'Unlimited products' : `Up to ${plan.products_per_category} products/category`}
                                                </li>
                                                <li className={!plan.can_customize_theme ? 'disabled' : ''}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        {plan.can_customize_theme ? (
                                                            <polyline points="20 6 9 17 4 12" />
                                                        ) : (
                                                            <line x1="18" y1="6" x2="6" y2="18" />
                                                        )}
                                                    </svg>
                                                    Custom theme colors
                                                </li>
                                                <li className={!plan.can_change_slug ? 'disabled' : ''}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        {plan.can_change_slug ? (
                                                            <polyline points="20 6 9 17 4 12" />
                                                        ) : (
                                                            <line x1="18" y1="6" x2="6" y2="18" />
                                                        )}
                                                    </svg>
                                                    Change store URL
                                                </li>
                                            </ul>
                                            <div className="plan-select">
                                                <input
                                                    type="radio"
                                                    name="plan"
                                                    value={plan.id}
                                                    checked={selectedPlanId === plan.id}
                                                    onChange={() => setSelectedPlanId(plan.id)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button type="submit" className="btn btn-primary btn-lg submit-btn" disabled={loading}>
                                    {loading ? 'Processing...' : plans.find(p => p.id === selectedPlanId)?.price_cedis === 0 ? 'Create Store' : 'Continue to Payment'}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
            .onboarding-page { min-height: 100vh; background: linear-gradient(135deg, #F8F9FA 0%, #FFFFFF 50%, #F0F7FF 100%); padding: 2rem 1rem; }
            .onboarding-container { max-width: 600px; margin: 0 auto; }
            .onboarding-header { text-align: center; margin-bottom: 2rem; }
            .logo { font-family: var(--font-display); font-size: 1.75rem; font-weight: 700; color: var(--color-text-primary); text-decoration: none; display: block; margin-bottom: 2rem; }
            .steps { display: flex; justify-content: center; gap: 1rem; }
            .step { display: flex; align-items: center; gap: 0.5rem; opacity: 0.5; }
            .step.active { opacity: 1; }
            .step-number { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: var(--color-border); color: var(--color-text-secondary); border-radius: 50%; font-size: 0.75rem; font-weight: 600; }
            .step.active .step-number { background: var(--color-primary); color: white; }
            .step.completed .step-number { background: var(--color-success); color: white; }
            .step-label { font-size: 0.875rem; color: var(--color-text-secondary); display: none; }
            @media (min-width: 640px) { .step-label { display: block; } }
            .onboarding-card { background: white; border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-xl); }
            .onboarding-card h2 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; text-align: center; }
            .form-subtitle { text-align: center; color: var(--color-text-secondary); margin-bottom: 2rem; }
            .error-message { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: rgba(239, 68, 68, 0.1); color: var(--color-error); border-radius: var(--radius-md); font-size: 0.875rem; margin-bottom: 1.5rem; }
            .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
            .slug-input { display: flex; align-items: center; }
            .slug-input .input { border-radius: var(--radius-md) 0 0 var(--radius-md); }
            .slug-suffix { padding: 0.75rem 1rem; background: var(--color-background-secondary); border: 1px solid var(--color-border); border-left: none; border-radius: 0 var(--radius-md) var(--radius-md) 0; font-size: 0.875rem; color: var(--color-text-tertiary); white-space: nowrap; }
            .slug-status { display: block; font-size: 0.75rem; margin-top: 0.5rem; }
            .slug-status.available { color: var(--color-success); }
            .slug-status.taken { color: var(--color-error); }
            .input-hint { display: block; font-size: 0.75rem; color: var(--color-text-tertiary); margin-top: 0.5rem; }
            .submit-btn { width: 100%; margin-top: 1rem; }
            .login-link { text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: var(--color-text-secondary); }
            .login-link :global(a) { color: var(--color-primary); font-weight: 500; text-decoration: none; }
            .plans-grid { display: grid; gap: 1rem; margin-bottom: 1.5rem; }
            @media (min-width: 480px) { .plans-grid { grid-template-columns: repeat(2, 1fr); } }
            .plan-card { position: relative; border: 2px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.5rem; cursor: pointer; transition: all var(--transition-fast); }
            .plan-card:hover { border-color: var(--color-primary); }
            .plan-card.selected { border-color: var(--color-primary); background: rgba(59, 130, 246, 0.05); }
            .plan-header { text-align: center; margin-bottom: 1rem; }
            .plan-header h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; text-transform: capitalize; }
            .plan-price { display: flex; align-items: baseline; justify-content: center; gap: 0.25rem; }
            .price-amount { font-size: 1.5rem; font-weight: 700; color: var(--color-primary); }
            .price-period { font-size: 0.875rem; color: var(--color-text-tertiary); }
            .plan-features { list-style: none; padding: 0; margin-bottom: 1.5rem; }
            .plan-features li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 0.5rem; }
            .plan-features li.disabled { opacity: 0.5; }
            .plan-features li svg { color: var(--color-success); }
            .plan-features li.disabled svg { color: var(--color-text-tertiary); }
            .plan-select { display: flex; justify-content: center; }
            .complete-card { background: white; border-radius: var(--radius-xl); padding: 3rem; text-align: center; box-shadow: var(--shadow-xl); }
            .success-icon { width: 96px; height: 96px; display: flex; align-items: center; justify-content: center; background: rgba(16, 185, 129, 0.1); color: var(--color-success); border-radius: 50%; margin: 0 auto 1.5rem; }
            .complete-card h1 { font-family: var(--font-display); font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
            .complete-card p { color: var(--color-text-secondary); margin-bottom: 1.5rem; }
            .store-url { font-size: 1.125rem; }
            .store-url a { color: var(--color-primary); font-weight: 600; text-decoration: none; }
            .complete-actions { display: flex; flex-direction: column; gap: 1rem; max-width: 320px; margin: 2rem auto 0; }
            @media (min-width: 480px) { .complete-actions { flex-direction: row; } }
            `}</style>
        </div>
    );
};

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="loading-screen"><div className="spinner"></div></div>}>
            <OnboardingContent />
        </Suspense>
    );
}
