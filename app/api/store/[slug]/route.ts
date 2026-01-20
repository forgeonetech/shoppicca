import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const supabase = await createClient();

        // Fetch store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('*, plans(*)')
            .eq('slug', slug)
            .single();

        if (storeError || !store) {
            return NextResponse.json(
                { error: 'Store not found' },
                { status: 404 }
            );
        }

        // Fetch categories
        const { data: categories } = await supabase
            .from('categories')
            .select('*')
            .eq('store_id', store.id)
            .order('created_at');

        // Fetch products with images
        const { data: products } = await supabase
            .from('products')
            .select('*, product_images(*), product_attributes(*)')
            .eq('store_id', store.id)
            .eq('is_visible', true)
            .order('created_at', { ascending: false });

        return NextResponse.json({
            store,
            categories: categories || [],
            products: products || [],
        });
    } catch (error) {
        console.error('Store fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
