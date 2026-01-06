-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Create policy for public access to logos
CREATE POLICY "Logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

-- Create policy for authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Create policy for authenticated users to update logos
CREATE POLICY "Authenticated users can update logos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Create policy for authenticated users to delete logos
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'logos' AND auth.role() = 'authenticated');