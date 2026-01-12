import { FC, ReactNode, useState, useMemo } from 'react';
import { Info, Eye, Copy, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface InfoPopoverProps {
  title: string;
  content: ReactNode;
  icon?: 'info' | 'eye';
  children?: ReactNode;
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

// Format phone number for display
const formatPhoneNumber = (phone: string): { formatted: string; isBulgarian: boolean; cleanNumber: string } => {
  const cleanNumber = phone.replace(/[\s\-\(\)\.]/g, '');
  
  const bulgarianPrefixes = ['088', '0888', '0878', '0879', '089', '087', '098'];
  const isBulgarianMobile = bulgarianPrefixes.some(prefix => cleanNumber.startsWith(prefix));
  const alreadyFormatted = cleanNumber.startsWith('+359') || cleanNumber.startsWith('00359');
  
  if (isBulgarianMobile && !alreadyFormatted) {
    const withoutLeadingZero = cleanNumber.replace(/^0/, '');
    return {
      formatted: `+359${withoutLeadingZero}`,
      isBulgarian: true,
      cleanNumber: `+359${withoutLeadingZero}`
    };
  }
  
  if (alreadyFormatted) {
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

// Helper component for copyable text
export const CopyableText: FC<{ 
  label: string; 
  value: string | null | undefined; 
  icon?: ReactNode;
  formatAsPhone?: boolean;
}> = ({ label, value, icon, formatAsPhone }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const phoneData = useMemo(() => {
    if (formatAsPhone && value) {
      return formatPhoneNumber(value);
    }
    return null;
  }, [formatAsPhone, value]);

  if (!value || value === '-') {
    return (
      <p className="flex items-center gap-2">
        {icon}
        <span><strong>{label}:</strong> -</span>
      </p>
    );
  }

  const displayValue = phoneData ? phoneData.formatted : value;
  const copyValue = phoneData ? phoneData.cleanNumber : value;

  const handleCopy = () => {
    navigator.clipboard.writeText(copyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Копирано',
      description: `${label} е копиран в клипборда`,
    });
  };

  return (
    <p className="flex items-center gap-2 group">
      {icon}
      <span className="flex-1 flex items-center gap-1">
        <strong>{label}:</strong> 
        {phoneData?.isBulgarian && <BulgarianFlag className="w-4 h-3 flex-shrink-0 rounded-[1px] shadow-sm" />}
        {displayValue}
      </span>
      <button
        onClick={handleCopy}
        className="p-1 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100"
        title={`Копирай ${label.toLowerCase()}`}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-success" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
        )}
      </button>
    </p>
  );
};

export const InfoPopover: FC<InfoPopoverProps> = ({ title, content, icon = 'info', children }) => {
  const [open, setOpen] = useState(false);
  const Icon = icon === 'eye' ? Eye : Info;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ? (
          <div className="cursor-pointer">{children}</div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-7 w-7 rounded-full transition-colors ${
              open 
                ? 'bg-primary hover:bg-primary/90 [&>svg]:text-primary-foreground [&:hover>svg]:text-primary-foreground' 
                : 'text-muted-foreground hover:bg-blue-100 hover:text-blue-600'
            }`}
          >
            <Icon className="w-4 h-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80" 
        align="center"
        showArrow
      >
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{title}</h4>
          <div className="text-sm text-muted-foreground">
            {content}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
