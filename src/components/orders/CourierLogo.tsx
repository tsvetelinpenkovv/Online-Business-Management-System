import { FC } from 'react';
import { Truck } from 'lucide-react';
import { useCouriers } from '@/hooks/useCouriers';

interface CourierLogoProps {
  trackingUrl?: string | null;
  courierId?: string | null;
  className?: string;
  showLink?: boolean;
}

export const CourierLogo: FC<CourierLogoProps> = ({ 
  trackingUrl, 
  courierId,
  className = "w-8 h-8",
  showLink = true 
}) => {
  const { couriers, getCourierByUrl } = useCouriers();
  
  // First try to find courier by ID, then by URL
  let courier = courierId ? couriers.find(c => c.id === courierId) : null;
  if (!courier && trackingUrl) {
    courier = getCourierByUrl(trackingUrl);
  }

  // If no courier found and no tracking URL, show dash
  if (!courier && !trackingUrl) return <span className="text-muted-foreground">-</span>;
  
  // If no tracking URL, don't show courier logo (show dash instead)
  if (!trackingUrl) return <span className="text-muted-foreground">-</span>;

  const content = courier?.logo_url ? (
    <img 
      src={courier.logo_url} 
      alt={courier.name} 
      className={`${className} object-contain`}
      title={courier.name}
    />
  ) : (
    <div title={courier?.name || 'Куриер'}>
      <Truck className={`${className} text-muted-foreground`} />
    </div>
  );

  if (showLink && trackingUrl) {
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
