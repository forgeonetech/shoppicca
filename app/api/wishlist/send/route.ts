import { NextRequest, NextResponse } from 'next/server';
import { generateWhatsAppMessage, formatPrice } from '@/lib/utils';

interface WishlistItem {
    id: string;
    name: string;
    price: number | null;
    price_type: 'fixed' | 'negotiable' | 'dm';
    image_url: string | null;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { items, storeName, whatsappNumber } = body as {
            items: WishlistItem[];
            storeName: string;
            whatsappNumber: string;
        };

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items in wishlist' }, { status: 400 });
        }

        if (!whatsappNumber) {
            return NextResponse.json({ error: 'WhatsApp number is required' }, { status: 400 });
        }

        const message = generateWhatsAppMessage(items, storeName);
        const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;

        return NextResponse.json({
            whatsapp_url: whatsappUrl,
            message_preview: decodeURIComponent(message),
            items_summary: items.map(item => ({
                name: item.name,
                price: formatPrice(item.price, item.price_type),
            })),
        });
    } catch (error) {
        console.error('Wishlist send error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
