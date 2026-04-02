import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Category, useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState<'carlos' | 'central'>('carlos');

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isLoading = createCategory.isPending || updateCategory.isPending;
  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setGroupName((category.group_name as 'carlos' | 'central') || 'carlos');
    } else {
      setName('');
      setGroupName('carlos');
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && category) {
        await updateCategory.mutateAsync({ id: category.id, name, type: 'expense', group_name: groupName });
      } else {
        await createCategory.mutateAsync({ name, type: 'expense', group_name: groupName });
      }
      onOpenChange(false);
    } catch {
      // handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edite os dados da categoria.' : 'Crie uma nova categoria de despesa.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Grupo *</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGroupName('carlos')}
                className={cn(
                  "rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all",
                  groupName === 'carlos'
                    ? "border-blue-500 bg-blue-500/10 text-blue-600"
                    : "border-border bg-background text-muted-foreground hover:border-blue-300"
                )}
              >
                Carlos
              </button>
              <button
                type="button"
                onClick={() => setGroupName('central')}
                className={cn(
                  "rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all",
                  groupName === 'central'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                )}
              >
                Central
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Funcionários, Água, Aluguel..."
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
