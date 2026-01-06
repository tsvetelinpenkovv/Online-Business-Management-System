import { FC, ReactNode, useState } from 'react';
import { Info, Eye } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface InfoPopoverProps {
  title: string;
  content: ReactNode;
  icon?: 'info' | 'eye';
  children?: ReactNode;
}

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
            className={`h-5 w-5 transition-colors ${
              open 
                ? 'bg-primary hover:bg-primary/90 [&>svg]:text-primary-foreground [&:hover>svg]:text-primary-foreground' 
                : 'text-muted-foreground hover:text-accent-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
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
