'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Store, Product, ProductImage, ProductAttribute } from '@/lib/types/database';
import { formatPrice, generateProductWhatsAppUrl } from '@/lib/utils';

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

    useEffect(() => {
        fetchData();
    }, [slug, productId]);

    const fetchData = async () => {
        // Fetch store
        const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('slug', slug)
            .single();

        if (!storeData) {
            setLoading(false);
            return;
        }
        setStore(storeData);

        // Fetch product with images and attributes
        const { data: productData } = await supabase
            .from('products')
            .select('*, product_images(*), product_attributes(*)')
            .eq('id', productId)
            .eq('store_id', storeData.id)
            .single();

        if (productData) {
            setProduct(productData);
        }
        setLoading(false);
    };

    const themeColor = store?.theme_color || '#1A1A2E';
    const accentColor = store?.accent_color || '#D4AF37';

    if (loading) {
        return (
            <div className="loading-page">
                <div className="spinner"></div>
                <style jsx>{`
          .loading-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        `}</style>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="not-found">
                <h1>Product Not Found</h1>
                <Link href={`/store/${slug}`}>Back to Store</Link>
            </div>
        );
    }

    const images = product.product_images.sort((a, b) => a.position - b.position);
    const attributes = product.product_attributes;

    return (
        <div className="product-page">
            {/* Header */}
            <header className="page-header">
                <Link href={`/store/${slug}`} className="back-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </Link>
                <Link href={`/store/${slug}`} className="store-name">{store?.name}</Link>
                <div style={{ width: 40 }}></div>
            </header>

            <main>
                {/* Image Gallery */}
                <div className="image-section">
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

                {/* Product Details */}
                <div className="details-section">
                    <h1 className="product-name">{product.name}</h1>
                    <p className="product-price">{formatPrice(product.price, product.price_type)}</p>

                    {product.description && (
                        <div className="product-description">
                            <h2>Description</h2>
                            <p>{product.description}</p>
                        </div>
                    )}

                    {attributes.length > 0 && (
                        <div className="product-attributes">
                            <h2>Details</h2>
                            <div className="attributes-list">
                                {attributes.map((attr) => (
                                    <div key={attr.id} className="attribute">
                                        <span className="attr-key">{attr.key}</span>
                                        <span className="attr-value">{attr.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {store?.whatsapp_number && (
                        <a
                            href={generateProductWhatsAppUrl(
                                store.whatsapp_number,
                                product.name,
                                product.price,
                                product.price_type
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whatsapp-btn"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Contact on WhatsApp
                        </a>
                    )}
                </div>
            </main>

            <style jsx>{`
        .product-page { min-height: 100vh; background: white; }
        
        .page-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-bottom: 1px solid #E5E7EB; position: sticky; top: 0; background: white; z-index: 10; }
        .back-btn { padding: 0.5rem; color: ${themeColor}; }
        .store-name { font-family: 'Playfair Display', serif; font-size: 1.25rem; color: ${themeColor}; text-decoration: none; }

        main { max-width: 1200px; margin: 0 auto; }
        @media (min-width: 768px) { main { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2rem; } }

        .image-section { background: #F8F9FA; }
        .main-image { position: relative; aspect-ratio: 1; background: white; }
        .placeholder { display: flex; align-items: center; justify-content: center; height: 100%; color: #9CA3AF; }
        .thumbnails { display: flex; gap: 0.5rem; padding: 0.75rem; overflow-x: auto; }
        .thumbnail { position: relative; width: 60px; height: 60px; border: 2px solid transparent; border-radius: 0.5rem; overflow: hidden; cursor: pointer; flex-shrink: 0; }
        .thumbnail.active { border-color: ${themeColor}; }

        .details-section { padding: 1.5rem; }
        @media (min-width: 768px) { .details-section { padding: 0; } }
        .product-name { font-family: 'Playfair Display', serif; font-size: 1.75rem; margin-bottom: 0.5rem; color: #1A1A2E; }
        .product-price { font-size: 1.25rem; color: ${themeColor}; font-weight: 600; margin-bottom: 1.5rem; }

        .product-description, .product-attributes { margin-bottom: 1.5rem; }
        .product-description h2, .product-attributes h2 { font-size: 0.875rem; font-weight: 600; color: #6B7280; text-transform: uppercase; margin-bottom: 0.75rem; }
        .product-description p { color: #4B5563; line-height: 1.7; }

        .attributes-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .attribute { display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #F3F4F6; }
        .attr-key { color: #6B7280; font-size: 0.9375rem; }
        .attr-value { color: #1A1A2E; font-weight: 500; font-size: 0.9375rem; }

        .whatsapp-btn { display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; padding: 1rem; background: #25D366; color: white; text-decoration: none; border-radius: 0.5rem; font-size: 1rem; font-weight: 500; margin-top: 2rem; }
        .whatsapp-btn:hover { background: #128C7E; }

        .not-found { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; }
        .not-found a { color: ${themeColor}; }
      `}</style>
        </div>
    );
}
