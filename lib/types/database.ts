// Database Types for Shoppicca

export interface User {
    id: string;
    full_name: string;
    phone: string | null;
    email: string;
    created_at: string;
}

export interface Plan {
    id: string;
    name: 'free' | 'paid';
    price_cedis: number;
    category_limit: number | null; // null = unlimited
    products_per_category: number | null; // null = unlimited
    can_customize_theme: boolean;
    can_change_slug: boolean;
    created_at: string;
}

export interface Store {
    id: string;
    owner_id: string;
    name: string;
    slug: string;
    category: string | null;
    description: string | null;
    whatsapp_number: string | null;
    instagram_url: string | null;
    snapchat_url: string | null;
    linkedin_url: string | null;
    theme_color: string | null;
    accent_color: string | null;
    banner_url: string | null;
    plan_id: string | null;
    created_at: string;
}

export interface Subscription {
    id: string;
    store_id: string;
    plan_id: string;
    status: 'active' | 'expired';
    start_date: string;
    end_date: string | null;
    created_at: string;
}

export interface Category {
    id: string;
    store_id: string;
    name: string;
    category_url: string | null;
    created_at: string;
}

export interface Product {
    id: string;
    store_id: string;
    category_id: string | null;
    name: string;
    description: string | null;
    price: number | null;
    price_type: 'fixed' | 'negotiable' | 'dm';
    is_visible: boolean;
    created_at: string;
}

export interface ProductImage {
    id: string;
    product_id: string;
    image_url: string;
    position: number;
}

export interface ProductAttribute {
    id: string;
    product_id: string;
    key: string;
    value: string;
}

// Extended types with relations
export interface ProductWithDetails extends Product {
    images: ProductImage[];
    attributes: ProductAttribute[];
    category?: Category;
}

export interface StoreWithDetails extends Store {
    plan?: Plan;
    categories?: Category[];
    products?: ProductWithDetails[];
    subscription?: Subscription;
}

// Form types for creating/updating
export interface CreateStoreInput {
    name: string;
    slug: string;
    category?: string;
    description?: string;
    whatsapp_number: string;
    instagram_url?: string;
    snapchat_url?: string;
    linkedin_url?: string;
    theme_color?: string;
    accent_color?: string;
    plan_id: string;
}

export interface CreateProductInput {
    store_id: string;
    category_id?: string;
    name: string;
    description?: string;
    price?: number;
    price_type: 'fixed' | 'negotiable' | 'dm';
    is_visible?: boolean;
    images?: string[];
    attributes?: { key: string; value: string }[];
}

export interface CreateCategoryInput {
    store_id: string;
    name: string;
    category_url?: string;
}

// Wishlist item for client-side state
export interface WishlistItem {
    id: string;
    name: string;
    price: number | null;
    price_type: 'fixed' | 'negotiable' | 'dm';
    image_url: string | null;
}
