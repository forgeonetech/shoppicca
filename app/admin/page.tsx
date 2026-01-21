'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Store, Category, Product } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const supabase = createClient();
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch store
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (storeData) {
        setStore(storeData);

        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .eq('store_id', storeData.id);
        setCategories(categoriesData || []);

        // Fetch products
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id);
        setProducts(productsData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Products',
      value: products.length,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
      color: '#3B82F6',
    },
    {
      label: 'Categories',
      value: categories.length,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
      color: '#10B981',
    },
    {
      label: 'Visible Products',
      value: products.filter(p => p.is_visible).length,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      color: '#8B5CF6',
    },
    {
      label: 'Hidden Products',
      value: products.filter(p => !p.is_visible).length,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ),
      color: '#F59E0B',
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here&apos;s an overview of your store.</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link href="/admin/products?action=new" className="action-card">
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span>Add Product</span>
          </Link>
          <Link href="/admin/categories?action=new" className="action-card">
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
            </div>
            <span>Add Category</span>
          </Link>
          <Link href="/admin/settings" className="action-card">
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <span>Store Settings</span>
          </Link>
          <Link href={`/store/${store?.slug}`} target="_blank" className="action-card">
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
            <span>View Store</span>
          </Link>
        </div>
      </div>

      <div className="recent-products">
        <div className="section-header">
          <h2>Recent Products</h2>
          <Link href="/admin/products" className="view-all">View All</Link>
        </div>
        {products.length === 0 ? (
          <div className="empty-state">
            <p>No products yet. Add your first product to get started!</p>
            <Link href="/admin/products?action=new" className="btn btn-primary">
              Add Product
            </Link>
          </div>
        ) : (
          <div className="products-list">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="product-item">
                <div className="product-info">
                  <span className="product-name">{product.name}</span>
                  <span className="product-price">
                    {product.price_type === 'dm'
                      ? 'DM for price'
                      : `GHC ${product.price?.toLocaleString() || 0}`}
                    {product.price_type === 'negotiable' && ' (Negotiable)'}
                  </span>
                </div>
                <span className={`visibility-badge ${product.is_visible ? 'visible' : 'hidden'}`}>
                  {product.is_visible ? 'Visible' : 'Hidden'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard {
          max-width: 1200px;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--color-text-primary);
          letter-spacing: -0.02em;
        }

        .dashboard-header p {
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 1.25rem;
          }
        }

        .stat-card {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 1rem;
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .stat-icon {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          min-width: 0;
        }

        .stat-value {
          font-size: 1.625rem;
          font-weight: 700;
          color: var(--color-text-primary);
          line-height: 1.2;
          letter-spacing: -0.01em;
        }

        .stat-label {
          font-size: 0.8125rem;
          color: var(--color-text-tertiary);
          font-weight: 500;
          line-height: 1.3;
        }

        .quick-actions {
          margin-bottom: 2.5rem;
        }

        .quick-actions h2 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
          color: var(--color-text-primary);
          letter-spacing: -0.01em;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .actions-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 1.25rem;
          }
        }

        .action-card {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          gap: 0.875rem;
          padding: 1.25rem 1.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.05);
          text-decoration: none;
          color: var(--color-text-primary);
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .action-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--color-primary), #60A5FA);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .action-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .action-card:hover::before {
          opacity: 1;
        }

        .action-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.08);
          color: var(--color-primary);
          border-radius: 10px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .action-card:hover .action-icon {
          background: rgba(59, 130, 246, 0.12);
          transform: scale(1.05);
        }

        .action-card span {
          font-size: 0.9375rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }

        .recent-products {
          background: white;
          border-radius: 12px;
          padding: 1.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .section-header h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text-primary);
          letter-spacing: -0.01em;
        }

        .view-all {
          font-size: 0.875rem;
          color: var(--color-primary);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .view-all:hover {
          color: #2563EB;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
        }

        .empty-state p {
          color: var(--color-text-secondary);
          margin-bottom: 1.25rem;
          font-size: 0.9375rem;
        }

        .products-list {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .product-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.125rem;
          background: var(--color-background-secondary);
          border-radius: 10px;
          transition: all 0.2s ease;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .product-item:hover {
          background: rgba(0, 0, 0, 0.02);
          border-color: rgba(0, 0, 0, 0.08);
        }

        .product-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
          flex: 1;
        }

        .product-name {
          font-weight: 600;
          color: var(--color-text-primary);
          font-size: 0.9375rem;
          letter-spacing: -0.01em;
        }

        .product-price {
          font-size: 0.8125rem;
          color: var(--color-text-tertiary);
          font-weight: 500;
        }

        .visibility-badge {
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          letter-spacing: 0.01em;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .visibility-badge.visible {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
        }

        .visibility-badge.hidden {
          background: rgba(107, 114, 128, 0.1);
          color: #6B7280;
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