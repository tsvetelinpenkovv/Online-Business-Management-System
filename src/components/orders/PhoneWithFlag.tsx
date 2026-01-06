import { FC } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PhoneWithFlagProps {
  phone: string;
}

export const PhoneWithFlag: FC<PhoneWithFlagProps> = ({ phone }) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(phone);
    toast({
      title: 'Копирано',
      description: `Телефон ${phone} е копиран`,
    });
  };

  return (
    <span 
      className="cursor-pointer hover:text-primary transition-colors"
      onClick={handleCopy}
      title="Кликни за копиране"
    >
      {phone}
    </span>
  );
};
