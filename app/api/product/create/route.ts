import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's store
        const { data: store } = await supabase
            .from('stores')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        const body = await request.json();
        const {
            name,
            description,
            price,
            price_type,
            category_id,
            is_visible,
            images,
            attributes,
        } = body;

        if (!name || !price_type) {
            return NextResponse.json({ error: 'Name and price type are required' }, { status: 400 });
        }

        // Create product
        const { data: product, error: productError } = await supabase
            .from('products')
            .insert({
                store_id: store.id,
                name,
                description: description || null,
                price: price_type === 'dm' ? null : price || null,
                price_type,
                category_id: category_id || null,
                is_visible: is_visible !== false,
            })
            .select()
            .single();

        if (productError) {
            return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
        }

        // Add images
        if (images && images.length > 0) {
            const imageRecords = images.map((url: string, index: number) => ({
                product_id: product.id,
                image_url: url,
                position: index,
            }));

            await supabase.from('product_images').insert(imageRecords);
        }

        // Add attributes
        if (attributes && attributes.length > 0) {
            const attrRecords = attributes
                .filter((a: { key: string; value: string }) => a.key && a.value)
                .map((a: { key: string; value: string }) => ({
                    product_id: product.id,
                    key: a.key,
                    value: a.value,
                }));

            if (attrRecords.length > 0) {
                await supabase.from('product_attributes').insert(attrRecords);
            }
        }

        return NextResponse.json({ product, success: true });
    } catch (error) {
        console.error('Product creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
