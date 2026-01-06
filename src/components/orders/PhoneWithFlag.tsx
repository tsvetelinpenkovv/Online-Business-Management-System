import { FC } from 'react';
import { Phone } from 'lucide-react';

interface PhoneWithFlagProps {
  phone: string;
}

export const PhoneWithFlag: FC<PhoneWithFlagProps> = ({ phone }) => {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
      <span>{phone}</span>
    </span>
  );
};
