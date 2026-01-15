import { forwardRef } from 'react';
import { Truck } from 'lucide-react';
import { useCouriers } from '@/hooks/useCouriers';

interface CourierLogoProps {
  trackingUrl?: string | null;
  courierId?: string | null;
  className?: string;
  showLink?: boolean;
}

export const CourierLogo = forwardRef<HTMLDivElement, CourierLogoProps>(({ 
  trackingUrl, 
  courierId,
  className = "w-8 h-8",
  showLink = true 
}, ref) => {
  // Always call hooks at the top level - before any early returns!
  const { couriers, loading, getCourierByUrl } = useCouriers();
  
  // If no tracking URL, show dash immediately
  if (!trackingUrl) return <span className="text-muted-foreground">-</span>;
  
  // While loading couriers, show empty placeholder to prevent flash
  if (loading) {
    return <div ref={ref} className={className} />;
  }
  
  // First try to find courier by ID, then by URL
  let courier = courierId ? couriers.find(c => c.id === courierId) : null;
  if (!courier && trackingUrl) {
    courier = getCourierByUrl(trackingUrl);
  }

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
      <div ref={ref}>
        <a 
          href={trackingUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity cursor-pointer flex items-center"
          title={courier ? `Отвори товарителница - ${courier.name}` : 'Отвори товарителница'}
        >
          {content}
        </a>
      </div>
    );
  }

  return <div ref={ref}>{content}</div>;
});

CourierLogo.displayName = 'CourierLogo';
