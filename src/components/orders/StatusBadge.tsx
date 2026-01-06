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
  Ban 
} from 'lucide-react';
import { OrderStatus } from '@/types/order';

interface StatusBadgeProps {
  status: OrderStatus;
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

export const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || statusConfig['Нова'];
  const Icon = config.icon;

  return (
    <span className={config.className} title={`Статус: ${status}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};
