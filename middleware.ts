import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();
    const host = req.headers.get('host') || '';

    // Allow for a flexible root domain based on environment
    // Use NEXT_PUBLIC_APP_URL from .env.local if available
    let rootDomain = 'shoppicca.vercel.app';
    if (process.env.NEXT_PUBLIC_APP_URL) {
        try {
            const url = new URL(process.env.NEXT_PUBLIC_APP_URL);
            rootDomain = url.host; // e.g. "shoppicca.vercel.app"
        } catch (e) {
            // ignore error
        }
    }

    // Check if we are on localhost
    const isLocalhost = host.includes('localhost');

    // Determine the base domain to strip
    // If localhost, we assume the base is localhost:3000 (or whatever port is used)
    // BUT we need to be careful. If host is "store.localhost:3000", base is "localhost:3000"
    // Regex is safer for dynamic matching
    let subdomain = '';

    if (isLocalhost) {
        // Match subdomain.localhost:port
        // If host is just localhost:3000, no subdomain
        const parts = host.split('.');
        if (parts.length > 1 && parts[0] !== 'localhost') {
            // Basic assumption: sub.localhost:3000
            // parts = ['sub', 'localhost:3000']
            subdomain = parts[0];
        }
    } else {
        // Production / Vercel
        // host: nancyshoes.shoppicca.vercel.app -> subdomain: nancyshoes
        // host: shoppicca.vercel.app -> subdomain: null/empty

        if (host === rootDomain) {
            subdomain = '';
        } else if (host.endsWith(`.${rootDomain}`)) {
            subdomain = host.replace(`.${rootDomain}`, '');
        } else {
            // Handle Vercel preview domains or other custom domains
            // If the host DOES NOT match the root domain structure, we assume it's a custom domain 
            // OR a direct Vercel preview URL (project.vercel.app).
            // For safety, if we can't properly extract a subdomain relative to our known root,
            // we treat the entire host as a custom domain slug, OR we just let it pass as root.
            // Given the requirements strictly mentioned "shoppicca.vercel.app", 
            // but asked to "Support Vercel preview", straightforward mapping is tricky.
            // Best effort: if it's a vercel preview url like "shoppicca-git-main.vercel.app", 
            // we probably want to show the ROOT app (Marketing), not a store 404.
            // So if we fail to extract a subdomain relative to rootDomain, we assume NO subdomain.
            subdomain = '';
        }
    }

    // Special case for 'www'
    if (subdomain === 'www') subdomain = '';

    // If no subdomain (or it's the root app), run standard session middleware and allow rewrite to /
    if (!subdomain || subdomain === 'shoppicca') {
        return await updateSession(req);
    }

    // If we have a subdomain, rewrite to the store page
    // Note: We deliberately drop the path (e.g. /about) because the user wanted a single-page store experience ("No extra pages")
    // and requested "Internally rewritten to /store/[slug]". 
    // However, keeping the path is usually better design. 
    // But sticking to the "EXACT BEHAVIOR" table: nancyshoes... -> /store/nancyshoes

    url.pathname = `/store/${subdomain}`;

    // We do NOT return updateSession here because subdomains are public/read-only
    return NextResponse.rewrite(url);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
