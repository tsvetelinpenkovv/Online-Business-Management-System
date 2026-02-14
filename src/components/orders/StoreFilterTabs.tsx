import { useMemo, useRef, useState, useEffect, useCallback, FC, ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { Store } from '@/hooks/useStores';

// SVG Flag components
const BulgarianFlag: FC<{ className?: string }> = ({ className = "w-5 h-3.5" }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <g fillRule="evenodd" strokeWidth="1pt">
      <path fill="#fff" d="M0 0h640v160H0z"/>
      <path fill="#00966e" d="M0 160h640v160H0z"/>
      <path fill="#d62612" d="M0 320h640v160H0z"/>
    </g>
  </svg>
);

const GreekFlag: FC<{ className?: string }> = ({ className = "w-5 h-3.5" }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <rect fill="#0D5EAF" width="640" height="480"/>
    <rect fill="#fff" y="53.3" width="640" height="53.3"/>
    <rect fill="#fff" y="160" width="640" height="53.3"/>
    <rect fill="#fff" y="266.7" width="640" height="53.3"/>
    <rect fill="#fff" y="373.3" width="640" height="53.3"/>
    <rect fill="#0D5EAF" width="266.7" height="266.7"/>
    <rect fill="#fff" x="106.7" width="53.3" height="266.7"/>
    <rect fill="#fff" y="106.7" width="266.7" height="53.3"/>
  </svg>
);

const RomanianFlag: FC<{ className?: string }> = ({ className = "w-5 h-3.5" }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <rect fill="#002B7F" width="213.3" height="480"/>
    <rect fill="#FCD116" x="213.3" width="213.3" height="480"/>
    <rect fill="#CE1126" x="426.6" width="213.4" height="480"/>
  </svg>
);

const HungarianFlag: FC<{ className?: string }> = ({ className = "w-5 h-3.5" }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <rect fill="#CE2939" width="640" height="160"/>
    <rect fill="#fff" y="160" width="640" height="160"/>
    <rect fill="#477050" y="320" width="640" height="160"/>
  </svg>
);

const GermanFlag: FC<{ className?: string }> = ({ className = "w-5 h-3.5" }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <rect fill="#000" width="640" height="160"/>
    <rect fill="#D00" y="160" width="640" height="160"/>
    <rect fill="#FFCE00" y="320" width="640" height="160"/>
  </svg>
);

const FrenchFlag: FC<{ className?: string }> = ({ className = "w-5 h-3.5" }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <rect fill="#002395" width="213.3" height="480"/>
    <rect fill="#fff" x="213.3" width="213.3" height="480"/>
    <rect fill="#ED2939" x="426.6" width="213.4" height="480"/>
  </svg>
);

const ItalianFlag: FC<{ className?: string }> = ({ className = "w-5 h-3.5" }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <rect fill="#009246" width="213.3" height="480"/>
    <rect fill="#fff" x="213.3" width="213.3" height="480"/>
    <rect fill="#CE2B37" x="426.6" width="213.4" height="480"/>
  </svg>
);

const SpanishFlag: FC<{ className?: string }> = ({ className = "w-5 h-3.5" }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <rect fill="#AA151B" width="640" height="480"/>
    <rect fill="#F1BF00" y="120" width="640" height="240"/>
  </svg>
);

const PolishFlag: FC<{ className?: string }> = ({ className = "w-5 h-3.5" }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <rect fill="#fff" width="640" height="240"/>
    <rect fill="#DC143C" y="240" width="640" height="240"/>
  </svg>
);

const CzechFlag: FC<{ className?: string }> = ({ className = "w-5 h-3.5" }) => (
  <svg viewBox="0 0 640 480" className={className}>
    <rect fill="#fff" width="640" height="240"/>
    <rect fill="#D7141A" y="240" width="640" height="240"/>
    <path fill="#11457E" d="M0 0v480l320-240L0 0z"/>
  </svg>
);

export const getFlagByCountryCode = (code: string): FC<{ className?: string }> | null => {
  switch (code) {
    case 'BG': return BulgarianFlag;
    case 'GR': return GreekFlag;
    case 'RO': return RomanianFlag;
    case 'HU': return HungarianFlag;
    case 'DE': return GermanFlag;
    case 'FR': return FrenchFlag;
    case 'IT': return ItalianFlag;
    case 'ES': return SpanishFlag;
    case 'PL': return PolishFlag;
    case 'CZ': return CzechFlag;
    default: return null;
  }
};

interface StoreFilterTabsProps {
  stores: Store[];
  selectedStoreId: string | null;
  onSelectStore: (storeId: string | null) => void;
  orderCountByStore: Record<string, number>;
  totalOrders: number;
  trailingContent?: ReactNode;
}

export const StoreFilterTabs = ({
  stores,
  selectedStoreId,
  onSelectStore,
  orderCountByStore,
  totalOrders,
  trailingContent,
}: StoreFilterTabsProps) => {
  const enabledStores = useMemo(() => stores.filter(s => s.is_enabled), [stores]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [checkScroll, enabledStores]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -120 : 120, behavior: 'smooth' });
  };

  if (enabledStores.length === 0) return null;

  return (
    <div className="relative flex items-center border border-b-0 rounded-t-lg bg-card overflow-hidden">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 h-full px-1 bg-gradient-to-r from-card via-card/90 to-transparent flex items-center"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      )}

      {/* Scrollable tabs */}
      <div ref={scrollRef} className="flex items-center overflow-x-auto scrollbar-hide w-full">
        {/* All stores tab */}
        <button
          onClick={() => onSelectStore(null)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-r transition-colors flex-shrink-0 ${
            selectedStoreId === null
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted/50 text-muted-foreground'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <Badge className="h-4 px-1.5 text-[10px] font-bold bg-destructive text-destructive-foreground hover:bg-destructive border-0">
            {totalOrders}
          </Badge>
        </button>

        {enabledStores.map((store) => {
          const FlagComponent = getFlagByCountryCode(store.country_code);
          const count = orderCountByStore[store.id] || 0;

          return (
            <button
              key={store.id}
              onClick={() => onSelectStore(store.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-r transition-colors flex-shrink-0 ${
                selectedStoreId === store.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted/50 text-muted-foreground'
              }`}
            >
              {FlagComponent ? (
                <FlagComponent className="w-5 h-3.5 flex-shrink-0 rounded-[1px] shadow-sm" />
              ) : (
                <span className="text-sm">{store.flag_emoji}</span>
              )}
              <span className="hidden sm:inline">{store.country_name}</span>
              <Badge className="h-4 px-1.5 text-[10px] font-bold bg-destructive text-destructive-foreground hover:bg-destructive border-0">
                {count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Trailing content (e.g. select-all checkbox) */}
      {trailingContent && (
        <div className="flex items-center border-l px-2 flex-shrink-0">
          {trailingContent}
        </div>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 h-full px-1 bg-gradient-to-l from-card via-card/90 to-transparent flex items-center"
        >
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};
