'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { Store, Plan, Category, Product, ProductImage, ProductAttribute } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

interface ProductWithDetails extends Product {
    images: ProductImage[];
    attributes: ProductAttribute[];
}

export default function ProductsPage() {
    const supabase = createClient();
    const [store, setStore] = useState<Store | null>(null);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<ProductWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductWithDetails | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        sale_price: '',
        price_type: 'fixed' as 'fixed' | 'negotiable' | 'dm',
        category_id: '',
        is_visible: true,
    });
    const [images, setImages] = useState<string[]>([]);
    const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([]);

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

            const { data: categoriesData } = await supabase
                .from('categories')
                .select('*')
                .eq('store_id', storeData.id);
            setCategories(categoriesData || []);

            const { data: productsData } = await supabase
                .from('products')
                .select('*, product_images(*), product_attributes(*)')
                .eq('store_id', storeData.id)
                .order('created_at', { ascending: false });

            const formattedProducts = (productsData || []).map((p: Product & { product_images?: ProductImage[]; product_attributes?: ProductAttribute[] }) => ({
                ...p,
                images: p.product_images || [],
                attributes: p.product_attributes || [],
            }));
            setProducts(formattedProducts);
        }
        setLoading(false);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            sale_price: '',
            price_type: 'fixed',
            category_id: '',
            is_visible: true,
        });
        setImages([]);
        setAttributes([]);
        setEditingProduct(null);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const productData = {
                store_id: store?.id,
                name: formData.name,
                description: formData.description || null,
                price: formData.price_type === 'dm' ? null : parseFloat(formData.price) || null,
                sale_price: formData.price_type === 'fixed' && formData.sale_price ? parseFloat(formData.sale_price) : null,
                price_type: formData.price_type,
                category_id: formData.category_id || null,
                is_visible: formData.is_visible,
            };

            let productId: string;

            if (editingProduct) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id);
                if (updateError) throw updateError;
                productId = editingProduct.id;

                // Delete existing images and attributes
                await supabase.from('product_images').delete().eq('product_id', productId);
                await supabase.from('product_attributes').delete().eq('product_id', productId);
            } else {
                const { data: newProduct, error: insertError } = await supabase
                    .from('products')
                    .insert(productData)
                    .select()
                    .maybeSingle();
                if (insertError) throw insertError;
                productId = newProduct.id;
            }

            // Insert images
            if (images.length > 0) {
                const imageRecords = images.map((url, index) => ({
                    product_id: productId,
                    image_url: url,
                    position: index,
                }));
                await supabase.from('product_images').insert(imageRecords);
            }

            // Insert attributes
            if (attributes.length > 0) {
                const attrRecords = attributes
                    .filter((a) => a.key && a.value)
                    .map((a) => ({
                        product_id: productId,
                        key: a.key,
                        value: a.value,
                    }));
                if (attrRecords.length > 0) {
                    await supabase.from('product_attributes').insert(attrRecords);
                }
            }

            setShowForm(false);
            resetForm();
            fetchData();
        } catch (err) {
            console.error(err);
            setError('Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (product: ProductWithDetails) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price?.toString() || '',
            sale_price: product.sale_price?.toString() || '',
            price_type: product.price_type,
            category_id: product.category_id || '',
            is_visible: product.is_visible,
        });
        setImages(product.images.map((i) => i.image_url));
        setAttributes(product.attributes.map((a) => ({ key: a.key, value: a.value })));
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await supabase.from('products').delete().eq('id', id);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete product');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (const file of Array.from(files)) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${store?.id}/products/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('product_images')
                .upload(fileName, file);

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from('product_images')
                    .getPublicUrl(fileName);

                setImages((prev) => [...prev, publicUrl]);
            }
        }
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const addAttribute = () => {
        setAttributes((prev) => [...prev, { key: '', value: '' }]);
    };

    const updateAttribute = (index: number, field: 'key' | 'value', value: string) => {
        setAttributes((prev) =>
            prev.map((attr, i) => (i === index ? { ...attr, [field]: value } : attr))
        );
    };

    const removeAttribute = (index: number) => {
        setAttributes((prev) => prev.filter((_, i) => i !== index));
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    return (
        <div className="products-page">
            <div className="page-header">
                <div>
                    <h1>Products</h1>
                    <p>Manage your store products</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        if (plan?.products_per_category && products.length >= plan.products_per_category) {
                            alert(`You have reached the limit of ${plan.products_per_category} products. Upgrade to Pro for unlimited products.`);
                            return;
                        }
                        resetForm();
                        setShowForm(true);
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Product
                </button>
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal large">
                        <div className="modal-header">
                            <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                            <button className="close-btn" onClick={() => { setShowForm(false); resetForm(); }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="product-form">
                            {error && <div className="error-message">{error}</div>}

                            <div className="form-section">
                                <h3>Basic Info</h3>
                                <div className="form-group">
                                    <label className="label">Product Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
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

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="label">Category</label>
                                        <select
                                            className="input"
                                            value={formData.category_id}
                                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        >
                                            <option value="">No category</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="label">Visibility</label>
                                        <select
                                            className="input"
                                            value={formData.is_visible ? 'visible' : 'hidden'}
                                            onChange={(e) => setFormData({ ...formData, is_visible: e.target.value === 'visible' })}
                                        >
                                            <option value="visible">Visible</option>
                                            <option value="hidden">Hidden</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Pricing</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="label">Price Type</label>
                                        <select
                                            className="input"
                                            value={formData.price_type}
                                            onChange={(e) => setFormData({ ...formData, price_type: e.target.value as 'fixed' | 'negotiable' | 'dm' })}
                                        >
                                            <option value="fixed">Fixed Price</option>
                                            <option value="negotiable">Negotiable</option>
                                            <option value="dm">DM for Price</option>
                                        </select>
                                    </div>

                                    {formData.price_type !== 'dm' && (
                                        <>
                                            <div className="form-group">
                                                <label className="label">Price (GHC)</label>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                            {formData.price_type === 'fixed' && (
                                                <div className="form-group">
                                                    <label className="label">Sale Price (Optional)</label>
                                                    <input
                                                        type="number"
                                                        className="input"
                                                        value={formData.sale_price}
                                                        onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="Leave empty if not on sale"
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Images</h3>
                                <div className="images-grid">
                                    {images.map((url, index) => (
                                        <div key={index} className="image-preview">
                                            <Image src={url} alt={`Product ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                                            <button type="button" className="remove-image" onClick={() => removeImage(index)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    <label className="image-upload">
                                        <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        <span>Add</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-section">
                                <div className="section-header">
                                    <h3>Attributes</h3>
                                    <button type="button" className="btn btn-sm btn-secondary" onClick={addAttribute}>
                                        Add Attribute
                                    </button>
                                </div>
                                {attributes.map((attr, index) => (
                                    <div key={index} className="attribute-row">
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Key (e.g., Size)"
                                            value={attr.key}
                                            onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Value (e.g., 42, 43, 44)"
                                            value={attr.value}
                                            onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                                        />
                                        <button type="button" className="remove-attr" onClick={() => removeAttribute(index)}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {products.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                    </div>
                    <h3>No products yet</h3>
                    <p>Add your first product to start selling</p>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        Add Your First Product
                    </button>
                </div>
            ) : (
                <div className="products-grid">
                    {products.map((product) => (
                        <div key={product.id} className="product-card">
                            <div className="product-image">
                                {product.images[0] ? (
                                    <Image src={product.images[0].image_url} alt={product.name} fill style={{ objectFit: 'cover' }} />
                                ) : (
                                    <div className="placeholder">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                    </div>
                                )}
                                <span className={`visibility-badge ${product.is_visible ? 'visible' : 'hidden'}`}>
                                    {product.is_visible ? 'Visible' : 'Hidden'}
                                </span>
                            </div>
                            <div className="product-info">
                                <h3>{product.name}</h3>
                                <p className="product-price">
                                    {product.price_type === 'dm'
                                        ? 'DM for price'
                                        : product.sale_price ? (
                                            <>
                                                <span style={{ textDecoration: 'line-through', marginRight: '0.5rem', opacity: 0.7 }}>GHC {product.price?.toLocaleString()}</span>
                                                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>GHC {product.sale_price.toLocaleString()}</span>
                                            </>
                                        ) : (
                                            `GHC ${product.price?.toLocaleString() || 0}`
                                        )}
                                    {product.price_type === 'negotiable' && ' (Negotiable)'}
                                </p>
                            </div>
                            <div className="product-actions">
                                <button className="action-btn" onClick={() => handleEdit(product)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button className="action-btn delete" onClick={() => handleDelete(product.id)}>
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
        .products-page { max-width: 1200px; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .page-header h1 { font-size: 1.75rem; font-weight: 700; }
        .page-header p { color: var(--color-text-secondary); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
        .modal { background: white; border-radius: var(--radius-xl); width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; }
        .modal.large { max-width: 800px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid var(--color-border); }
        .modal-header h2 { font-size: 1.25rem; font-weight: 600; }
        .close-btn { padding: 0.25rem; background: none; border: none; cursor: pointer; color: var(--color-text-tertiary); }

        .product-form { padding: 1.5rem; }
        .form-section { margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--color-border); }
        .form-section:last-of-type { border-bottom: none; }
        .form-section h3 { font-size: 0.9375rem; font-weight: 600; margin-bottom: 1rem; }
        .form-section .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .error-message { padding: 0.75rem; background: rgba(239,68,68,0.1); color: var(--color-error); border-radius: var(--radius-md); font-size: 0.875rem; margin-bottom: 1rem; }

        .images-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
        .image-preview { position: relative; aspect-ratio: 1; border-radius: var(--radius-md); overflow: hidden; }
        .remove-image { position: absolute; top: 0.25rem; right: 0.25rem; width: 24px; height: 24px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .image-upload { aspect-ratio: 1; border: 2px dashed var(--color-border); border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; cursor: pointer; color: var(--color-text-tertiary); font-size: 0.75rem; }
        .image-upload input { display: none; }
        .image-upload:hover { border-color: var(--color-primary); color: var(--color-primary); }

        .attribute-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; }
        .remove-attr { padding: 0.5rem; background: none; border: none; color: var(--color-text-tertiary); cursor: pointer; }
        .remove-attr:hover { color: var(--color-error); }

        .modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; padding-top: 1rem; }

        .empty-state { text-align: center; padding: 4rem 2rem; background: white; border-radius: var(--radius-lg); }
        .empty-icon { width: 80px; height: 80px; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; background: var(--color-background-secondary); color: var(--color-text-tertiary); border-radius: 50%; }
        .empty-state h3 { font-size: 1.125rem; margin-bottom: 0.5rem; }
        .empty-state p { color: var(--color-text-secondary); margin-bottom: 1.5rem; }

        .products-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        @media (min-width: 640px) { .products-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .products-grid { grid-template-columns: repeat(4, 1fr); } }

        .product-card { background: white; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
        .product-image { position: relative; aspect-ratio: 1; background: var(--color-background-secondary); }
        .placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-text-light); }
        .visibility-badge { position: absolute; top: 0.5rem; left: 0.5rem; font-size: 0.6875rem; font-weight: 500; padding: 0.25rem 0.5rem; border-radius: var(--radius-full); }
        .visibility-badge.visible { background: rgba(16,185,129,0.9); color: white; }
        .visibility-badge.hidden { background: rgba(0,0,0,0.6); color: white; }
        .product-info { padding: 1rem; }
        .product-info h3 { font-size: 0.9375rem; font-weight: 600; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .product-price { font-size: 0.8125rem; color: var(--color-text-tertiary); }
        .product-actions { display: flex; border-top: 1px solid var(--color-border); }
        .action-btn { flex: 1; padding: 0.75rem; display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; color: var(--color-text-secondary); transition: all var(--transition-fast); }
        .action-btn:hover { background: var(--color-background-secondary); color: var(--color-primary); }
        .action-btn.delete:hover { color: var(--color-error); }
        .action-btn:first-child { border-right: 1px solid var(--color-border); }
        .loading { display: flex; justify-content: center; padding: 4rem; }
      `}</style>
        </div>
    );
}
