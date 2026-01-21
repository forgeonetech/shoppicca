'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { Store, Plan } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
    const supabase = createClient();
    const [store, setStore] = useState<Store | null>(null);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        category: '',
        description: '',
        whatsapp_number: '',
        instagram_url: '',
        snapchat_url: '',
        linkedin_url: '',
        theme_color: '#3B82F6',
        accent_color: '#D4AF37',
        banner_url: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: storeData } = await supabase
            .from('stores')
            .select('*, plans(*)')
            .eq('owner_id', user.id)
            .maybeSingle();

        if (storeData) {
            setStore(storeData);
            setPlan(storeData.plans as Plan);
            setFormData({
                name: storeData.name || '',
                slug: storeData.slug || '',
                category: storeData.category || '',
                description: storeData.description || '',
                whatsapp_number: storeData.whatsapp_number || '',
                instagram_url: storeData.instagram_url || '',
                snapchat_url: storeData.snapchat_url || '',
                linkedin_url: storeData.linkedin_url || '',
                theme_color: storeData.theme_color || '#3B82F6',
                accent_color: storeData.accent_color || '#D4AF37',
                banner_url: storeData.banner_url || '',
            });
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            const updateData: Record<string, unknown> = {
                name: formData.name,
                category: formData.category || null,
                description: formData.description || null,
                whatsapp_number: formData.whatsapp_number,
                instagram_url: formData.instagram_url || null,
                snapchat_url: formData.snapchat_url || null,
                linkedin_url: formData.linkedin_url || null,
                banner_url: formData.banner_url || null,
            };

            // Only allow slug change for paid plan
            if (plan?.can_change_slug && formData.slug !== store?.slug) {
                // Check slug availability
                const { data: existingStore } = await supabase
                    .from('stores')
                    .select('id')
                    .eq('slug', formData.slug)
                    .neq('id', store?.id)
                    .maybeSingle();

                if (existingStore) {
                    setError('This store URL is already taken');
                    setSaving(false);
                    return;
                }
                updateData.slug = formData.slug;
            }

            // Only allow theme changes for paid plan
            if (plan?.can_customize_theme) {
                updateData.theme_color = formData.theme_color;
                updateData.accent_color = formData.accent_color;
            }

            const { error: updateError } = await supabase
                .from('stores')
                .update(updateData)
                .eq('id', store?.id);

            if (updateError) throw updateError;

            setSuccess('Settings saved successfully!');
            fetchData();
        } catch (err) {
            console.error(err);
            setError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${store?.id}/banner.${fileExt}`;

        // Delete old banner if exists
        if (formData.banner_url) {
            const oldPath = formData.banner_url.split('/').pop();
            if (oldPath) {
                await supabase.storage.from('store_banners').remove([`${store?.id}/${oldPath}`]);
            }
        }

        const { error: uploadError } = await supabase.storage
            .from('store_banners')
            .upload(fileName, file, { upsert: true });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('store_banners')
            .getPublicUrl(fileName);

        setFormData({ ...formData, banner_url: publicUrl });
    };

    const removeBanner = async () => {
        if (!formData.banner_url) return;

        const fileName = `${store?.id}/banner.${formData.banner_url.split('.').pop()}`;
        await supabase.storage.from('store_banners').remove([fileName]);
        setFormData({ ...formData, banner_url: '' });
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="settings-page">
            <div className="page-header">
                <h1>Store Settings</h1>
                <p>Manage your store information and appearance</p>
            </div>

            <form onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="settings-section">
                    <h2>Basic Information</h2>

                    <div className="form-group">
                        <label className="label">Store Name</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">
                            Store URL
                            {!plan?.can_change_slug && (
                                <span className="pro-badge">Pro Only</span>
                            )}
                        </label>
                        <div className="slug-input">
                            <input
                                type="text"
                                className="input"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                                disabled={!plan?.can_change_slug}
                            />
                            <span className="slug-suffix">.shoppicca.com</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Category</label>
                        <select
                            className="input"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>
                </div>

                <div className="settings-section">
                    <h2>Store Banner</h2>
                    <p className="section-description">Upload a banner image to display at the top of your store page.</p>

                    {formData.banner_url ? (
                        <div className="banner-preview">
                            <Image src={formData.banner_url} alt="Banner" fill style={{ objectFit: 'cover' }} />
                            <button type="button" className="remove-banner" onClick={removeBanner}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                Remove
                            </button>
                        </div>
                    ) : (
                        <label className="banner-upload">
                            <input type="file" accept="image/*" onChange={handleBannerUpload} />
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <span>Click to upload banner (recommended: 1200x400px)</span>
                        </label>
                    )}
                </div>

                <div className="settings-section">
                    <h2>Contact Information</h2>

                    <div className="form-group">
                        <label className="label">WhatsApp Number</label>
                        <input
                            type="tel"
                            className="input"
                            value={formData.whatsapp_number}
                            onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                            placeholder="+233 XX XXX XXXX"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="label">Instagram URL</label>
                            <input
                                type="url"
                                className="input"
                                value={formData.instagram_url}
                                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                                placeholder="https://instagram.com/..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">Snapchat Username</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.snapchat_url}
                                onChange={(e) => setFormData({ ...formData, snapchat_url: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">LinkedIn URL</label>
                        <input
                            type="url"
                            className="input"
                            value={formData.linkedin_url}
                            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                            placeholder="https://linkedin.com/in/..."
                        />
                    </div>
                </div>

                <div className="settings-section">
                    <h2>
                        Theme Customization
                        {!plan?.can_customize_theme && (
                            <span className="pro-badge">Pro Only</span>
                        )}
                    </h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="label">Theme Color</label>
                            <div className="color-picker">
                                <input
                                    type="color"
                                    value={formData.theme_color}
                                    onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                                    disabled={!plan?.can_customize_theme}
                                />
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.theme_color}
                                    onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                                    disabled={!plan?.can_customize_theme}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Accent Color</label>
                            <div className="color-picker">
                                <input
                                    type="color"
                                    value={formData.accent_color}
                                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                                    disabled={!plan?.can_customize_theme}
                                />
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.accent_color}
                                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                                    disabled={!plan?.can_customize_theme}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            <style jsx>{`
        .settings-page { max-width: 800px; }
        .page-header { margin-bottom: 2rem; }
        .page-header h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
        .page-header p { color: var(--color-text-secondary); }

        .error-message, .success-message { padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.875rem; margin-bottom: 1.5rem; }
        .error-message { background: rgba(239,68,68,0.1); color: var(--color-error); }
        .success-message { background: rgba(16,185,129,0.1); color: var(--color-success); }

        .settings-section { background: white; border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: var(--shadow-sm); }
        .settings-section h2 { font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .section-description { font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 1rem; margin-top: -0.5rem; }

        .pro-badge { font-size: 0.6875rem; font-weight: 500; padding: 0.125rem 0.5rem; background: rgba(212,175,55,0.1); color: var(--color-accent); border-radius: var(--radius-full); }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        .slug-input { display: flex; }
        .slug-input .input { border-radius: var(--radius-md) 0 0 var(--radius-md); }
        .slug-input .input:disabled { background: var(--color-background-tertiary); }
        .slug-suffix { padding: 0.75rem 1rem; background: var(--color-background-secondary); border: 1px solid var(--color-border); border-left: none; border-radius: 0 var(--radius-md) var(--radius-md) 0; font-size: 0.875rem; color: var(--color-text-tertiary); white-space: nowrap; }

        .banner-preview { position: relative; width: 100%; height: 200px; border-radius: var(--radius-lg); overflow: hidden; }
        .remove-banner { position: absolute; top: 1rem; right: 1rem; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 0.875rem; }
        .banner-upload { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; padding: 3rem; border: 2px dashed var(--color-border); border-radius: var(--radius-lg); cursor: pointer; color: var(--color-text-tertiary); text-align: center; }
        .banner-upload input { display: none; }
        .banner-upload:hover { border-color: var(--color-primary); color: var(--color-primary); }

        .color-picker { display: flex; gap: 0.5rem; }
        .color-picker input[type="color"] { width: 48px; height: 42px; padding: 0; border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; }
        .color-picker input[type="color"]:disabled { opacity: 0.5; cursor: not-allowed; }
        .color-picker .input { flex: 1; }
        .color-picker .input:disabled { background: var(--color-background-tertiary); }

        .form-actions { margin-top: 0.5rem; }
        .loading { display: flex; justify-content: center; padding: 4rem; }
      `}</style>
        </div>
    );
}
