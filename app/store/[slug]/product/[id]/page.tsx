'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Store, Product, ProductImage, ProductAttribute } from '@/lib/types/database';
import { formatPrice, generateProductWhatsAppUrl } from '@/lib/utils'; // Assumed utilities

interface ProductWithDetails extends Product {
    product_images: ProductImage[];
    product_attributes: ProductAttribute[];
}

export default function ProductPage() {
    const params = useParams();
    const slug = params.slug as string;
    const productId = params.id as string;
    const supabase = createClient();

    const [store, setStore] = useState<Store | null>(null);
    const [product, setProduct] = useState<ProductWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [slug, productId]);

    const fetchData = async () => {
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

        const { data: productData } = await supabase
            .from('products')
            .select('*, product_images(*), product_attributes(*)')
            .eq('id', productId)
            .eq('store_id', storeData.id)
            .maybeSingle();

        if (productData) {
            setProduct(productData);
        }
        setLoading(false);
    };

    const handleShare = async () => {
        if (!product || !store) return;

        const shareData = {
            title: product.name,
            text: `Check out this product from ${store.name}`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        }
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

    if (!product || !store) {
        return (
            <div className="not-found">
                <h1>Product Not Found</h1>
                <Link href={`/store/${slug}`} className="back-link">Back to Store</Link>
                <style jsx>{`
                    .not-found { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; }
                    .back-link { color: #4B5563; text-decoration: underline; }
                `}</style>
            </div>
        );
    }

    const images = product.product_images.sort((a, b) => a.position - b.position);
    const attributes = product.product_attributes;
    const themeColor = store.theme_color || '#1A1A2E';
    const fontColor = store.font_color || '#1A1A2E';
    const headerFont = store.header_font || 'Playfair Display';
    const bodyFont = store.body_font || 'Inter';

    // Helper to format google fonts url
    const getFontUrl = () => {
        const fonts = [headerFont, bodyFont].map(f => f.replace(/ /g, '+'));
        return `https://fonts.googleapis.com/css2?family=${fonts[0]}:wght@400;500;600;700&family=${fonts[1]}:wght@300;400;500;600;700&display=swap`;
    };

    return (
        <div className="product-page">
            <link href={getFontUrl()} rel="stylesheet" />
            <style jsx global>{`
                :root {
                    --font-display: '${headerFont}', serif;
                    --font-body: '${bodyFont}', sans-serif;
                }
                .product-page {
                    font-family: '${bodyFont}', sans-serif;
                    color: ${fontColor};
                }
                .product-title, .store-name, h1, h2, h3, h4 {
                    font-family: '${headerFont}', serif !important;
                }
                .menu-links a, .breadcrumbs, .attr-value {
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
                    <nav className="desktop-nav">
                        <Link href={`/store/${slug}`} style={{ color: themeColor }}>Home</Link>
                        <Link href={`/store/${slug}/catalog`} style={{ color: themeColor }}>Catalog</Link>
                    </nav>
                    <button className="menu-btn" onClick={() => setMobileMenuOpen(true)} style={{ color: themeColor }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
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
                            <Link href={`/store/${slug}/catalog`} onClick={() => setMobileMenuOpen(false)}>Catalog</Link>
                        </div>
                    </div>
                </>
            )}

            <main className="product-main">
                <div className="product-grid">
                    {/* Image Gallery */}
                    <div className="gallery-section">
                        <div className="main-image">
                            {images[selectedImage] ? (
                                <Image
                                    src={images[selectedImage].image_url}
                                    alt={product.name}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    priority
                                />
                            ) : (
                                <div className="placeholder">No Image</div>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="thumbnails">
                                {images.map((img, index) => (
                                    <button
                                        key={img.id}
                                        className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(index)}
                                    >
                                        <Image src={img.image_url} alt="" fill style={{ objectFit: 'cover' }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="info-section">
                        <nav className="breadcrumbs">
                            <Link href={`/store/${slug}`}>Store</Link>
                            <span>/</span>
                            <Link href={`/store/${slug}/catalog`}>Catalog</Link>
                            <span>/</span>
                            <span className="current">{product.name}</span>
                        </nav>

                        <h1 className="product-title">{product.name}</h1>

                        <div className="price-share-row">
                            {product.sale_price ? (
                                <div className="sale-price-wrapper">
                                    <span className="original-price">{formatPrice(product.price, product.price_type)}</span>
                                    <span className="sale-price" style={{ color: themeColor }}>{formatPrice(product.sale_price, 'fixed')}</span>
                                </div>
                            ) : (
                                <p className="product-price" style={{ color: themeColor }}>
                                    {formatPrice(product.price, product.price_type)}
                                </p>
                            )}
                            <button className="share-btn" onClick={handleShare} aria-label="Share product">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                </svg>
                                Share
                            </button>
                        </div>

                        {product.description && (
                            <div className="description">
                                <h3>Description</h3>
                                <p>{product.description}</p>
                            </div>
                        )}

                        {attributes.length > 0 && (
                            <div className="attributes">
                                <h3>Details</h3>
                                <div className="attributes-grid">
                                    {attributes.map((attr) => (
                                        <div key={attr.id} className="attribute-item">
                                            <span className="attr-label">{attr.key}</span>
                                            <span className="attr-value">{attr.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {store.whatsapp_number && (
                            <a
                                href={generateProductWhatsAppUrl(
                                    store.whatsapp_number,
                                    product.name,
                                    product.price,
                                    product.price_type
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="whatsapp-cta"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Order on WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </main>

            <footer className="store-footer">
                <div className="footer-content">
                    <p>© {new Date().getFullYear()} {store.name}</p>
                </div>
            </footer>

            <style jsx>{`
                .product-page { min-height: 100vh; background: white; }
                
                :global(.store-header) { background: white; border-bottom: 1px solid #E5E7EB; position: sticky; top: 0; z-index: 40; }
                :global(.header-content) { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; height: 70px; max-width: 1400px; margin: 0 auto; width: 100%; }
                :global(.store-name) { font-family: 'Playfair Display', serif !important; font-size: 1.5rem !important; font-weight: 700 !important; text-decoration: none !important; }

                .desktop-nav { display: none; gap: 2rem; }
                .desktop-nav a { text-decoration: none; font-size: 0.95rem; }
                @media (min-width: 768px) { .desktop-nav { display: flex; } .menu-btn { display: none; } }
                
                .menu-btn { background: none; border: none; cursor: pointer; }
                 :global(.menu-overlay) { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; backdrop-filter: blur(2px); }
                :global(.mobile-menu) { position: fixed; top: 0; right: 0; bottom: 0; width: 300px; background: white; z-index: 60; display: flex; flex-direction: column; animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: -4px 0 20px rgba(0,0,0,0.1) !important; }
                :global(.menu-header) { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #F3F4F6; }
                .menu-links { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
                .menu-links a { text-decoration: none; color: #1F2937; font-size: 1.1rem; }

                .product-main { max-width: 1200px; margin: 0 auto; padding: 0; }
                @media (min-width: 768px) { .product-main { padding: 3rem 2rem; } }

                .product-grid { display: grid; grid-template-columns: 1fr; gap: 0; }
                @media (min-width: 768px) { .product-grid { grid-template-columns: 1.2fr 1fr; gap: 4rem; align-items: start; } }

                .gallery-section { background: #f4f5f7; }
                @media (min-width: 768px) { .gallery-section { background: transparent; position: sticky; top: 100px; } }
                
                .main-image { position: relative; width: 100%; aspect-ratio: 1; background: #fff; overflow: hidden; }
                @media (min-width: 768px) { .main-image { border-radius: 1rem; overflow: hidden; border: 1px solid #F3F4F6; } }

                .thumbnails { display: flex; gap: 0.75rem; padding: 1rem; overflow-x: auto; scrollbar-width: none; }
                .thumbnails::-webkit-scrollbar { display: none; }
                .thumbnail { position: relative; width: 70px; height: 70px; border: 2px solid transparent; border-radius: 0.5rem; overflow: hidden; cursor: pointer; flex-shrink: 0; padding: 0; }
                .thumbnail.active { border-color: #1A1A2E; }

                .info-section { padding: 1.5rem; }
                @media (min-width: 768px) { .info-section { padding: 0; } }

                .breadcrumbs { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #6B7280; margin-bottom: 1.5rem; flex-wrap: wrap; }
                .breadcrumbs a { color: #6B7280; text-decoration: none; transition: color 0.2s; }
                .breadcrumbs a:hover { color: #1A1A2E; }
                .breadcrumbs .current { color: #1A1A2E; font-weight: 500; }

                .product-title { font-family: 'Playfair Display', serif !important; font-size: 2rem !important; font-weight: 700; color: #1A1A2E; margin-bottom: 0.5rem; line-height: 1.2; }
                @media (min-width: 768px) { .product-title { font-size: 2.5rem !important; } }

                .price-share-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #F3F4F6; }
                .product-price { font-size: 1.5rem; font-weight: 600; margin: 0; }
                
                .sale-price-wrapper { display: flex; align-items: center; gap: 1rem; }
                .original-price { font-size: 1.25rem; text-decoration: line-through; color: #9CA3AF; }
                .sale-price { font-size: 1.5rem; font-weight: 600; }
                
                .share-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid #E5E7EB; border-radius: 2rem; background: white; color: #374151; font-weight: 500; cursor: pointer; transition: all 0.2s ease; }
                .share-btn:hover { background: #F9FAFB; border-color: #D1D5DB; }

                .description { margin-bottom: 2.5rem; }
                .description h3 { font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9CA3AF; margin-bottom: 1rem; }
                .description p { line-height: 1.8; color: #4B5563; font-size: 1rem; }

                .attributes { margin-bottom: 2.5rem; }
                .attributes h3 { font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9CA3AF; margin-bottom: 1rem; }
                .attributes-grid { display: grid; gap: 1rem; }
                .attribute-item { display: grid; grid-template-columns: 120px 1fr; gap: 1rem; align-items: baseline; font-size: 0.9375rem; padding-bottom: 0.75rem; border-bottom: 1px solid #F3F4F6; }
                .attr-label { color: #6B7280; }
                .attr-value { color: #1A1A2E; font-weight: 500; }

                .whatsapp-cta { display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; padding: 1.25rem; background: #25D366; color: white; text-decoration: none; border-radius: 0.75rem; font-size: 1.125rem; font-weight: 600; transition: transform 0.2s ease, box-shadow 0.2s ease; margin-top: 1rem; }
                .whatsapp-cta:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3); }

                .placeholder { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #9CA3AF; background: #F3F4F6; }
                
                .store-footer { border-top: 1px solid #F3F4F6; padding: 2rem; margin-top: auto; text-align: center; color: #6B7280; font-size: 0.875rem; }
            `}</style>
        </div>
    );
}