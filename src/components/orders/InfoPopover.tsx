import { FC, ReactNode, useState } from 'react';
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

// Helper component for copyable text
export const CopyableText: FC<{ label: string; value: string | null | undefined; icon?: ReactNode }> = ({ label, value, icon }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!value || value === '-') {
    return (
      <p className="flex items-center gap-2">
        {icon}
        <span><strong>{label}:</strong> -</span>
      </p>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
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
      <span className="flex-1"><strong>{label}:</strong> {value}</span>
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
