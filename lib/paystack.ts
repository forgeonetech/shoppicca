// Paystack Integration Helpers

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

export interface PaystackInitializeResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

export interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        status: 'success' | 'failed' | 'abandoned';
        reference: string;
        amount: number;
        currency: string;
        customer: {
            email: string;
        };
        metadata: Record<string, unknown>;
    };
}

export async function initializePayment({
    email,
    amount,
    reference,
    callback_url,
    metadata,
}: {
    email: string;
    amount: number; // Amount in pesewas (cedis * 100)
    reference: string;
    callback_url: string;
    metadata?: Record<string, unknown>;
}): Promise<PaystackInitializeResponse> {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            amount,
            reference,
            callback_url,
            metadata,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to initialize payment');
    }

    return response.json();
}

export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to verify payment');
    }

    return response.json();
}

export function generateReference(): string {
    return `SHOPPICCA_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Client-side Paystack popup integration
export function getPaystackPublicKey(): string {
    return PAYSTACK_PUBLIC_KEY || '';
}
