import { FC } from 'react';
import econtLogo from '@/assets/econt-logo.png';

interface EcontLogoProps {
  className?: string;
  trackingUrl?: string | null;
}

export const EcontLogo: FC<EcontLogoProps> = ({ className = "w-8 h-8", trackingUrl }) => {
  // Don't render anything if there's no tracking URL
  if (!trackingUrl) {
    return null;
  }

  return (
    <a 
      href={trackingUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="hover:opacity-80 transition-opacity cursor-pointer"
      title="Отвори товарителница"
    >
      <img src={econtLogo} alt="Econt" className={className} />
    </a>
  );
};
