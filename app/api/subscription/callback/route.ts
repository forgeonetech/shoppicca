import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyPayment } from '@/lib/paystack';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const reference = searchParams.get('reference');

        if (!reference) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=missing_reference`);
        }

        // Verify payment with Paystack
        const verifyResponse = await verifyPayment(reference);

        if (!verifyResponse.status || verifyResponse.data.status !== 'success') {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=payment_failed`);
        }

        const metadata = verifyResponse.data.metadata as {
            user_id: string;
            plan_id: string;
            store_name: string;
            slug: string;
            store_category: string;
            description: string;
            whatsapp_number: string;
            instagram_url: string;
            snapchat_url: string;
            linkedin_url: string;
        };

        // Use service client to create store (bypasses RLS)
        const supabase = await createServiceClient();

        // Create store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .insert({
                owner_id: metadata.user_id,
                name: metadata.store_name,
                slug: metadata.slug,
                category: metadata.store_category || null,
                description: metadata.description || null,
                whatsapp_number: metadata.whatsapp_number,
                instagram_url: metadata.instagram_url || null,
                snapchat_url: metadata.snapchat_url || null,
                linkedin_url: metadata.linkedin_url || null,
                plan_id: metadata.plan_id,
            })
            .select()
            .single();

        if (storeError) {
            console.error('Store creation error:', storeError);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=store_creation_failed`);
        }

        // Create subscription
        await supabase.from('subscriptions').insert({
            store_id: store.id,
            plan_id: metadata.plan_id,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

        // Redirect to success page
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding?success=true&slug=${metadata.slug}`);
    } catch (error) {
        console.error('Payment callback error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=internal_error`);
    }
}
