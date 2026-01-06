import { FC } from 'react';

interface EcontLogoProps {
  className?: string;
  trackingUrl?: string | null;
}

export const EcontLogo: FC<EcontLogoProps> = ({ className = "w-8 h-8", trackingUrl }) => {
  // Don't render anything if there's no tracking URL
  if (!trackingUrl) {
    return null;
  }

  const logo = (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="12" fill="#E31E24"/>
      <path d="M20 35h60v8H28v14h44v8H28v12h52v8H20V35z" fill="white"/>
    </svg>
  );

  return (
    <a 
      href={trackingUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="hover:opacity-80 transition-opacity cursor-pointer"
      title="Отвори товарителница"
    >
      {logo}
    </a>
  );
};
