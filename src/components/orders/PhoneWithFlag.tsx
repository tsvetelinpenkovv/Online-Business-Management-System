import { FC } from 'react';

interface PhoneWithFlagProps {
  phone: string;
}

const getCountryFlag = (phone: string): string => {
  const cleanPhone = phone.replace(/\s|-|\(|\)/g, '');
  
  // Bulgarian numbers
  if (cleanPhone.startsWith('+359') || 
      cleanPhone.startsWith('00359') ||
      /^0(87|88|89|98|99|43|44|45|46|47|48|49)\d{7}$/.test(cleanPhone)) {
    return '🇧🇬';
  }
  
  // Common country codes
  if (cleanPhone.startsWith('+49') || cleanPhone.startsWith('0049')) return '🇩🇪';
  if (cleanPhone.startsWith('+44') || cleanPhone.startsWith('0044')) return '🇬🇧';
  if (cleanPhone.startsWith('+33') || cleanPhone.startsWith('0033')) return '🇫🇷';
  if (cleanPhone.startsWith('+39') || cleanPhone.startsWith('0039')) return '🇮🇹';
  if (cleanPhone.startsWith('+34') || cleanPhone.startsWith('0034')) return '🇪🇸';
  if (cleanPhone.startsWith('+40') || cleanPhone.startsWith('0040')) return '🇷🇴';
  if (cleanPhone.startsWith('+30') || cleanPhone.startsWith('0030')) return '🇬🇷';
  if (cleanPhone.startsWith('+381') || cleanPhone.startsWith('00381')) return '🇷🇸';
  if (cleanPhone.startsWith('+386') || cleanPhone.startsWith('00386')) return '🇸🇮';
  if (cleanPhone.startsWith('+385') || cleanPhone.startsWith('00385')) return '🇭🇷';
  if (cleanPhone.startsWith('+1')) return '🇺🇸';
  
  return '🌍';
};

export const PhoneWithFlag: FC<PhoneWithFlagProps> = ({ phone }) => {
  const flag = getCountryFlag(phone);
  
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-base">{flag}</span>
      <span>{phone}</span>
    </span>
  );
};
