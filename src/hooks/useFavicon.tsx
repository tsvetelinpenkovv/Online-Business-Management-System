import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const FAVICON_BUCKET = 'logos';
const FAVICON_PATH = 'favicon';

export const useFavicon = () => {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFavicon = async () => {
    try {
      const { data: files, error } = await supabase
        .storage
        .from(FAVICON_BUCKET)
        .list('', {
          limit: 10,
          search: FAVICON_PATH,
        });

      if (error) {
        console.error('Error fetching favicon:', error);
        setFaviconUrl(null);
        return;
      }

      const faviconFile = files?.find(f => f.name.startsWith(FAVICON_PATH));
      
      if (faviconFile) {
        const { data: urlData } = supabase
          .storage
          .from(FAVICON_BUCKET)
          .getPublicUrl(faviconFile.name);
        
        const url = `${urlData.publicUrl}?t=${Date.now()}`;
        setFaviconUrl(url);
        updateFaviconInDocument(url);
      } else {
        setFaviconUrl(null);
      }
    } catch (error) {
      console.error('Error fetching favicon:', error);
      setFaviconUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const updateFaviconInDocument = (url: string) => {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach(link => link.remove());

    // Add new favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = url;
    document.head.appendChild(link);
  };

  const uploadFavicon = async (file: File): Promise<boolean> => {
    try {
      // Validate file type
      if (!file.type.match(/^image\/(png|jpeg|jpg|x-icon|ico|svg\+xml)$/)) {
        throw new Error('Само PNG, JPEG, ICO или SVG файлове са позволени');
      }

      // Validate file size (max 1MB)
      if (file.size > 1 * 1024 * 1024) {
        throw new Error('Файлът е прекалено голям (максимум 1MB)');
      }

      // Delete existing favicon files first
      const { data: existingFiles } = await supabase
        .storage
        .from(FAVICON_BUCKET)
        .list('', {
          search: FAVICON_PATH,
        });

      if (existingFiles && existingFiles.length > 0) {
        const faviconFiles = existingFiles.filter(f => f.name.startsWith(FAVICON_PATH));
        if (faviconFiles.length > 0) {
          await supabase
            .storage
            .from(FAVICON_BUCKET)
            .remove(faviconFiles.map(f => f.name));
        }
      }

      // Get file extension
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${FAVICON_PATH}.${ext}`;

      // Upload new favicon
      const { error: uploadError } = await supabase
        .storage
        .from(FAVICON_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Refresh favicon URL
      await fetchFavicon();
      return true;
    } catch (error: any) {
      console.error('Error uploading favicon:', error);
      throw error;
    }
  };

  const deleteFavicon = async (): Promise<boolean> => {
    try {
      const { data: existingFiles } = await supabase
        .storage
        .from(FAVICON_BUCKET)
        .list('', {
          search: FAVICON_PATH,
        });

      if (existingFiles && existingFiles.length > 0) {
        const faviconFiles = existingFiles.filter(f => f.name.startsWith(FAVICON_PATH));
        if (faviconFiles.length > 0) {
          await supabase
            .storage
            .from(FAVICON_BUCKET)
            .remove(faviconFiles.map(f => f.name));
        }
      }

      // Restore default favicon
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach(link => link.remove());
      
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/favicon.ico';
      document.head.appendChild(link);

      setFaviconUrl(null);
      return true;
    } catch (error) {
      console.error('Error deleting favicon:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchFavicon();
  }, []);

  return {
    faviconUrl,
    loading,
    uploadFavicon,
    deleteFavicon,
    refetch: fetchFavicon,
  };
};
