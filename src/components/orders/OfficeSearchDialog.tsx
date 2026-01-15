import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MapPin, Building, Box, Search, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCourierApi, CourierOffice } from '@/hooks/useCourierApi';
import { useDebounce } from '@/hooks/useDebounce';

interface OfficeSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courierId: string;
  courierName: string;
  onSelect: (office: CourierOffice) => void;
}

export const OfficeSearchDialog = ({
  open,
  onOpenChange,
  courierId,
  courierName,
  onSelect,
}: OfficeSearchDialogProps) => {
  const { loading, offices, fetchOffices } = useCourierApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (open && !hasLoaded && courierId && courierName) {
      loadOffices();
    }
  }, [open, courierId, courierName, hasLoaded]);

  const loadOffices = async () => {
    await fetchOffices(courierId, courierName);
    setHasLoaded(true);
  };

  const handleRefresh = () => {
    setHasLoaded(false);
    loadOffices();
  };

  const filteredOffices = useMemo(() => {
    if (!debouncedSearch.trim()) return offices;
    
    const search = debouncedSearch.toLowerCase();
    return offices.filter(
      (office) =>
        office.name.toLowerCase().includes(search) ||
        office.address.toLowerCase().includes(search) ||
        office.city.toLowerCase().includes(search) ||
        (office.code && office.code.toLowerCase().includes(search))
    );
  }, [offices, debouncedSearch]);

  const getOfficeIcon = (type?: string) => {
    switch (type) {
      case 'locker':
        return <Box className="w-4 h-4 text-primary" />;
      case 'apt':
        return <Building className="w-4 h-4 text-primary" />;
      default:
        return <MapPin className="w-4 h-4 text-primary" />;
    }
  };

  const handleSelect = (office: CourierOffice) => {
    onSelect(office);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Търсене на офиси и автомати - {courierName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Търси по име, адрес или град..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
              title="Обнови офисите"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Зареждане на офиси...</p>
            </div>
          ) : filteredOffices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <MapPin className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Няма намерени офиси' : 'Натиснете бутона за обновяване'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredOffices.map((office) => (
                  <div
                    key={office.id}
                    className="p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleSelect(office)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getOfficeIcon(office.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{office.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {office.address}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{office.city}</span>
                          {office.code && (
                            <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                              {office.code}
                            </span>
                          )}
                          {office.type === 'locker' && (
                            <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                              Автомат
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>
              {filteredOffices.length} от {offices.length} офиси
            </span>
            {!loading && hasLoaded && (
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Обнови
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
