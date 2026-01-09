import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useLoginBackground = () => {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBackground = async () => {
    try {
      const { data: files, error } = await supabase.storage
        .from('login-backgrounds')
        .list('', { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });

      if (error) throw error;

      if (files && files.length > 0) {
        const { data: urlData } = supabase.storage
          .from('login-backgrounds')
          .getPublicUrl(files[0].name);
        
        setBackgroundUrl(urlData.publicUrl);
      } else {
        setBackgroundUrl(null);
      }
    } catch (error) {
      console.error('Error fetching login background:', error);
      setBackgroundUrl(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackground();
  }, []);

  const uploadBackground = async (file: File): Promise<boolean> => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Грешка',
        description: 'Невалиден формат. Поддържат се: JPG, PNG, WEBP, GIF',
        variant: 'destructive',
      });
      return false;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Грешка',
        description: 'Файлът е твърде голям. Максимум 5MB',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Delete existing backgrounds first
      await deleteBackground();

      const fileExt = file.name.split('.').pop();
      const fileName = `background-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('login-backgrounds')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      await fetchBackground();
      return true;
    } catch (error: any) {
      console.error('Error uploading background:', error);
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно качване на изображението',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteBackground = async (): Promise<boolean> => {
    try {
      const { data: files, error: listError } = await supabase.storage
        .from('login-backgrounds')
        .list();

      if (listError) throw listError;

      if (files && files.length > 0) {
        const filesToDelete = files.map(f => f.name);
        const { error: deleteError } = await supabase.storage
          .from('login-backgrounds')
          .remove(filesToDelete);

        if (deleteError) throw deleteError;
      }

      setBackgroundUrl(null);
      return true;
    } catch (error: any) {
      console.error('Error deleting background:', error);
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно изтриване на изображението',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    backgroundUrl,
    loading,
    uploadBackground,
    deleteBackground,
    refetch: fetchBackground,
  };
};
