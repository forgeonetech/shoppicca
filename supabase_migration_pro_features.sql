-- Add columns for Store Customization
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS header_font text DEFAULT 'Playfair Display',
ADD COLUMN IF NOT EXISTS body_font text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS font_color text DEFAULT '#1A1A2E';

-- Add columns for Product Sales
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sale_price numeric;

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('store_logos', 'store_logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('store_banners', 'store_banners', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for store_logos
CREATE POLICY "Public Access Logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'store_logos' );

CREATE POLICY "Authenticated users upload logos"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'store_logos' AND auth.role() = 'authenticated' );

CREATE POLICY "Users update own logos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'store_logos' AND auth.uid() = owner );

CREATE POLICY "Users delete own logos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'store_logos' AND auth.uid() = owner );

-- RLS Policies for store_banners (Fixing user's issue)
CREATE POLICY "Public Access Banners"
ON storage.objects FOR SELECT
USING ( bucket_id = 'store_banners' );

CREATE POLICY "Authenticated users upload banners"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'store_banners' AND auth.role() = 'authenticated' );

CREATE POLICY "Users update own banners"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'store_banners' AND auth.uid() = owner );

CREATE POLICY "Users delete own banners"
ON storage.objects FOR DELETE
USING ( bucket_id = 'store_banners' AND auth.uid() = owner );
