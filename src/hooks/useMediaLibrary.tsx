import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/imageUtils';

export interface MediaFolder {
  id: string;
  name: string;
  parent_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  folder_id: string | null;
  product_id: string | null;
  bucket: string;
  public_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface UseMediaLibraryOptions {
  folderId?: string | null;
  showProductImages?: boolean;
  page?: number;
  pageSize?: number;
}

export function useMediaLibrary(options: UseMediaLibraryOptions = {}) {
  const { folderId = null, showProductImages = false, page = 0, pageSize = 50 } = options;
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchFolders = useCallback(async () => {
    const { data, error } = await supabase
      .from('media_folders')
      .select('*')
      .order('name');
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на папки', variant: 'destructive' });
      return;
    }
    setFolders(data as MediaFolder[]);
  }, [toast]);

  const fetchFiles = useCallback(async (currentFolderId?: string | null, productImagesOnly?: boolean) => {
    setLoading(true);
    const targetFolder = currentFolderId !== undefined ? currentFolderId : folderId;
    const showProducts = productImagesOnly !== undefined ? productImagesOnly : showProductImages;

    let query = supabase
      .from('media_files')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (showProducts) {
      query = query.not('product_id', 'is', null);
    } else if (targetFolder) {
      query = query.eq('folder_id', targetFolder);
    } else if (targetFolder === null && !showProducts) {
      // "All files" view — no filter
    }

    const { data, error, count } = await query;
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на файлове', variant: 'destructive' });
      setLoading(false);
      return;
    }
    setFiles(data as MediaFile[]);
    setTotalFiles(count || 0);
    setLoading(false);
  }, [folderId, showProductImages, page, pageSize, toast]);

  const uploadFiles = useCallback(async (fileList: File[], targetFolderId?: string | null) => {
    setUploading(true);
    const results: MediaFile[] = [];

    for (const file of fileList) {
      const ext = file.name.split('.').pop();
      const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { cacheControl: '31536000', upsert: false });

      if (uploadError) {
        toast({ title: 'Грешка', description: `Неуспешно качване: ${file.name}`, variant: 'destructive' });
        continue;
      }

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

      const { data: record, error: dbError } = await supabase
        .from('media_files')
        .insert({
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          folder_id: targetFolderId || null,
          bucket: 'media',
          public_url: urlData.publicUrl,
        })
        .select()
        .single();

      if (!dbError && record) {
        results.push(record as MediaFile);
      }
    }

    setUploading(false);
    if (results.length > 0) {
      toast({ title: 'Успех', description: `Качени ${results.length} файл(а)` });
    }
    return results;
  }, [toast]);

  const createFolder = useCallback(async (name: string, parentId?: string | null) => {
    const { data, error } = await supabase
      .from('media_folders')
      .insert({ name, parent_id: parentId || null })
      .select()
      .single();

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно създаване на папка', variant: 'destructive' });
      return null;
    }
    toast({ title: 'Успех', description: 'Папката е създадена' });
    await fetchFolders();
    return data as MediaFolder;
  }, [toast, fetchFolders]);

  const renameFolder = useCallback(async (id: string, name: string) => {
    const { error } = await supabase
      .from('media_folders')
      .update({ name })
      .eq('id', id);

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно преименуване', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Успех', description: 'Папката е преименувана' });
    await fetchFolders();
    return true;
  }, [toast, fetchFolders]);

  const deleteFolder = useCallback(async (id: string) => {
    // First, fetch and delete all files in this folder from storage
    const { data: folderFiles } = await supabase
      .from('media_files')
      .select('file_path, bucket')
      .eq('folder_id', id);

    if (folderFiles && folderFiles.length > 0) {
      // Group by bucket and delete from storage
      const byBucket: Record<string, string[]> = {};
      for (const f of folderFiles) {
        if (!byBucket[f.bucket]) byBucket[f.bucket] = [];
        byBucket[f.bucket].push(f.file_path);
      }
      for (const [bucket, paths] of Object.entries(byBucket)) {
        await supabase.storage.from(bucket).remove(paths);
      }
      // Delete file DB records
      await supabase.from('media_files').delete().eq('folder_id', id);
    }

    const { error } = await supabase
      .from('media_folders')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно изтриване на папка', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Успех', description: 'Папката е изтрита' });
    await fetchFolders();
    return true;
  }, [toast, fetchFolders]);

  const moveFile = useCallback(async (fileId: string, newFolderId: string | null) => {
    const { error } = await supabase
      .from('media_files')
      .update({ folder_id: newFolderId })
      .eq('id', fileId);

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно преместване', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Успех', description: 'Файлът е преместен' });
    return true;
  }, [toast]);

  const deleteFile = useCallback(async (file: MediaFile) => {
    // Delete from storage
    await supabase.storage.from(file.bucket).remove([file.file_path]);

    // Delete from DB
    const { error } = await supabase
      .from('media_files')
      .delete()
      .eq('id', file.id);

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно изтриване', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Успех', description: 'Файлът е изтрит' });
    return true;
  }, [toast]);

  return {
    folders,
    files,
    totalFiles,
    loading,
    uploading,
    fetchFolders,
    fetchFiles,
    uploadFiles,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFile,
    deleteFile,
  };
}
