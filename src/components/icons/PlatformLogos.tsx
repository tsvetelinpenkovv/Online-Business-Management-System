import { FC } from 'react';
import prestashopLogo from '@/assets/prestashop-logo.png';
import opencartLogo from '@/assets/opencart-logo.svg';
import shopifyLogo from '@/assets/shopify-logo.png';

interface LogoProps {
  className?: string;
}

export const PrestaShopLogo: FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <img src={prestashopLogo} alt="PrestaShop" className={className} />
);

export const OpenCartLogo: FC<LogoProps> = ({ className = "w-5 h-5" }) => (
  <img src={opencartLogo} alt="OpenCart" className={className} />
);

export const MagentoLogo: FC<LogoProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="28" fill="#F46F25"/>
    <path d="M128 48L48 96v112l32 16V112l48-24 48 24v112l32-16V96l-80-48z" fill="#fff"/>
    <path d="M128 136v72l-24-12V124l24 12zm0 0v72l24-12V124l-24 12z" fill="#fff"/>
  </svg>
);

export const ShopifyLogo: FC<LogoProps> = ({ className = "w-5 h-5" }) => (
  <img src={shopifyLogo} alt="Shopify" className={className} />
);

// Platform logos mapping
export const platformLogos: Record<string, FC<LogoProps>> = {
  prestashop: PrestaShopLogo,
  opencart: OpenCartLogo,
  magento: MagentoLogo,
  shopify: ShopifyLogo,
};
