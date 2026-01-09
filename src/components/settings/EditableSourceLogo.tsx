import { FC, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditableSourceLogoProps {
  sourceId: string;
  sourceName: string;
  currentLogo: React.ReactNode;
  logoUrl?: string | null;
  onLogoChange?: (newUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

export const EditableSourceLogo: FC<EditableSourceLogoProps> = ({
  sourceId,
  sourceName,
  currentLogo,
  logoUrl,
  onLogoChange,
  size = 'md',
  editable = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(logoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const containerClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const handleClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Грешка',
        description: 'Позволени формати: PNG, JPG, SVG, WebP',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: 'Грешка',
        description: 'Максималният размер е 1MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${sourceId}-${Date.now()}.${fileExt}`;
      const filePath = `source-logos/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('login-backgrounds')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('login-backgrounds')
        .getPublicUrl(filePath);

      const newUrl = urlData.publicUrl;
      setCustomLogo(newUrl);

      // Update the platform logo URL in database if it's an ecommerce platform
      if (sourceId && sourceId !== 'google' && sourceId !== 'facebook' && sourceId !== 'phone') {
        await supabase
          .from('ecommerce_platforms')
          .update({ logo_url: newUrl })
          .eq('id', sourceId);
      }

      onLogoChange?.(newUrl);

      toast({
        title: 'Успех',
        description: `Логото на ${sourceName} е обновено`,
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно качване на логото',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div 
      className={`relative ${containerClasses[size]} flex items-center justify-center rounded-lg ${editable ? 'cursor-pointer group hover:bg-muted/50 transition-colors' : ''}`}
      onClick={handleClick}
      title={editable ? 'Кликнете за смяна на логото' : undefined}
    >
      {uploading ? (
        <Loader2 className={`${sizeClasses[size]} animate-spin text-muted-foreground`} />
      ) : customLogo ? (
        <img src={customLogo} alt={sourceName} className={`${sizeClasses[size]} object-contain`} />
      ) : (
        <div className={sizeClasses[size]}>{currentLogo}</div>
      )}
      
      {editable && !uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
