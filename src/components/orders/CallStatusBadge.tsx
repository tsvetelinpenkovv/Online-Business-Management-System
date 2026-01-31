import { FC, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  PhoneOff, 
  PhoneCall, 
  PhoneIncoming,
  PhoneMissed,
  PhoneForwarded,
  Check,
  AlertTriangle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CallStatus } from '@/types/order';

// Re-export type for backward compatibility
export type { CallStatus } from '@/types/order';

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
  wrong_number: { 
    label: 'Грешен номер', 
    icon: AlertTriangle, 
    className: 'bg-orange-500/20 text-orange-600 dark:text-orange-400' 
  },
  callback: { 
    label: 'Обратно обаждане', 
    icon: PhoneForwarded, 
    className: 'bg-purple/20 text-purple' 
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
  const config = statusConfig[status] || statusConfig.none;
  const Icon = config.icon;

  const handleStatusChange = (newStatus: CallStatus) => {
    onStatusChange?.(newStatus);
    setIsOpen(false);
  };

  const badge = (
    <Badge 
      variant="secondary" 
      className={`${config.className} gap-1 ${editable ? 'cursor-pointer hover:opacity-80' : ''} whitespace-nowrap text-xs`}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span className="hidden sm:inline">{config.label}</span>
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
      <DropdownMenuContent align="center" className="w-44 z-50 bg-popover">
        {Object.entries(statusConfig).map(([key, value]) => {
          const StatusIcon = value.icon;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => handleStatusChange(key as CallStatus)}
              className={`cursor-pointer ${status === key ? 'bg-muted' : ''}`}
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