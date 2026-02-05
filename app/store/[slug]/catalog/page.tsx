'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Store, Category, Product, ProductImage } from '@/lib/types/database';
import { formatPrice, generateWishlistWhatsAppUrl } from '@/lib/utils';

// Redefine WishlistItem to match store page
interface WishlistItem {
    id: string;
    name: string;
    price: number | null;
    price_type: 'fixed' | 'negotiable' | 'dm';
    image_url: string | null;
}

interface ProductWithImages extends Product {
    product_images: ProductImage[];
}

export default function CatalogPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const slug = params.slug as string;
    const initialCategory = searchParams.get('category');

    const supabase = createClient();

    const [store, setStore] = useState<Store | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<ProductWithImages[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ProductWithImages[] | null>(null);
    const [searching, setSearching] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Wishlist State
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [showWishlist, setShowWishlist] = useState(false);
    const [baseUrl, setBaseUrl] = useState('https://shoppicca.vercel.app');

    useEffect(() => {
        if (window.location.hostname.includes('localhost')) {
            setBaseUrl('http://localhost:3000');
        }
    }, []);

    useEffect(() => {
        fetchStoreData();
        const saved = localStorage.getItem(`wishlist_${slug}`);
        if (saved) setWishlist(JSON.parse(saved));
    }, [slug]);

    useEffect(() => {
        localStorage.setItem(`wishlist_${slug}`, JSON.stringify(wishlist));
    }, [wishlist, slug]);

    useEffect(() => {
        if (initialCategory && !loading) {
            const element = document.getElementById(`category-${initialCategory}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [initialCategory, loading]);

    const fetchStoreData = async () => {
        const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

        if (!storeData) {
            setLoading(false);
            return;
        }

        setStore(storeData);

        const { data: categoriesData } = await supabase
            .from('categories')
            .select('*')
            .eq('store_id', storeData.id)
            .order('created_at');
        setCategories(categoriesData || []);

        const { data: productsData } = await supabase
            .from('products')
            .select('*, product_images(*)')
            .eq('store_id', storeData.id)
            .eq('is_visible', true)
            .order('created_at', { ascending: false });
        setProducts(productsData || []);

        setLoading(false);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || !store) return;

        setSearching(true);
        const { data } = await supabase
            .from('products')
            .select('*, product_images(*)')
            .eq('store_id', store.id)
            .eq('is_visible', true)
            .ilike('name', `%${searchQuery}%`);

        setSearchResults(data || []);
        setSearching(false);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults(null);
    };

    const toggleWishlist = (product: ProductWithImages) => {
        const exists = wishlist.find((item) => item.id === product.id);
        if (exists) {
            setWishlist(wishlist.filter((item) => item.id !== product.id));
        } else {
            setWishlist([
                ...wishlist,
                {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    price_type: product.price_type,
                    image_url: product.product_images?.[0]?.image_url || null,
                },
            ]);
        }
    };

    const isInWishlist = (productId: string) => wishlist.some((item) => item.id === productId);

    const sendWishlistToWhatsApp = () => {
        if (!store?.whatsapp_number || wishlist.length === 0) return;
        const url = generateWishlistWhatsAppUrl(store.whatsapp_number, wishlist, store.name);
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <style jsx>{`
                    .loading-state { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #F9FAFB; }
                `}</style>
            </div>
        );
    }

    if (!store) return <div className="text-center p-10">Store not found</div>;

    const themeColor = store.theme_color || '#1A1A2E';
    const accentColor = store.accent_color || '#D4AF37';
    const fontColor = store.font_color || '#1A1A2E';
    const headerFont = store.header_font || 'Playfair Display';
    const bodyFont = store.body_font || 'Inter';

    // Helper to format google fonts url
    const getFontUrl = () => {
        const fonts = [headerFont, bodyFont].map(f => f.replace(/ /g, '+'));
        return `https://fonts.googleapis.com/css2?family=${fonts[0]}:wght@400;500;600;700&family=${fonts[1]}:wght@300;400;500;600;700&display=swap`;
    };

    // Helper component for products within this page to share wishlist state
    const CatalogProductCard = ({ product }: { product: ProductWithImages }) => (
        <Link href={`/store/${slug}/product/${product.id}`} className="product-card">
            <div className="product-image-wrapper">
                <button
                    className={`wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(product);
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                </button>
                <div className="product-image">
                    {product.product_images?.[0] ? (
                        <Image src={product.product_images[0].image_url} alt={product.name} fill style={{ objectFit: 'contain' }} />
                    ) : (
                        <div className="placeholder"></div>
                    )}
                </div>
            </div>
            <div className="product-info">
                <h3 className="product-name" style={{ color: fontColor }}>{product.name}</h3>
                <div className="price-container">
                    {product.sale_price ? (
                        <div className="sale-price-wrapper">
                            <span className="original-price">{formatPrice(product.price, product.price_type)}</span>
                            <span className="sale-price" style={{ color: themeColor }}>{formatPrice(product.sale_price, 'fixed')}</span>
                        </div>
                    ) : (
                        <p className="product-price" style={{ color: themeColor }}>{formatPrice(product.price, product.price_type)}</p>
                    )}
                </div>
            </div>
        </Link>
    );

    return (
        <div className="catalog-page">
            <link href={getFontUrl()} rel="stylesheet" />
            <style jsx global>{`
                :root {
                    --font-display: '${headerFont}', serif;
                    --font-body: '${bodyFont}', sans-serif;
                }
                .catalog-page {
                    font-family: '${bodyFont}', sans-serif;
                    color: ${fontColor};
                }
                .store-name, h1, h2, h3, h4 {
                    font-family: '${headerFont}', serif !important;
                }
                .menu-categories button {
                    font-family: '${bodyFont}', sans-serif;
                }
            `}</style>

            {/* Header */}
            <header className="store-header">
                <div className="header-content">
                    <Link href={`/store/${slug}`} className="store-name" style={{ color: themeColor }}>
                        {store.logo_url ? (
                            <div style={{ position: 'relative', width: '120px', height: '50px' }}>
                                <Image src={store.logo_url} alt={store.name} fill style={{ objectFit: 'contain', objectPosition: 'left' }} priority />
                            </div>
                        ) : (
                            store.name
                        )}
                    </Link>
                    <div className="header-actions">
                        <nav className="desktop-nav">
                            <Link href={`/store/${slug}`} style={{ color: themeColor }}>Home</Link>
                            <Link href={`/store/${slug}/catalog`} className="active" style={{ color: themeColor, fontWeight: 600 }}>Catalog</Link>
                        </nav>
                        <button className="icon-btn" onClick={() => setShowWishlist(true)} title="Wishlist" style={{ color: themeColor }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            {wishlist.length > 0 && <span className="wishlist-count" style={{ background: accentColor }}>{wishlist.length}</span>}
                        </button>
                        <button className="menu-btn" onClick={() => setMobileMenuOpen(true)} style={{ color: themeColor }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <>
                    <div className="menu-overlay" onClick={() => setMobileMenuOpen(false)} />
                    <div className="mobile-menu">
                        <div className="menu-header">
                            <h3>Menu</h3>
                            <button onClick={() => setMobileMenuOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="menu-links">
                            <Link href={`/store/${slug}`} onClick={() => setMobileMenuOpen(false)}>Home</Link>
                            <Link href={`/store/${slug}/catalog`} className="active" onClick={() => setMobileMenuOpen(false)}>Catalog</Link>
                        </div>
                        <div className="menu-categories">
                            <h4>Categories</h4>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        const element = document.getElementById(`category-${cat.id}`);
                                        if (element) {
                                            element.scrollIntoView({ behavior: 'smooth' });
                                            setMobileMenuOpen(false);
                                        }
                                    }}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                        <div className="menu-footer">
                            <a href={`${baseUrl}/auth/login`} style={{ color: themeColor }}>Admin Login</a>
                        </div>
                    </div>
                </>
            )}

            {/* Wishlist Drawer */}
            {showWishlist && (
                <>
                    <div className="wishlist-overlay" onClick={() => setShowWishlist(false)} />
                    <div className="wishlist-drawer">
                        <div className="drawer-header">
                            <h3>Wishlist ({wishlist.length})</h3>
                            <button onClick={() => setShowWishlist(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        {wishlist.length === 0 ? (
                            <div className="empty-wishlist"><p>Your wishlist is empty</p></div>
                        ) : (
                            <>
                                <div className="wishlist-items">
                                    {wishlist.map((item) => (
                                        <div key={item.id} className="wishlist-item">
                                            <div className="item-image">
                                                {item.image_url && <Image src={item.image_url} alt={item.name} fill style={{ objectFit: 'cover' }} />}
                                            </div>
                                            <div className="item-info">
                                                <span className="item-name">{item.name}</span>
                                                <span className="item-price">{formatPrice(item.price, item.price_type)}</span>
                                            </div>
                                            <button className="remove-item" onClick={() => setWishlist(wishlist.filter((i) => i.id !== item.id))}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button className="send-whatsapp-btn" onClick={sendWishlistToWhatsApp}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    Send All to WhatsApp
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}

            <main className="catalog-main">
                <div className="search-section">
                    <h1>Catalog</h1>
                    <form onSubmit={handleSearch} className="search-form">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <button type="submit" className="search-btn" style={{ background: themeColor }}>
                            {searching ? '...' : 'Search'}
                        </button>
                        {searchResults !== null && (
                            <button type="button" onClick={clearSearch} className="clear-btn">
                                Clear
                            </button>
                        )}
                    </form>
                </div>

                {searchResults !== null ? (
                    <div className="search-results">
                        <h2>Search Results ({searchResults.length})</h2>
                        {searchResults.length === 0 ? (
                            <div className="no-results">
                                <p>No products found matching "{searchQuery}"</p>
                                <button onClick={clearSearch} style={{ color: themeColor }}>View all products</button>
                            </div>
                        ) : (
                            <div className="products-grid">
                                {searchResults.map((product) => (
                                    <CatalogProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="categories-list">
                        {categories.map((category) => {
                            const categoryProducts = products.filter(p => p.category_id === category.id);
                            if (categoryProducts.length === 0) return null;

                            return (
                                <section key={category.id} id={`category-${category.id}`} className="category-section">
                                    <h2 className="category-title">{category.name}</h2>
                                    <div className="products-grid">
                                        {categoryProducts.map((product) => (
                                            <CatalogProductCard key={product.id} product={product} />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}

                        {/* Uncategorized Products if any */}
                        {products.filter(p => !p.category_id).length > 0 && (
                            <section className="category-section">
                                <h2 className="category-title">Other Products</h2>
                                <div className="products-grid">
                                    {products.filter(p => !p.category_id).map((product) => (
                                        <CatalogProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>

            <style jsx>{`
                .catalog-page { min-height: 100vh; background: white; }
                
                :global(.store-header) { background: white; border-bottom: 1px solid #E5E7EB; position: sticky; top: 0; z-index: 40; }
                :global(.header-content) { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; height: 70px; max-width: 1400px; margin: 0 auto; width: 100%; }
                :global(.store-name) { font-family: 'Playfair Display', serif !important; font-size: 1.5rem !important; font-weight: 700 !important; text-decoration: none !important; }
                
                .header-actions { display: flex; align-items: center; gap: 1rem; }
                .desktop-nav { display: none; gap: 2rem; margin-right: 1.5rem; }
                .desktop-nav a { text-decoration: none; font-size: 0.95rem; }
                @media (min-width: 768px) { .desktop-nav { display: flex; } .menu-btn { display: none; } }
                
                 :global(.icon-btn) { position: relative; padding: 0.5rem; background: none; border: none; cursor: pointer; transition: opacity 0.2s ease; display: flex; }
                 :global(.icon-btn:hover) { opacity: 0.7; }
                 :global(.wishlist-count) { position: absolute; top: 0; right: 0; width: 18px; height: 18px; color: white; font-size: 0.6875rem; font-weight: 600; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

                .menu-btn { background: none; border: none; cursor: pointer; }
                
                 :global(.menu-overlay), :global(.wishlist-overlay) { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; backdrop-filter: blur(2px); }
                :global(.mobile-menu) { position: fixed; top: 0; right: 0; bottom: 0; width: 300px; background: white; z-index: 60; display: flex; flex-direction: column; animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: -4px 0 20px rgba(0,0,0,0.1) !important; }
               
                :global(.menu-header) { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #F3F4F6; }
                .menu-links { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; border-bottom: 1px solid #F3F4F6; }
                .menu-links a { text-decoration: none; color: #1F2937; font-size: 1.1rem; }
                .menu-links a.active { font-weight: 600; }

                .menu-categories { flex: 1; padding: 0 1.5rem; overflow-y: auto; padding-top: 1.5rem; }
                .menu-categories h4 { font-size: 0.75rem; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; font-weight: 600; }
                .menu-categories button { display: block; width: 100%; text-align: left; padding: 0.875rem 0; font-size: 1rem; background: none; border: none; border-bottom: 1px solid #F3F4F6; cursor: pointer; color: #374151; transition: color 0.2s ease; }
                .menu-footer { padding: 1.5rem; border-top: 1px solid #F3F4F6; background: #F9FAFB; }
                .menu-footer a { font-size: 0.875rem; text-decoration: none; font-weight: 500; }

                /* Wishlist Drawer Styles - Duplicated from Store Page */
                :global(.wishlist-drawer) { position: fixed; top: 0; right: 0; bottom: 0; width: 400px; max-width: 100%; background: white; z-index: 60; display: flex; flex-direction: column; animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: -4px 0 20px rgba(0,0,0,0.1) !important; }
                :global(.drawer-header) { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #F3F4F6; }
                :global(.drawer-header h3) { font-size: 1.25rem; font-weight: 600; font-family: 'Playfair Display', serif; }
                :global(.drawer-header button) { background: none; border: none; cursor: pointer; color: #6B7280; padding: 0.5rem; margin: -0.5rem; }
                :global(.empty-wishlist) { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #9CA3AF; }
                :global(.wishlist-items) { flex: 1; overflow-y: auto; padding: 1.5rem; }
                :global(.wishlist-item) { display: flex; gap: 1rem; align-items: center; padding: 1rem; border: 1px solid #F3F4F6; border-radius: 0.75rem !important; margin-bottom: 1rem; transition: border-color 0.2s ease !important; }
                :global(.wishlist-item:hover) { border-color: #E5E7EB; }
                :global(.item-image) { position: relative; width: 70px; height: 70px; border-radius: 0.5rem !important; overflow: hidden; background: #F3F4F6; flex-shrink: 0; }
                :global(.item-info) { flex: 1; }
                :global(.item-name) { display: block; font-size: 0.9375rem; font-weight: 500; margin-bottom: 0.25rem; color: #1F2937; }
                :global(.item-price) { font-size: 0.875rem; color: #6B7280; }
                :global(.remove-item) { padding: 0.5rem; background: none; border: none; color: #9CA3AF; cursor: pointer; border-radius: 0.375rem !important; transition: all 0.2s ease !important; }
                :global(.remove-item:hover) { background: #FEE2E2 !important; color: #EF4444 !important; }
                :global(.send-whatsapp-btn) { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin: 1.5rem; padding: 1rem; background: #25D366; color: white; border: none; border-radius: 0.75rem !important; font-size: 1rem; font-weight: 600; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease !important; }
                :global(.send-whatsapp-btn:hover) { transform: translateY(-2px) !important; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3) !important; }


                .catalog-main { max-width: 1100px; margin: 0 auto; padding: 2rem 1rem; }
                @media (min-width: 768px) { .catalog-main { padding: 4rem 2rem; } }

                .search-section { text-align: center; margin-bottom: 3rem; }
                .search-section h1 { font-family: 'Playfair Display', serif; font-size: 2.5rem; margin-bottom: 1.5rem; color: #1A1A2E; }
                .search-form { display: flex; max-width: 500px; margin: 0 auto; gap: 0.5rem; }
                .search-input { flex: 1; padding: 0.75rem 1rem; border: 1px solid #E5E7EB; border-radius: 0.5rem; outline: none; transition: border-color 0.2s; }
                .search-input:focus { border-color: #9CA3AF; }
                .search-btn, .clear-btn { padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; color: white; cursor: pointer; font-weight: 500; }
                .clear-btn { background: #E5E7EB; color: #374151; }

                .category-section { margin-bottom: 4rem; scroll-margin-top: 100px; }
                .category-title { font-family: 'Playfair Display', serif; font-size: 1.75rem; margin-bottom: 1.5rem; color: #1A1A2E; border-bottom: 1px solid #E5E7EB; padding-bottom: 0.5rem; }
                
                .products-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
                @media (min-width: 768px) { .products-grid { grid-template-columns: repeat(4, 1fr); gap: 1.5rem; } }

                .no-results { text-align: center; padding: 4rem; background: #F9FAFB; border-radius: 1rem; }
                .no-results p { color: #6B7280; margin-bottom: 1rem; font-size: 1.1rem; }
                .no-results button { background: none; border: none; text-decoration: underline; cursor: pointer; font-weight: 600; }

                /* Card Styles */
                :global(.product-card) { background: white; border-radius: 0.75rem; overflow: hidden; text-decoration: none; transition: box-shadow 0.25s ease; cursor: pointer; display: flex; flex-direction: column; box-shadow: 0 10px 28px rgba(0,0,0,0.1); }
                :global(.product-card:hover) { box-shadow: 0 16px 40px rgba(0,0,0,0.15); }
                
                 :global(.product-image-wrapper) { position: relative; background: #F8F9FA; }

                :global(.product-image) { position: relative; width: 100%; aspect-ratio: 1; background: #f4f5f7; overflow: hidden; }
                :global(.product-image img) { transition: transform 0.35s ease; }
                :global(.product-card:hover .product-image img) { transform: scale(1.1); }
                
                :global(.wishlist-btn) { 
                    position: absolute; 
                    top: 0.5rem;
                    right: 0.5rem;
                    width: 32px;
                    height: 32px;
                    background: white !important; 
                    border: none !important; 
                    border-radius: 50% !important; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    cursor: pointer; 
                    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                    color: #6B7280 !important; 
                    z-index: 10; 
                    transition: all 0.2s ease !important; 
                }
                :global(.wishlist-btn:hover) { 
                    transform: scale(1.1) !important; 
                    color: #EF4444 !important; 
                }
                :global(.wishlist-btn.active) { 
                    color: #EF4444 !important; 
                    background: white !important; 
                }

                :global(.product-info) { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.15rem; }
                :global(.product-name) { font-size: 0.85rem; font-weight: 500; color: #1A1A2E; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                :global(.product-price) { font-size: 0.95rem; font-weight: 600; margin: 0; }
                
                .price-container { display: flex; align-items: center; }
                .sale-price-wrapper { display: flex; align-items: center; gap: 0.5rem; }
                .original-price { font-size: 0.85rem; text-decoration: line-through; color: #9CA3AF; }
                .sale-price { font-size: 0.95rem; font-weight: 600; }

                :global(.placeholder) { width: 100%; height: 100%; background: #E5E7EB; }
            `}</style>
        </div>
    );
}
