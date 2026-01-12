import { FC, useState, useEffect, useMemo } from 'react';
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
  ChevronDown,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrderStatuses, OrderStatusConfig } from '@/hooks/useOrderStatuses';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ICON_MAP: Record<string, typeof Clock> = {
  Clock, Loader2, PhoneOff, CheckCircle2, CreditCard, Building2, 
  Truck, PackageX, Package, CircleCheck, Undo2, XCircle, Ban
};

const COLOR_MAP: Record<string, { bgClass: string; textClass: string }> = {
  primary: { bgClass: 'bg-primary/10', textClass: 'text-primary' },
  info: { bgClass: 'bg-info/10', textClass: 'text-info' },
  success: { bgClass: 'bg-success/10', textClass: 'text-success' },
  warning: { bgClass: 'bg-warning/10', textClass: 'text-warning' },
  destructive: { bgClass: 'bg-destructive/10', textClass: 'text-destructive' },
  purple: { bgClass: 'bg-purple/10', textClass: 'text-purple' },
  teal: { bgClass: 'bg-teal/10', textClass: 'text-teal' },
  muted: { bgClass: 'bg-muted', textClass: 'text-muted-foreground' },
};

// Cache keys for leasing statuses
const LEASING_CACHE_KEY = 'leasing_statuses_cache';
const LEASING_CACHE_TIMESTAMP_KEY = 'leasing_statuses_cache_timestamp';
const LEASING_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get cached leasing statuses
const getCachedLeasingStatuses = (): string[] | null => {
  try {
    const cached = localStorage.getItem(LEASING_CACHE_KEY);
    const timestamp = localStorage.getItem(LEASING_CACHE_TIMESTAMP_KEY);
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < LEASING_CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error('Error reading leasing status cache:', error);
  }
  return null;
};

// Save leasing statuses to cache
const setCachedLeasingStatuses = (statuses: string[]) => {
  try {
    localStorage.setItem(LEASING_CACHE_KEY, JSON.stringify(statuses));
    localStorage.setItem(LEASING_CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving leasing status cache:', error);
  }
};

// Default leasing statuses
const DEFAULT_LEASING_STATUSES = ['На лизинг през TBI', 'На лизинг през BNP', 'На лизинг през UniCredit'];

interface StatusBadgeProps {
  status: string;
  editable?: boolean;
  onStatusChange?: (newStatus: string) => void;
}

export const StatusBadge: FC<StatusBadgeProps> = ({ status, editable = false, onStatusChange }) => {
  const { statuses, loading: statusesLoading } = useOrderStatuses();
  
  // Initialize with cached data immediately to prevent delay
  const [leasingStatuses, setLeasingStatuses] = useState<string[]>(() => {
    return getCachedLeasingStatuses() || DEFAULT_LEASING_STATUSES;
  });
  const [leasingLoaded, setLeasingLoaded] = useState(() => !!getCachedLeasingStatuses());

  // Load leasing statuses from settings (background refresh)
  useEffect(() => {
    const loadLeasingStatuses = async () => {
      const { data } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', 'leasing_statuses')
        .maybeSingle();
      
      if (data?.setting_value) {
        try {
          const parsed = JSON.parse(data.setting_value);
          setLeasingStatuses(parsed);
          setCachedLeasingStatuses(parsed);
        } catch {
          // Keep cached/default values
        }
      }
      setLeasingLoaded(true);
      // If no data, keep the cached/default values
    };
    loadLeasingStatuses();
  }, []);

  // Memoize leasing check to avoid recalculation
  const isLeasing = useMemo(() => leasingStatuses.includes(status), [leasingStatuses, status]);

  // Don't render anything until data is loaded to prevent flash
  const isLoading = statusesLoading || !leasingLoaded;

  // Find status config from database or use default
  const statusConfig = statuses.find(s => s.name === status);
  const iconName = statusConfig?.icon || 'Clock';
  const colorName = statusConfig?.color || 'primary';
  
  const Icon = ICON_MAP[iconName] || Clock;
  const colorClasses = isLoading ? COLOR_MAP.muted : (COLOR_MAP[colorName] || COLOR_MAP.primary);

  // Shorten leasing status names for display
  const getShortStatus = (statusName: string) => {
    if (statusName === 'На лизинг през TBI') return 'TBI лизинг';
    if (statusName === 'На лизинг през BNP') return 'BNP лизинг';
    if (statusName === 'На лизинг през UniCredit') return 'UniCredit';
    if (statusName.length > 14) return statusName.substring(0, 11) + '...';
    return statusName;
  };

  const displayStatus = getShortStatus(status);

  const badge = (
    <span 
      className={`status-badge ${colorClasses.bgClass} ${colorClasses.textClass} ${editable ? 'cursor-pointer' : ''} max-w-[140px] md:max-w-[130px] lg:max-w-[150px]`} 
      title={`Статус: ${status}`}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span className="truncate text-[11px]">{displayStatus}</span>
      {isLeasing && (
        <span className="ml-0.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground flex-shrink-0" title="Лизинг">
          <Check className="w-2 h-2" strokeWidth={3} />
        </span>
      )}
      {editable && <ChevronDown className="w-3 h-3 ml-0.5 flex-shrink-0" />}
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
        {statuses.map((s) => {
          const SIcon = ICON_MAP[s.icon] || Clock;
          const sColorClasses = COLOR_MAP[s.color] || COLOR_MAP.primary;
          const sIsLeasing = leasingStatuses.includes(s.name);
          
          return (
            <DropdownMenuItem
              key={s.id}
              onClick={() => onStatusChange(s.name)}
              className={`p-1.5 rounded-md cursor-pointer ${s.name === status ? 'bg-muted' : 'hover:bg-muted/50'}`}
            >
              <span className={`status-badge ${sColorClasses.bgClass} ${sColorClasses.textClass}`}>
                <SIcon className="w-3 h-3 flex-shrink-0" />
                <span>{s.name}</span>
                {sIsLeasing && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[14px] h-[14px] rounded-full bg-destructive text-destructive-foreground flex-shrink-0">
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  </span>
                )}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
