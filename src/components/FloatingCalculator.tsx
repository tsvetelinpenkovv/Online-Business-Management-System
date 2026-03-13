import { useState, useRef, useCallback, useEffect } from 'react';
import { Calculator, X, Trash2, History, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface HistoryEntry {
  expression: string;
  result: string;
  timestamp: string;
}

const STORAGE_KEY = 'calculator-history';

const getHistory = (): HistoryEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
};

const saveHistory = (entries: HistoryEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const groupByDay = (entries: HistoryEntry[]) => {
  const groups: Record<string, HistoryEntry[]> = {};
  entries.forEach(e => {
    const day = new Date(e.timestamp).toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!groups[day]) groups[day] = [];
    groups[day].push(e);
  });
  return groups;
};

export const FloatingCalculator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(getHistory);
  const [expression, setExpression] = useState('');

  // Drag state
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.current.y)),
      });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isDragging]);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) setDisplay(display + '.');
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression('');
  };

  const performOperation = (nextOp: string | null) => {
    const current = parseFloat(display);

    if (previousValue !== null && operator && !waitingForOperand) {
      const prev = parseFloat(previousValue);
      let result = 0;
      const opSymbol = operator === '*' ? '×' : operator === '/' ? '÷' : operator;

      switch (operator) {
        case '+': result = prev + current; break;
        case '-': result = prev - current; break;
        case '*': result = prev * current; break;
        case '/': result = current !== 0 ? prev / current : 0; break;
        case '%': result = prev * (current / 100); break;
      }

      const resultStr = parseFloat(result.toFixed(10)).toString();

      if (nextOp === null) {
        const fullExpr = `${previousValue} ${opSymbol} ${display}`;
        const entry: HistoryEntry = {
          expression: fullExpr,
          result: resultStr,
          timestamp: new Date().toISOString(),
        };
        const newHistory = [entry, ...history].slice(0, 200);
        setHistory(newHistory);
        saveHistory(newHistory);
        setExpression(`${fullExpr} = ${resultStr}`);
      }

      setDisplay(resultStr);
      setPreviousValue(nextOp ? resultStr : null);
    } else {
      setPreviousValue(display);
    }

    setOperator(nextOp);
    setWaitingForOperand(true);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const toggleSign = () => {
    const val = parseFloat(display);
    setDisplay((-val).toString());
  };

  const grouped = groupByDay(history);

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  const handleButton = (btn: string) => {
    switch (btn) {
      case 'C': clear(); break;
      case '±': toggleSign(); break;
      case '%': performOperation('%'); break;
      case '÷': performOperation('/'); break;
      case '×': performOperation('*'); break;
      case '-': performOperation('-'); break;
      case '+': performOperation('+'); break;
      case '=': performOperation(null); break;
      case '.': inputDecimal(); break;
      default: inputDigit(btn);
    }
  };

  const isOp = (btn: string) => ['÷', '×', '-', '+', '%'].includes(btn);
  const isActiveOp = (btn: string) => {
    const map: Record<string, string> = { '÷': '/', '×': '*', '-': '-', '+': '+', '%': '%' };
    return waitingForOperand && operator === map[btn];
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)}>
            <Calculator className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Калкулатор</TooltipContent>
      </Tooltip>

      {isOpen && (
        <div
          ref={panelRef}
          className="fixed z-[9999] w-[300px] rounded-xl border bg-popover text-popover-foreground shadow-2xl"
          style={{ left: position.x, top: position.y, userSelect: isDragging ? 'none' : 'auto' }}
        >
          {/* Title bar - draggable */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b cursor-grab active:cursor-grabbing bg-muted/50 rounded-t-xl"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <GripVertical className="w-3.5 h-3.5" />
              Калкулатор
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowHistory(!showHistory)}>
                <History className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {showHistory ? (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">История</span>
                {history.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={clearHistory}>
                    <Trash2 className="w-3 h-3 mr-1" /> Изтрий
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[300px]">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Няма записи</p>
                ) : (
                  Object.entries(grouped).map(([day, entries]) => (
                    <div key={day} className="mb-3">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{day}</div>
                      {entries.map((e, i) => (
                        <div key={i} className="flex justify-between items-baseline text-xs py-1 border-b border-border/50 last:border-0">
                          <span className="text-muted-foreground truncate mr-2">{e.expression}</span>
                          <span className="font-mono font-semibold shrink-0">= {e.result}</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="p-3">
              {/* Expression */}
              {expression && (
                <div className="text-[11px] text-muted-foreground text-right truncate mb-0.5 h-4">{expression}</div>
              )}
              {/* Display */}
              <div className="bg-muted/60 rounded-lg p-3 mb-3 text-right">
                <div className="text-2xl font-mono font-bold tracking-tight truncate">{display}</div>
              </div>
              {/* Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {buttons.flat().map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleButton(btn)}
                    className={cn(
                      "h-11 rounded-lg text-sm font-semibold transition-all active:scale-95",
                      btn === '0' && 'col-span-2',
                      btn === '=' && 'bg-primary text-primary-foreground hover:bg-primary/90',
                      isOp(btn) && !isActiveOp(btn) && 'bg-accent text-accent-foreground hover:bg-accent/80',
                      isActiveOp(btn) && 'bg-primary text-primary-foreground ring-2 ring-primary/50',
                      btn === 'C' && 'bg-destructive/15 text-destructive hover:bg-destructive/25',
                      btn === '±' && 'bg-muted hover:bg-muted/80',
                      !isOp(btn) && btn !== '=' && btn !== 'C' && btn !== '±' && 'bg-card hover:bg-muted border border-border/50',
                    )}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
