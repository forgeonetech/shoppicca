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
            .select('id, plan_id, plans(*)')
            .eq('owner_id', user.id)
            .single();

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
        }

        // Check plan limits
        const plan = store.plans as unknown as { category_limit: number | null } | null;
        if (plan && plan.category_limit !== null) {
            const { count } = await supabase
                .from('categories')
                .select('*', { count: 'exact', head: true })
                .eq('store_id', store.id);

            if (count !== null && count >= plan.category_limit) {
                return NextResponse.json(
                    { error: `Your plan allows only ${plan.category_limit} categories` },
                    { status: 403 }
                );
            }
        }

        const { data: category, error } = await supabase
            .from('categories')
            .insert({
                store_id: store.id,
                name,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
        }

        return NextResponse.json({ category, success: true });
    } catch (error) {
        console.error('Category creation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
