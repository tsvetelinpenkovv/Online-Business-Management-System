import { FC, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  PhoneOff, 
  PhoneCall, 
  PhoneIncoming,
  PhoneMissed,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type CallStatus = 'none' | 'no_answer' | 'busy' | 'called' | 'confirmed';

interface CallStatusBadgeProps {
  status: CallStatus;
  editable?: boolean;
  onStatusChange?: (status: CallStatus) => void;
}

const statusConfig: Record<CallStatus, { label: string; icon: React.ElementType; className: string }> = {
  none: { 
    label: 'Няма', 
    icon: Phone, 
    className: 'bg-muted text-muted-foreground' 
  },
  no_answer: { 
    label: 'Не вдига', 
    icon: PhoneOff, 
    className: 'bg-destructive/20 text-destructive' 
  },
  busy: { 
    label: 'Зает', 
    icon: PhoneMissed, 
    className: 'bg-warning/20 text-warning' 
  },
  called: { 
    label: 'Обаден', 
    icon: PhoneIncoming, 
    className: 'bg-info/20 text-info' 
  },
  confirmed: { 
    label: 'Потвърден', 
    icon: Check, 
    className: 'bg-success/20 text-success' 
  },
};

export const CallStatusBadge: FC<CallStatusBadgeProps> = ({
  status,
  editable = false,
  onStatusChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const config = statusConfig[status];
  const Icon = config.icon;

  const handleStatusChange = (newStatus: CallStatus) => {
    onStatusChange?.(newStatus);
    setIsOpen(false);
  };

  const badge = (
    <Badge 
      variant="secondary" 
      className={`${config.className} gap-1 ${editable ? 'cursor-pointer' : ''} whitespace-nowrap`}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span className="hidden sm:inline text-xs">{config.label}</span>
    </Badge>
  );

  if (!editable) {
    return badge;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {badge}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-40">
        {Object.entries(statusConfig).map(([key, value]) => {
          const StatusIcon = value.icon;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => handleStatusChange(key as CallStatus)}
              className={status === key ? 'bg-muted' : ''}
            >
              <StatusIcon className="w-4 h-4 mr-2" />
              {value.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};