import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthFilterProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function MonthFilter({ selectedDate, onDateChange }: MonthFilterProps) {
  const handlePreviousMonth = () => {
    onDateChange(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(selectedDate, 1));
  };

  const handleCurrentMonth = () => {
    onDateChange(new Date());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return selectedDate.getMonth() === now.getMonth() && 
           selectedDate.getFullYear() === now.getFullYear();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handlePreviousMonth}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="min-w-[140px] text-center">
        <span className="font-medium capitalize">
          {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
        </span>
      </div>
      
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleNextMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isCurrentMonth() && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCurrentMonth}
          className="text-xs"
        >
          Hoje
        </Button>
      )}
    </div>
  );
}
