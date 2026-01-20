'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Store, Plan, Category } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default function CategoriesPage() {
    const supabase = createClient();
    const [store, setStore] = useState<Store | null>(null);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', image_url: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

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
            .single();

        if (storeData) {
            setStore(storeData);
            setPlan(storeData.plans as Plan);

            const { data: categoriesData } = await supabase
                .from('categories')
                .select('*')
                .eq('store_id', storeData.id)
                .order('created_at', { ascending: false });

            setCategories(categoriesData || []);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Check plan limits for new categories
        if (!editingCategory && plan?.category_limit !== null) {
            if (categories.length >= (plan?.category_limit || 0)) {
                setError(`Your plan allows only ${plan?.category_limit} categories. Upgrade to add more.`);
                return;
            }
        }

        setSaving(true);

        try {
            if (editingCategory) {
                // Update existing category
                const { error } = await supabase
                    .from('categories')
                    .update({ name: formData.name, image_url: formData.image_url || null })
                    .eq('id', editingCategory.id);

                if (error) throw error;
            } else {
                // Create new category
                const { error } = await supabase
                    .from('categories')
                    .insert({
                        store_id: store?.id,
                        name: formData.name,
                        image_url: formData.image_url || null,
                    });

                if (error) throw error;
            }

            setShowForm(false);
            setEditingCategory(null);
            setFormData({ name: '', image_url: '' });
            fetchData();
        } catch (err) {
            setError('Failed to save category');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({ name: category.name, image_url: category.image_url || '' });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete category');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${store?.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('product_images')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('product_images')
            .getPublicUrl(fileName);

        setFormData({ ...formData, image_url: publicUrl });
    };

    const canAddCategory = plan?.category_limit === null || categories.length < (plan?.category_limit || 0);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="categories-page">
            <div className="page-header">
                <div>
                    <h1>Categories</h1>
                    <p>Organize your products into categories</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setEditingCategory(null);
                        setFormData({ name: '', image_url: '' });
                        setShowForm(true);
                    }}
                    disabled={!canAddCategory}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Category
                </button>
            </div>

            {plan?.category_limit !== null && (
                <div className="limit-notice">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>
                        {categories.length} / {plan?.category_limit} categories used.
                        {!canAddCategory && ' Upgrade to Pro for unlimited categories.'}
                    </span>
                </div>
            )}

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                            <button className="close-btn" onClick={() => setShowForm(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {error && <div className="error-message">{error}</div>}

                            <div className="form-group">
                                <label className="label">Category Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Heels, Sneakers, Bags"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="label">Category Image (Optional)</label>
                                {formData.image_url && (
                                    <img src={formData.image_url} alt="Category" className="preview-image" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="file-input"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {categories.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <h3>No categories yet</h3>
                    <p>Create categories to organize your products</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowForm(true)}
                        disabled={!canAddCategory}
                    >
                        Add Your First Category
                    </button>
                </div>
            ) : (
                <div className="categories-grid">
                    {categories.map((category) => (
                        <div key={category.id} className="category-card">
                            <div className="category-image">
                                {category.image_url ? (
                                    <img src={category.image_url} alt={category.name} />
                                ) : (
                                    <div className="placeholder-image">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="category-info">
                                <h3>{category.name}</h3>
                            </div>
                            <div className="category-actions">
                                <button className="action-btn" onClick={() => handleEdit(category)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button className="action-btn delete" onClick={() => handleDelete(category.id)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
        .categories-page {
          max-width: 1200px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .page-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
        }

        .page-header p {
          color: var(--color-text-secondary);
        }

        .limit-notice {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(59, 130, 246, 0.1);
          color: var(--color-primary);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
        }

        .modal {
          background: white;
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--color-border);
        }

        .modal-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .close-btn {
          padding: 0.25rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-tertiary);
        }

        .modal form {
          padding: 1.5rem;
        }

        .error-message {
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-error);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .preview-image {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: var(--radius-md);
          margin-bottom: 0.5rem;
        }

        .file-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-md);
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: var(--radius-lg);
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-background-secondary);
          color: var(--color-text-tertiary);
          border-radius: 50%;
        }

        .empty-state h3 {
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: var(--color-text-secondary);
          margin-bottom: 1.5rem;
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .categories-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .categories-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .category-card {
          background: white;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .category-image {
          aspect-ratio: 1;
          background: var(--color-background-secondary);
        }

        .category-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-light);
        }

        .category-info {
          padding: 1rem;
        }

        .category-info h3 {
          font-size: 0.9375rem;
          font-weight: 600;
        }

        .category-actions {
          display: flex;
          border-top: 1px solid var(--color-border);
        }

        .action-btn {
          flex: 1;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
        }

        .action-btn:hover {
          background: var(--color-background-secondary);
          color: var(--color-primary);
        }

        .action-btn.delete:hover {
          color: var(--color-error);
        }

        .action-btn:first-child {
          border-right: 1px solid var(--color-border);
        }

        .loading {
          display: flex;
          justify-content: center;
          padding: 4rem;
        }
      `}</style>
        </div>
    );
}
