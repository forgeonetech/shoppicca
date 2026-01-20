// Utility Functions for Shoppicca

import { WishlistItem } from './types/database';

/**
 * Generate a URL-safe slug from a string
 */
export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Validate a slug format
 */
export function isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

/**
 * Format price with GHC currency
 */
export function formatPrice(price: number | null, priceType: 'fixed' | 'negotiable' | 'dm'): string {
    if (priceType === 'dm') {
        return 'DM for price';
    }
    if (price === null) {
        return 'Price not set';
    }
    const formatted = `GHC ${price.toLocaleString()}`;
    return priceType === 'negotiable' ? `${formatted} (Negotiable)` : formatted;
}

/**
 * Generate WhatsApp message with wishlist items
 */
export function generateWhatsAppMessage(
    items: WishlistItem[],
    storeName: string
): string {
    const header = `Hi! I'm interested in the following items from ${storeName}:\n\n`;

    const itemsList = items
        .map((item, index) => {
            const price = formatPrice(item.price, item.price_type);
            return `${index + 1}. ${item.name} - ${price}`;
        })
        .join('\n');

    const footer = '\n\nPlease let me know about availability and delivery options. Thank you!';

    return encodeURIComponent(header + itemsList + footer);
}

/**
 * Generate WhatsApp URL for a single product inquiry
 */
export function generateProductWhatsAppUrl(
    whatsappNumber: string,
    productName: string,
    productPrice: number | null,
    priceType: 'fixed' | 'negotiable' | 'dm'
): string {
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const price = formatPrice(productPrice, priceType);
    const message = encodeURIComponent(
        `Hi! I'm interested in "${productName}" (${price}). Is it available?`
    );
    return `https://wa.me/${cleanNumber}?text=${message}`;
}

/**
 * Generate WhatsApp URL with wishlist items
 */
export function generateWishlistWhatsAppUrl(
    whatsappNumber: string,
    items: WishlistItem[],
    storeName: string
): string {
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const message = generateWhatsAppMessage(items, storeName);
    return `https://wa.me/${cleanNumber}?text=${message}`;
}

/**
 * Get initials from a name for avatar
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate WhatsApp number format (should start with country code)
 */
export function isValidWhatsAppNumber(number: string): boolean {
    const cleanNumber = number.replace(/[^0-9+]/g, '');
    return cleanNumber.length >= 10 && cleanNumber.length <= 15;
}

/**
 * Class name utility for conditional classes
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}
