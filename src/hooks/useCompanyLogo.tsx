import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const LOGO_BUCKET = 'logos';
const LOGO_PATH = 'company-logo';

export const useCompanyLogo = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogo = async () => {
    try {
      // List files in the logos bucket
      const { data: files, error } = await supabase
        .storage
        .from(LOGO_BUCKET)
        .list('', {
          limit: 10,
          search: LOGO_PATH,
        });

      if (error) {
        console.error('Error fetching logo:', error);
        setLogoUrl(null);
        return;
      }

      // Find the logo file
      const logoFile = files?.find(f => f.name.startsWith(LOGO_PATH));
      
      if (logoFile) {
        const { data: urlData } = supabase
          .storage
          .from(LOGO_BUCKET)
          .getPublicUrl(logoFile.name);
        
        // Add cache buster to prevent caching issues
        setLogoUrl(`${urlData.publicUrl}?t=${Date.now()}`);
      } else {
        setLogoUrl(null);
      }
    } catch (error) {
      console.error('Error fetching logo:', error);
      setLogoUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async (file: File): Promise<boolean> => {
    try {
      // Validate file type
      if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
        throw new Error('Само PNG или JPEG файлове са позволени');
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Файлът е прекалено голям (максимум 2MB)');
      }

      // Delete existing logo files first
      const { data: existingFiles } = await supabase
        .storage
        .from(LOGO_BUCKET)
        .list('', {
          search: LOGO_PATH,
        });

      if (existingFiles && existingFiles.length > 0) {
        await supabase
          .storage
          .from(LOGO_BUCKET)
          .remove(existingFiles.map(f => f.name));
      }

      // Get file extension
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${LOGO_PATH}.${ext}`;

      // Upload new logo
      const { error: uploadError } = await supabase
        .storage
        .from(LOGO_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Refresh logo URL
      await fetchLogo();
      return true;
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  };

  const deleteLogo = async (): Promise<boolean> => {
    try {
      const { data: existingFiles } = await supabase
        .storage
        .from(LOGO_BUCKET)
        .list('', {
          search: LOGO_PATH,
        });

      if (existingFiles && existingFiles.length > 0) {
        await supabase
          .storage
          .from(LOGO_BUCKET)
          .remove(existingFiles.map(f => f.name));
      }

      setLogoUrl(null);
      return true;
    } catch (error) {
      console.error('Error deleting logo:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchLogo();
  }, []);

  return {
    logoUrl,
    loading,
    uploadLogo,
    deleteLogo,
    refetch: fetchLogo,
  };
};
