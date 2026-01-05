import { FC } from 'react';
import { Package, Truck, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'Нова' | 'Изпратена' | 'Доставена' | 'Отказана';
}

const statusConfig = {
  'Нова': {
    icon: Clock,
    className: 'status-badge status-new',
  },
  'Изпратена': {
    icon: Truck,
    className: 'status-badge status-sent',
  },
  'Доставена': {
    icon: CheckCircle2,
    className: 'status-badge status-delivered',
  },
  'Отказана': {
    icon: XCircle,
    className: 'status-badge status-cancelled',
  },
};

export const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || statusConfig['Нова'];
  const Icon = config.icon;

  return (
    <span className={config.className}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};
