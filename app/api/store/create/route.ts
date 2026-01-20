import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            slug,
            category,
            description,
            whatsapp_number,
            instagram_url,
            snapchat_url,
            linkedin_url,
            theme_color,
            accent_color,
            plan_id,
        } = body;

        // Validate required fields
        if (!name || !slug || !whatsapp_number || !plan_id) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if slug is already taken
        const { data: existingStore } = await supabase
            .from('stores')
            .select('id')
            .eq('slug', slug)
            .single();

        if (existingStore) {
            return NextResponse.json(
                { error: 'This store URL is already taken' },
                { status: 400 }
            );
        }

        // Check if user already has a store
        const { data: userStore } = await supabase
            .from('stores')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (userStore) {
            return NextResponse.json(
                { error: 'You already have a store' },
                { status: 400 }
            );
        }

        // Create store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .insert({
                owner_id: user.id,
                name,
                slug,
                category: category || null,
                description: description || null,
                whatsapp_number,
                instagram_url: instagram_url || null,
                snapchat_url: snapchat_url || null,
                linkedin_url: linkedin_url || null,
                theme_color: theme_color || null,
                accent_color: accent_color || null,
                plan_id,
            })
            .select()
            .single();

        if (storeError) {
            console.error('Store creation error:', storeError);
            return NextResponse.json(
                { error: 'Failed to create store' },
                { status: 500 }
            );
        }

        // Create subscription
        const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .insert({
                store_id: store.id,
                plan_id,
                status: 'active',
                start_date: new Date().toISOString(),
            });

        if (subscriptionError) {
            console.error('Subscription creation error:', subscriptionError);
        }

        return NextResponse.json({ store, success: true });
    } catch (error) {
        console.error('Store creation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
