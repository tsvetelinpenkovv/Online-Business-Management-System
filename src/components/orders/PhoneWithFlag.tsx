import { FC, useMemo } from 'react';
import { Phone as PhoneIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhoneWithFlagProps {
  phone: string;
}

// Bulgarian Flag SVG component
const BulgarianFlag: FC<{ className?: string }> = ({ className = "w-4 h-3" }) => (
  <svg 
    viewBox="0 0 640 480" 
    className={className}
    aria-label="Български телефон"
  >
    <g fillRule="evenodd" strokeWidth="1pt">
      <path fill="#fff" d="M0 0h640v160H0z"/>
      <path fill="#00966e" d="M0 160h640v160H0z"/>
      <path fill="#d62612" d="M0 320h640v160H0z"/>
    </g>
  </svg>
);

// Format phone number: remove spaces, format Bulgarian numbers with +359
const formatPhone = (phone: string): { formatted: string; isBulgarian: boolean; cleanNumber: string } => {
  // Remove all spaces, dashes, parentheses
  const cleanNumber = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Check if it's a Bulgarian mobile number
  const bulgarianPrefixes = ['088', '0888', '0878', '0879', '089', '087', '098'];
  const isBulgarianMobile = bulgarianPrefixes.some(prefix => cleanNumber.startsWith(prefix));
  
  // Also check if it already starts with +359 or 00359
  const alreadyFormatted = cleanNumber.startsWith('+359') || cleanNumber.startsWith('00359');
  
  if (isBulgarianMobile && !alreadyFormatted) {
    // Convert 0888... to +359888...
    const withoutLeadingZero = cleanNumber.replace(/^0/, '');
    return {
      formatted: `+359${withoutLeadingZero}`,
      isBulgarian: true,
      cleanNumber: `+359${withoutLeadingZero}`
    };
  }
  
  if (alreadyFormatted) {
    // Normalize to +359 format
    const normalized = cleanNumber.replace(/^00359/, '+359');
    return {
      formatted: normalized,
      isBulgarian: true,
      cleanNumber: normalized
    };
  }
  
  return {
    formatted: cleanNumber,
    isBulgarian: false,
    cleanNumber
  };
};

export const PhoneWithFlag: FC<PhoneWithFlagProps> = ({ phone }) => {
  const { toast } = useToast();
  
  const { formatted, isBulgarian, cleanNumber } = useMemo(() => formatPhone(phone), [phone]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cleanNumber);
    toast({
      title: 'Копирано',
      description: `Телефон ${cleanNumber} е копиран`,
    });
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <span 
      className="inline-flex items-center gap-1 cursor-pointer hover:text-primary transition-colors text-[13px] font-semibold"
      onClick={handleCopy}
      title="Кликни за копиране"
    >
      {isBulgarian && <BulgarianFlag className="w-4 h-3 flex-shrink-0 rounded-[1px] shadow-sm" />}
      <span className="whitespace-nowrap">{formatted}</span>
    </span>
  );
};
