import { FC } from 'react';

interface LogoProps {
  className?: string;
}

export const PrestaShopLogo: FC<LogoProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="28" fill="#DF0067"/>
    <path d="M128 48c-44.2 0-80 35.8-80 80s35.8 80 80 80 80-35.8 80-80-35.8-80-80-80zm0 140c-33.1 0-60-26.9-60-60s26.9-60 60-60 60 26.9 60 60-26.9 60-60 60z" fill="#fff"/>
    <path d="M128 88c-22.1 0-40 17.9-40 40s17.9 40 40 40 40-17.9 40-40-17.9-40-40-40zm0 60c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z" fill="#fff"/>
  </svg>
);

export const OpenCartLogo: FC<LogoProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="28" fill="#27B6E9"/>
    <path d="M56 80h144l-12 80H80l-8-56h128" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="96" cy="192" r="16" fill="#fff"/>
    <circle cx="176" cy="192" r="16" fill="#fff"/>
  </svg>
);

export const MagentoLogo: FC<LogoProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="28" fill="#F46F25"/>
    <path d="M128 48L48 96v112l32 16V112l48-24 48 24v112l32-16V96l-80-48z" fill="#fff"/>
    <path d="M128 136v72l-24-12V124l24 12zm0 0v72l24-12V124l-24 12z" fill="#fff"/>
  </svg>
);

export const ShopifyLogo: FC<LogoProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="28" fill="#96BF48"/>
    <path d="M176 56c-2-6-8-10-14-10s-12 1-20 4c-4-12-12-22-26-22-38 0-60 48-68 72-20 8-34 12-36 12-10 4-12 4-12 14 0 6 36 122 36 122l88 16s48-166 48-168c0-4 4-36 4-40zm-56-4c0 2-10 32-24 32-8 0-16-6-16-16 0-14 10-28 28-28 8 0 12 4 12 12zm-8 40c-14 44-32 94-32 94l-8-54c8-4 24-24 40-40z" fill="#fff"/>
    <path d="M168 80l8 128-48 8 4-40s36-96 36-96z" fill="#fff" fillOpacity="0.5"/>
  </svg>
);

// Platform logos mapping
export const platformLogos: Record<string, FC<LogoProps>> = {
  prestashop: PrestaShopLogo,
  opencart: OpenCartLogo,
  magento: MagentoLogo,
  shopify: ShopifyLogo,
};
