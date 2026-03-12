import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Download, XCircle, CheckCircle } from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: (checked: boolean) => void;
  allSelected: boolean;
  onDelete?: () => void;
  onExport?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  canDelete?: boolean;
}

export const BulkActionsToolbar: FC<BulkActionsToolbarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  allSelected,
  onDelete,
  onExport,
  onActivate,
  onDeactivate,
  canDelete = true,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border flex-wrap">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(checked) => onSelectAll(!!checked)}
        />
        <span className="text-sm font-medium">
          {selectedCount} от {totalCount} избрани
        </span>
      </div>
      <div className="flex items-center gap-1 ml-auto flex-wrap">
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-1" />
            Експорт
          </Button>
        )}
        {onActivate && (
          <Button variant="outline" size="sm" onClick={onActivate}>
            <CheckCircle className="w-4 h-4 mr-1" />
            Активирай
          </Button>
        )}
        {onDeactivate && (
          <Button variant="outline" size="sm" onClick={onDeactivate}>
            <XCircle className="w-4 h-4 mr-1" />
            Деактивирай
          </Button>
        )}
        {onDelete && canDelete && (
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4 mr-1" />
            Изтрий ({selectedCount})
          </Button>
        )}
      </div>
    </div>
  );
};
