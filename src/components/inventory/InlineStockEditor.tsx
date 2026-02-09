import { FC, useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineStockEditorProps {
  productId: string;
  currentStock: number;
  unit?: string;
  minStockLevel: number;
  onSave: (productId: string, newStock: number) => Promise<boolean>;
  className?: string;
}

export const InlineStockEditor: FC<InlineStockEditorProps> = ({
  productId,
  currentStock,
  unit = 'бр.',
  minStockLevel,
  onSave,
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentStock.toString());
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setValue(currentStock.toString());
  }, [currentStock]);

  const handleSave = async () => {
    const newValue = parseFloat(value);
    if (isNaN(newValue) || newValue < 0) {
      setValue(currentStock.toString());
      setIsEditing(false);
      return;
    }

    setSaving(true);
    const success = await onSave(productId, newValue);
    setSaving(false);
    
    if (success) {
      setIsEditing(false);
    } else {
      setValue(currentStock.toString());
    }
  };

  const handleCancel = () => {
    setValue(currentStock.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const getBadgeClass = () => {
    if (currentStock <= 0) {
      return 'bg-destructive/20 text-destructive';
    }
    if (currentStock <= minStockLevel) {
      return 'bg-purple/20 text-purple';
    }
    return 'bg-purple/20 text-purple';
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay to allow button clicks
            setTimeout(() => {
              if (isEditing && !saving) {
                handleCancel();
              }
            }, 150);
          }}
          className="w-20 h-7 text-sm text-center"
          min="0"
          step="1"
          disabled={saving}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-1 rounded hover:bg-success/20 text-success transition-colors"
          title="Запази"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="p-1 rounded hover:bg-destructive/20 text-destructive transition-colors"
          title="Отказ"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "cursor-pointer",
        getBadgeClass(),
        className
      )}
      onClick={() => setIsEditing(true)}
      title="Кликни за редактиране на наличността"
    >
      {currentStock} {unit}
    </Badge>
  );
};
