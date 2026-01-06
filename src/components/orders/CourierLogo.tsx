import { FC } from 'react';
import { ExternalLink, Truck } from 'lucide-react';
import { useCouriers } from '@/hooks/useCouriers';

interface CourierLogoProps {
  trackingUrl: string | null | undefined;
  className?: string;
  showLink?: boolean;
}

export const CourierLogo: FC<CourierLogoProps> = ({ 
  trackingUrl, 
  className = "w-6 h-6",
  showLink = true 
}) => {
  const { getCourierByUrl } = useCouriers();
  
  if (!trackingUrl) return null;

  const courier = getCourierByUrl(trackingUrl);

  const content = courier?.logo_url ? (
    <img 
      src={courier.logo_url} 
      alt={courier.name} 
      className={`${className} object-contain`}
      title={courier.name}
    />
  ) : (
    <div title="Куриер">
      <Truck className={`${className} text-muted-foreground`} />
    </div>
  );

  if (showLink) {
    return (
      <a 
        href={trackingUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity cursor-pointer flex items-center"
        title={courier ? `Отвори товарителница - ${courier.name}` : 'Отвори товарителница'}
      >
        {content}
      </a>
    );
  }

  return content;
};
