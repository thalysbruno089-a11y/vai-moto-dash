import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Motoboy } from '@/hooks/useMotoboys';

interface MotoboyComboboxProps {
  motoboys: Motoboy[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function MotoboyCombobox({ motoboys, value, onValueChange, disabled }: MotoboyComboboxProps) {
  const [open, setOpen] = useState(false);

  // Sort motoboys by number (1, 2, 3...) then by name for those without numbers
  const sortedMotoboys = useMemo(() => {
    return [...motoboys].sort((a, b) => {
      const numA = parseInt(a.number || '999999', 10);
      const numB = parseInt(b.number || '999999', 10);
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });
  }, [motoboys]);

  const selectedMotoboy = motoboys.find(m => m.id === value);
  const displayText = selectedMotoboy 
    ? `${selectedMotoboy.number ? `#${selectedMotoboy.number} - ` : ''}${selectedMotoboy.name}`
    : 'Selecione o motoboy';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar motoboy por nome ou número..." />
          <CommandList>
            <CommandEmpty>Nenhum motoboy encontrado.</CommandEmpty>
            <CommandGroup>
              {sortedMotoboys.map((motoboy) => (
                <CommandItem
                  key={motoboy.id}
                  value={`${motoboy.number || ''} ${motoboy.name}`}
                  onSelect={() => {
                    onValueChange(motoboy.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === motoboy.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-medium mr-2">
                    {motoboy.number ? `#${motoboy.number}` : '-'}
                  </span>
                  <span className="truncate">{motoboy.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
