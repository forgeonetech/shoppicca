'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Store, Category, Product, ProductImage } from '@/lib/types/database';
import { formatPrice, generateWishlistWhatsAppUrl } from '@/lib/utils';

interface ProductWithImages extends Product {
    product_images: ProductImage[];
}

interface WishlistItem {
    id: string;
    name: string;
    price: number | null;
    price_type: 'fixed' | 'negotiable' | 'dm';
    image_url: string | null;
}

export default function StorePage() {
    const params = useParams();
    const slug = params.slug as string;
    const supabase = createClient();

    const [store, setStore] = useState<Store | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<ProductWithImages[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [showWishlist, setShowWishlist] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [baseUrl, setBaseUrl] = useState('https://shoppicca.vercel.app');

    useEffect(() => {
        if (window.location.hostname.includes('localhost')) {
            setBaseUrl('http://localhost:3000');
        }
    }, []);

    useEffect(() => {
        fetchStore();
        const saved = localStorage.getItem(`wishlist_${slug}`);
        if (saved) setWishlist(JSON.parse(saved));
    }, [slug]);

    useEffect(() => {
        localStorage.setItem(`wishlist_${slug}`, JSON.stringify(wishlist));
    }, [wishlist, slug]);

    const fetchStore = async () => {
        const { data: storeData, error } = await supabase
            .from('stores')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

        if (error || !storeData) {
            setNotFound(true);
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
            .eq('is_visible', true)
            .order('created_at', { ascending: false })
            .limit(8);
        setProducts(productsData || []);

        setLoading(false);
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

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const themeColor = store?.theme_color || '#1A1A2E';
    const accentColor = store?.accent_color || '#D4AF37';
    const fontColor = store?.font_color || '#1A1A2E';
    const headerFont = store?.header_font || 'Playfair Display';
    const bodyFont = store?.body_font || 'Inter';

    // Helper to format google fonts url
    const getFontUrl = () => {
        if (!store) return '';
        const fonts = [headerFont, bodyFont].map(f => f.replace(/ /g, '+'));
        return `https://fonts.googleapis.com/css2?family=${fonts[0]}:wght@400;500;600;700&family=${fonts[1]}:wght@300;400;500;600;700&display=swap`;
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', textAlign: 'center', padding: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Store Not Found</h1>
                <p style={{ color: '#6B7280' }}>The store you&apos;re looking for doesn&apos;t exist.</p>
                <a href={baseUrl} style={{ color: themeColor }}>Go to Shoppicca</a>
            </div>
        );
    }

    return (
        <>
            {store && <link href={getFontUrl()} rel="stylesheet" />}

            <style jsx global>{`
                :root {
                    --font-display: '${headerFont}', serif;
                    --font-body: '${bodyFont}', sans-serif;
                }
                .store-page {
                    font-family: '${bodyFont}', sans-serif;
                    color: ${fontColor};
                }
                .store-name, h1, h2, h3, h4 {
                    font-family: '${headerFont}', serif !important;
                }
                .category-nav button {
                    font-family: '${bodyFont}', sans-serif;
                }
            `}</style>
            <div className="store-page">
                {/* Header */}
                <header className="store-header">
                    <div className="header-content">
                        <Link href="#" className="store-name" style={{ color: themeColor }}>
                            {store?.logo_url ? (
                                <div style={{ position: 'relative', width: '120px', height: '50px' }}>
                                    <Image src={store.logo_url} alt={store.name} fill style={{ objectFit: 'contain', objectPosition: 'left' }} priority />
                                </div>
                            ) : (
                                store?.name
                            )}
                        </Link>
                        <div className="header-icons">
                            <button className="icon-btn" onClick={() => setShowWishlist(true)} title="Wishlist" style={{ color: themeColor }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                {wishlist.length > 0 && <span className="wishlist-count" style={{ background: accentColor }}>{wishlist.length}</span>}
                            </button>
                            <button className="icon-btn" onClick={() => setMobileMenuOpen(true)} title="Search" style={{ color: themeColor }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                            </button>
                            <button className="icon-btn menu-btn" onClick={() => setMobileMenuOpen(true)} title="Menu" style={{ color: themeColor }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="3" y1="12" x2="21" y2="12" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <line x1="3" y1="18" x2="21" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <nav className="category-nav">
                        <button className={`nav-item ${!selectedCategory ? 'active' : ''}`} onClick={() => setSelectedCategory(null)} style={{ color: !selectedCategory ? themeColor : '#4B5563' }}>
                            Home
                        </button>
                        {categories.slice(0, 4).map((cat) => (
                            <button key={cat.id} className={`nav-item ${selectedCategory === cat.id ? 'active' : ''}`} onClick={() => setSelectedCategory(cat.id)} style={{ color: selectedCategory === cat.id ? themeColor : '#4B5563' }}>
                                {cat.name}
                            </button>
                        ))}
                        <Link href={`/store/${slug}/catalog`} className="nav-itemCatalog" style={{ color: '#4B5563', textDecoration: 'none', padding: '0.5rem 0', fontSize: '0.9375rem' }}>
                            Catalog
                        </Link>
                        {categories.length > 4 && (
                            <button className="nav-item" onClick={() => setMobileMenuOpen(true)}>More</button>
                        )}
                    </nav>
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
                            <div className="search-box" style={{ borderColor: themeColor }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="menu-categories">
                                <h4>Categories</h4>
                                <button className={!selectedCategory ? 'active' : ''} onClick={() => { setSelectedCategory(null); setMobileMenuOpen(false); }} style={{ color: !selectedCategory ? themeColor : '#374151' }}>
                                    All Products
                                </button>
                                {categories.map((cat) => (
                                    <button key={cat.id} className={selectedCategory === cat.id ? 'active' : ''} onClick={() => { setSelectedCategory(cat.id); setMobileMenuOpen(false); }} style={{ color: selectedCategory === cat.id ? themeColor : '#374151' }}>
                                        {cat.name}
                                    </button>
                                ))}
                                <Link href={`/store/${slug}/catalog`} className="mobile-catalog-link" style={{ display: 'block', padding: '0.875rem 0', fontSize: '1rem', borderBottom: '1px solid #F3F4F6', color: '#374151', textDecoration: 'none' }}>
                                    Catalog
                                </Link>
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

                <main>
                    {/* Banner */}
                    {store?.banner_url && (
                        <div className="banner-container">
                            <div className="banner">
                                <Image src={store.banner_url} alt={store.name} fill style={{ objectFit: 'cover' }} priority />
                            </div>
                        </div>
                    )}

                    {/* Categories Section */}
                    {categories.length > 0 && (
                        <section className="categories-section">
                            <div className="section-header">
                                <h2>Browse Categories</h2>
                                <Link href={`/store/${slug}/catalog`} className="view-more" style={{ color: '#6B7280' }}>View All →</Link>
                            </div>
                            <div className="categories-grid">
                                {categories.slice(0, 4).map((cat) => (
                                    <Link key={cat.id} href={`/store/${slug}/catalog?category=${cat.id}`} className="category-card">
                                        <div className="category-image">
                                            {cat.category_url ? (
                                                <Image src={cat.category_url} alt={cat.name} fill style={{ objectFit: 'contain' }} />
                                            ) : (
                                                <div className="placeholder"></div>
                                            )}
                                        </div>
                                        <h3 className="category-name">{cat.name}</h3>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Products Section */}
                    <section className="products-section">
                        <div className="section-header">
                            <h2>{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Featured Products'}</h2>
                            <Link href={`/store/${slug}/catalog`} className="view-more" style={{ color: '#6B7280' }}>View All Products →</Link>
                        </div>
                        {filteredProducts.length === 0 ? (
                            <div className="empty-products"><p>No products found</p></div>
                        ) : (
                            <div className="products-grid">
                                {filteredProducts.map((product) => (
                                    <Link key={product.id} href={`/store/${slug}/product/${product.id}`} className="product-card">
                                        <div className="product-image-wrapper">
                                            <button className={`wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                </svg>
                                            </button>
                                            <div className="product-image">
                                                {product.product_images?.[0] ? (
                                                    <Image src={product.product_images[0].image_url} alt={product.name} fill style={{ objectFit: 'cover' }} />
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
                                ))}
                            </div>
                        )}
                    </section>
                </main>

                {/* Footer */}
                <footer className="store-footer">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <h3>{store?.name}</h3>
                            <p>{store?.description}</p>
                        </div>
                        {(store?.instagram_url || store?.snapchat_url || store?.linkedin_url || store?.whatsapp_number) && (
                            <div className="footer-social">
                                {store.whatsapp_number && (
                                    <a href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                    </a>
                                )}
                                {store.instagram_url && (
                                    <a href={store.instagram_url} target="_blank" rel="noopener">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </a>
                                )}
                                {store.linkedin_url && (
                                    <a href={store.linkedin_url} target="_blank" rel="noopener">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="footer-bottom">
                        <p>Powered by <a href={baseUrl} style={{ fontFamily: "'Cookie', cursive", fontWeight: 400, fontSize: '2rem', textDecoration: 'none' }}>Shoppicca</a></p>
                    </div>
                </footer>
            </div>

            <style jsx>{`
        /* CRITICAL: Use global styles to ensure specificity */
        :global(.store-page) { 
            min-height: 100vh; 
            background: white;
        }

        /* Header */
        :global(.store-header) { background: white; border-bottom: 1px solid #E5E7EB; position: sticky; top: 0; z-index: 40; }
        :global(.header-content) { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; height: 70px; max-width: 1400px; margin: 0 auto; width: 100%; }
        :global(.store-name) { font-family: 'Playfair Display', serif !important; font-size: 2rem !important; font-weight: 700 !important; text-decoration: none !important; letter-spacing: -0.02em !important; }
        :global(.header-icons) { display: flex; gap: 0.5rem; }
        :global(.icon-btn) { position: relative; padding: 0.5rem; background: none; border: none; cursor: pointer; transition: opacity 0.2s ease; }
        :global(.icon-btn:hover) { opacity: 0.7; }
        :global(.wishlist-count) { position: absolute; top: 0; right: 0; width: 18px; height: 18px; color: white; font-size: 0.6875rem; font-weight: 600; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        :global(.category-nav) { display: flex; gap: 1.5rem; padding: 0 1.5rem 1rem; overflow-x: auto; justify-content: flex-start; border-bottom: 1px solid #F3F4F6; max-width: 1400px; margin: 0 auto; width: 100%; }
        @media (min-width: 768px) {
            :global(.header-content) { padding: 1rem 2rem; }
            :global(.category-nav) { padding: 0 2rem 1rem; justify-content: center; border-bottom: none; }
        }
        :global(.category-nav::-webkit-scrollbar) { display: none; }
        :global(.nav-item) { padding: 0.5rem 0; font-size: 0.9375rem; background: none; border: none; cursor: pointer; white-space: nowrap; transition: color 0.2s ease; position: relative; }
        :global(.nav-item:hover) { opacity: 0.8; }
        :global(.nav-item.active::after) { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: currentColor; border-radius: 2px; }

        /* Mobile Menu & Overlays */
        :global(.menu-overlay), :global(.wishlist-overlay) { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; backdrop-filter: blur(2px); }
        :global(.mobile-menu) { position: fixed; top: 0; right: 0; bottom: 0; width: 300px; background: white; z-index: 60; display: flex; flex-direction: column; animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: -4px 0 20px rgba(0,0,0,0.1) !important; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        :global(.menu-header) { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #F3F4F6; }
        :global(.menu-header h3) { font-size: 1.25rem; font-weight: 600; font-family: 'Playfair Display', serif; }
        :global(.menu-header button) { background: none; border: none; cursor: pointer; color: #6B7280; padding: 0.5rem; margin: -0.5rem; }
        :global(.search-box) { display: flex; align-items: center; gap: 0.75rem; margin: 1.5rem; padding: 0.875rem 1rem; background: #F9FAFB; border-radius: 0.75rem !important; border: 1px solid #E5E7EB; transition: all 0.2s ease !important; }
        :global(.search-box:focus-within) { box-shadow: 0 0 0 3px rgba(0,0,0,0.05) !important; background: white; }
        :global(.search-box input) { flex: 1; background: none; border: none; outline: none; font-size: 0.9375rem; width: 100%; }
        :global(.menu-categories) { flex: 1; padding: 0 1.5rem; overflow-y: auto; }
        :global(.menu-categories h4) { font-size: 0.75rem; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; font-weight: 600; }
        :global(.menu-categories button) { display: block; width: 100%; text-align: left; padding: 0.875rem 0; font-size: 1rem; background: none; border: none; border-bottom: 1px solid #F3F4F6; cursor: pointer; transition: color 0.2s ease; }
        :global(.menu-footer) { padding: 1.5rem; border-top: 1px solid #F3F4F6; background: #F9FAFB; }
        :global(.menu-footer a) { font-size: 0.875rem; text-decoration: none; font-weight: 500; }

        /* Wishlist Drawer */
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

        /* Banner */
        :global(.banner-container) { padding: 0; max-width: 1400px; margin: 0 auto; width: 100%; }
        @media (min-width: 768px) { :global(.banner-container) { padding: 2rem; } }
        :global(.banner) { position: relative; width: 100%; height: 300px; border-radius: 0; overflow: hidden; box-shadow: none; transform: translateZ(0); }
        @media (min-width: 768px) { :global(.banner) { height: 400px; border-radius: 1.5rem !important; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1) !important; } }
        @media (min-width: 1024px) { :global(.banner) { height: 500px; } }

        /* ============================================ */
        /* CATEGORIES SECTION */
        /* ============================================ */
        :global(.categories-section) { 
            padding: 2rem 1rem; 
            max-width: 1100px; 
            margin: 0 auto; 
            width: 100%; 
            background: white;
        }
        @media (min-width: 768px) { 
            :global(.categories-section) { padding: 4rem 2rem; } 
        }
        
        :global(.section-header) { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 1.5rem; 
        }
        
        :global(.section-header h2) { 
            font-family: 'Playfair Display', serif !important; 
            font-size: 1.75rem !important; 
            font-weight: 600 !important; 
            color: #1A1A2E !important; 
        }
        @media (min-width: 768px) { 
            :global(.section-header h2) { font-size: 2rem !important; } 
        }
        
        :global(.view-more) { 
            display: flex; 
            align-items: center; 
            gap: 0.25rem; 
            font-size: 0.875rem; 
            font-weight: 500; 
            text-decoration: none; 
            transition: color 0.2s ease; 
        }
        :global(.view-more:hover) { opacity: 0.7; }

        /* CATEGORY GRID */
        :global(.categories-grid) {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }

        @media (min-width: 768px) {
            :global(.categories-grid) {
                grid-template-columns: repeat(4, 1fr);
                gap: 1.5rem;
            }
        }

        /* CATEGORY CARD - EDIT SIZE HERE */
        :global(.category-card) {
            background: #ffffff !important;
            border-radius: 0.75rem !important;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
            transition: box-shadow 0.25s ease;
            text-decoration: none !important;
            cursor: pointer;
            display: flex;
            flex-direction: column;
        }

        :global(.category-card:hover) {
            box-shadow: 0 12px 32px rgba(0,0,0,0.12);
        }

        /* CATEGORY IMAGE - EDIT IMAGE SIZE/ASPECT RATIO HERE */
        /* Image area – short & wide like the reference */
        :global(.category-image) {
            position: relative;
            width: 100%;
            aspect-ratio: 4 / 3;
            background: #f4f5f7;
            overflow: hidden;
        }

        :global(.category-image img) {
            object-fit: contain !important;
            transition: transform 0.35s ease;
        }

        :global(.category-card:hover .category-image img) {
            transform: scale(1.08);
        }

        /* CATEGORY NAME */
        :global(.category-name) {
            padding: 0.75rem;
            font-size: 0.9rem;
            font-weight: 500;
            text-align: center;
            color: #1f2937;
        }

        :global(.placeholder) { 
            width: 100%; 
            height: 100%; 
            background: #E5E7EB; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: #9CA3AF; 
        }

        /* ============================================ */
        /* PRODUCTS SECTION */
        /* ============================================ */
        /* ============================================ */
        /* PRODUCTS SECTION */
        /* ============================================ */
        :global(.products-section) { 
            padding: 2rem 1rem; 
            max-width: 1100px; 
            margin: 0 auto; 
            width: 100%; 
            background: white;
        }
        @media (min-width: 768px) { 
            :global(.products-section) { padding: 4rem 2rem; } 
        }

        /* PRODUCTS GRID - EDIT COLUMNS/SPACING HERE */
        /* PRODUCTS GRID */
        :global(.products-grid) {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }

        @media (min-width: 768px) {
            :global(.products-grid) {
                grid-template-columns: repeat(4, 1fr);
                gap: 1.5rem;
            }
        }

        /* PRODUCT CARD - EDIT CARD STYLE HERE */
        /* Smaller, tighter cards (≈20% reduction) */
        :global(.product-card) {
            background: #ffffff !important;
            border-radius: 0.75rem !important;
            overflow: hidden;
            box-shadow: 0 10px 28px rgba(0,0,0,0.1);
            transition: box-shadow 0.25s ease;
            text-decoration: none !important;
            cursor: pointer;
            display: flex;
            flex-direction: column;
        }

        :global(.product-card:hover) {
            box-shadow: 0 16px 40px rgba(0,0,0,0.15);
        }

        :global(.product-image-wrapper) {
            position: relative;
            background: #F8F9FA;
        }

        /* PRODUCT IMAGE - EDIT IMAGE SIZE/ASPECT RATIO HERE */
        /* Image container */
        :global(.product-image) {
            position: relative;
            width: 100%;
            aspect-ratio: 1 / 1;
            background: #f4f5f7;
            overflow: hidden;
        }

        /* Hover zoom ONLY image */
        :global(.product-image img) {
            object-fit: contain !important;
            transition: transform 0.35s ease;
        }

        :global(.product-card:hover .product-image img) {
            transform: scale(1.1);
        }

        /* WISHLIST BUTTON */
        /* Wishlist button – matches image placement */
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

        /* PRODUCT INFO - EDIT TEXT SPACING HERE */
        :global(.product-info) {
            padding: 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
        }

        :global(.product-name) {
            font-size: 0.85rem !important;
            font-weight: 500 !important;
            color: #1A1A2E !important; 
            margin: 0 !important;
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis; 
        }

        :global(.product-price) {
            font-size: 0.95rem !important;
            font-weight: 600 !important;
            margin: 0 !important;
        }

        .price-container { display: flex; align-items: center; }
        .sale-price-wrapper { display: flex; align-items: center; gap: 0.5rem; }
        .original-price { font-size: 0.85rem; text-decoration: line-through; color: #9CA3AF; }
        .sale-price { font-size: 0.95rem; font-weight: 600; }

        :global(.empty-products) { 
            text-align: center; 
            padding: 4rem 1rem; 
            color: #9CA3AF; 
            background: #F9FAFB; 
            border-radius: 1rem !important; 
            grid-column: 1 / -1; 
        }

        /* Footer */
        :global(.store-footer) { background: #1A1A2E; color: white; padding: 4rem 1rem 2rem; margin-top: 4rem; }
        :global(.footer-content) { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem; align-items: center; text-align: center; }
        @media (min-width: 768px) { :global(.footer-content) { flex-direction: row; justify-content: space-between; text-align: left; } }
        :global(.footer-brand h3) { font-family: 'Playfair Display', serif; font-size: 1.75rem; margin-bottom: 0.75rem; }
        :global(.footer-brand p) { font-size: 0.9375rem; color: rgba(255,255,255,0.7); max-width: 320px; line-height: 1.6; }
        :global(.footer-social) { display: flex; gap: 1.25rem; }
        :global(.footer-social a) { color: rgba(255,255,255,0.6); transition: all 0.2s ease !important; }
        :global(.footer-social a:hover) { color: white !important; transform: translateY(-2px) !important; }
        :global(.footer-bottom) { text-align: center; padding-top: 2rem; margin-top: 3rem; border-top: 1px solid rgba(255,255,255,0.1); }
        :global(.footer-bottom p) { font-size: 0.875rem; color: rgba(255,255,255,0.5); }
        :global(.footer-bottom a) { color: white; text-decoration: none; font-weight: 500; transition: opacity 0.2s ease; }
        :global(.footer-bottom a:hover) { opacity: 0.8; }
      `}</style>
        </>
    );
}