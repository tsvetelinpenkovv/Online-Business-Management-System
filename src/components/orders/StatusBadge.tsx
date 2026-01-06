import { FC } from 'react';
import { 
  Clock, 
  Loader2, 
  PhoneOff, 
  CheckCircle2, 
  CreditCard, 
  Building2, 
  Truck, 
  PackageX, 
  Package, 
  CircleCheck, 
  Undo2, 
  XCircle, 
  Ban,
  ChevronDown
} from 'lucide-react';
import { OrderStatus, ORDER_STATUSES } from '@/types/order';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StatusBadgeProps {
  status: OrderStatus;
  editable?: boolean;
  onStatusChange?: (newStatus: OrderStatus) => void;
}

const statusConfig: Record<OrderStatus, { icon: typeof Clock; className: string }> = {
  'Нова': {
    icon: Clock,
    className: 'status-badge status-new',
  },
  'В обработка': {
    icon: Loader2,
    className: 'status-badge status-processing',
  },
  'Неуспешна връзка': {
    icon: PhoneOff,
    className: 'status-badge status-no-contact',
  },
  'Потвърдена': {
    icon: CheckCircle2,
    className: 'status-badge status-confirmed',
  },
  'Платена с карта': {
    icon: CreditCard,
    className: 'status-badge status-paid-card',
  },
  'На лизинг през TBI': {
    icon: Building2,
    className: 'status-badge status-leasing-tbi',
  },
  'На лизинг през BNP': {
    icon: Building2,
    className: 'status-badge status-leasing-bnp',
  },
  'Изпратена': {
    icon: Truck,
    className: 'status-badge status-sent',
  },
  'Неуспешна доставка': {
    icon: PackageX,
    className: 'status-badge status-failed-delivery',
  },
  'Доставена': {
    icon: Package,
    className: 'status-badge status-delivered',
  },
  'Завършена': {
    icon: CircleCheck,
    className: 'status-badge status-completed',
  },
  'Върната': {
    icon: Undo2,
    className: 'status-badge status-returned',
  },
  'Отказана': {
    icon: XCircle,
    className: 'status-badge status-cancelled',
  },
  'Анулирана': {
    icon: Ban,
    className: 'status-badge status-voided',
  },
};

export const StatusBadge: FC<StatusBadgeProps> = ({ status, editable = false, onStatusChange }) => {
  const config = statusConfig[status] || statusConfig['Нова'];
  const Icon = config.icon;

  const badge = (
    <span className={`${config.className} ${editable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`} title={`Статус: ${status}`}>
      <Icon className="w-3 h-3" />
      {status}
      {editable && <ChevronDown className="w-3 h-3 ml-1" />}
    </span>
  );

  if (!editable || !onStatusChange) {
    return badge;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {badge}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto bg-popover z-50 p-1">
        {ORDER_STATUSES.map((s) => {
          const sConfig = statusConfig[s];
          const SIcon = sConfig.icon;
          return (
            <DropdownMenuItem
              key={s}
              onClick={() => onStatusChange(s)}
              className={`p-1 focus:bg-transparent hover:bg-transparent ${s === status ? 'bg-muted/30' : ''}`}
            >
              <span className={sConfig.className}>
                <SIcon className="w-3 h-3" />
                {s}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
