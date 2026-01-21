import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initializePayment, generateReference } from '@/lib/paystack';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            planId,
            storeName,
            slug,
            storeCategory,
            description,
            whatsappNumber,
            instagramUrl,
            snapchatUrl,
            linkedinUrl,
        } = body;

        // Get plan details
        const { data: plan } = await supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .maybeSingle();

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // Check slug availability
        const { data: existingStore } = await supabase
            .from('stores')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();

        if (existingStore) {
            return NextResponse.json({ error: 'Store URL already taken' }, { status: 400 });
        }

        // Get user email
        const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', user.id)
            .maybeSingle();

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const reference = generateReference();
        const amountInPesewas = plan.price_cedis * 100;
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/subscription/callback?reference=${reference}`;

        // Store pending store data in metadata
        const metadata = {
            user_id: user.id,
            plan_id: planId,
            store_name: storeName,
            slug,
            store_category: storeCategory,
            description,
            whatsapp_number: whatsappNumber,
            instagram_url: instagramUrl,
            snapchat_url: snapchatUrl,
            linkedin_url: linkedinUrl,
        };

        const paymentResponse = await initializePayment({
            email: userData.email,
            amount: amountInPesewas,
            reference,
            callback_url: callbackUrl,
            metadata,
        });

        if (!paymentResponse.status) {
            return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
        }

        return NextResponse.json({
            authorization_url: paymentResponse.data.authorization_url,
            reference: paymentResponse.data.reference,
        });
    } catch (error) {
        console.error('Payment initialization error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
