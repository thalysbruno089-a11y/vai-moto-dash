import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Archive, Check, Loader2, MoreHorizontal, Pencil, PhoneCall, Plus, RotateCcw, Search, Trash2, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MotoboyFormDialog } from "@/components/motoboys/MotoboyFormDialog";
import { Motoboy, useDeleteMotoboy, useMotoboys, useUpdateMotoboy } from "@/hooks/useMotoboys";
import { supabase } from "@/integrations/supabase/client";

interface QueueRow {
  id: string;
  status: string;
  position: number;
  joined_at: string;
  called_at: string | null;
  finished_at: string | null;
  motoboys: { id: string; name: string; number: string | null } | null;
}

interface SavedReport {
  id: string;
  report_date: string;
  saved_at: string;
  total: number;
  saved_report_items: { id: string; motoboy_code: string; motoboy_name: string; count: number }[];
}

export default function QueueAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMotoboy, setSelectedMotoboy] = useState<Motoboy | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Motoboy | null>(null);
  const { data: motoboys = [] } = useMotoboys();
  const updateMotoboy = useUpdateMotoboy();
  const deleteMotoboy = useDeleteMotoboy();

  const { data: queue = [], isLoading: queueLoading } = useQuery({
    queryKey: ["queue-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("queue_entries")
        .select("id, status, position, joined_at, called_at, finished_at, motoboys(id, name, number)")
        .order("position", { ascending: true });
      if (error) throw error;
      return data as unknown as QueueRow[];
    },
    refetchInterval: 5000,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["queue-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_reports")
        .select("id, report_date, saved_at, total, saved_report_items(id, motoboy_code, motoboy_name, count)")
        .order("saved_at", { ascending: false });
      if (error) throw error;
      return data as unknown as SavedReport[];
    },
  });

  useEffect(() => {
    const channel = supabase.channel("queue-admin-refresh")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "queue_public_events" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["queue-admin"] });
        void queryClient.invalidateQueries({ queryKey: ["queue-reports"] });
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);

  const action = useMutation({
    mutationFn: async ({ name, args }: { name: "queue_call_next" | "queue_finish_current" | "queue_return_called" | "queue_save_and_reset"; args?: { p_entry_id: string } }) => {
      const response = name === "queue_return_called"
        ? await supabase.rpc(name, args ?? { p_entry_id: "" })
        : await supabase.rpc(name);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["queue-admin"] });
      void queryClient.invalidateQueries({ queryKey: ["queue-reports"] });
      toast.success(variables.name === "queue_save_and_reset" ? "Corridas salvas e painel zerado." : "Fila atualizada.");
    },
    onError: (error) => toast.error(error.message.includes("Nenhuma corrida") ? "Não há corridas finalizadas hoje." : "Não foi possível atualizar a fila."),
  });

  const removeEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("queue_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["queue-admin"] }); toast.success("Motoboy removido da fila."); },
    onError: () => toast.error("Não foi possível remover da fila."),
  });

  const waiting = queue.filter((entry) => entry.status === "waiting");
  const called = queue.find((entry) => entry.status === "called") ?? null;
  const finished = queue.filter((entry) => entry.status === "finished").sort((a, b) => (b.finished_at ?? "").localeCompare(a.finished_at ?? ""));
  const filteredMotoboys = useMemo(() => motoboys.filter((motoboy) => {
    const term = search.toLowerCase();
    return motoboy.name.toLowerCase().includes(term) || (motoboy.number ?? "").includes(term);
  }), [motoboys, search]);

  return (
    <MainLayout title="Fila Digital" subtitle="Controle de chamadas e corridas do dia">
      <Tabs defaultValue="fila" className="space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="fila">Fila</TabsTrigger>
          <TabsTrigger value="corridas">Corridas</TabsTrigger>
          <TabsTrigger value="salvas">Corridas Salvas</TabsTrigger>
          <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
        </TabsList>

        <TabsContent value="fila" className="space-y-5">
          <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="border-l-4 border-primary bg-card p-5 shadow-card">
              <p className="text-xs font-bold uppercase text-muted-foreground">Chamando agora</p>
              {called ? (
                <div className="mt-4">
                  <p className="font-mono text-6xl font-black text-primary">{called.motoboys?.number ?? "—"}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{called.motoboys?.name}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button onClick={() => action.mutate({ name: "queue_finish_current" })} disabled={action.isPending}><Check className="mr-2 h-4 w-4" /> Finalizar</Button>
                    <Button variant="outline" onClick={() => action.mutate({ name: "queue_return_called", args: { p_entry_id: called.id } })} disabled={action.isPending}><RotateCcw className="mr-2 h-4 w-4" /> Voltar para fila</Button>
                  </div>
                </div>
              ) : <p className="mt-8 text-lg text-muted-foreground">Nenhum motoboy chamado.</p>}
            </div>
            <div className="border border-border bg-card shadow-card">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div><h2 className="font-bold text-foreground">Fila de espera</h2><p className="text-xs text-muted-foreground">{waiting.length} motoboy(s)</p></div>
                <Button onClick={() => action.mutate({ name: "queue_call_next" })} disabled={action.isPending || waiting.length === 0}><PhoneCall className="mr-2 h-4 w-4" /> Chamar próximo</Button>
              </div>
              <div className="divide-y divide-border">
                {waiting.map((entry, index) => (
                  <div key={entry.id} className="flex items-center gap-3 p-4">
                    <span className="w-8 font-mono text-sm text-muted-foreground">{index + 1}º</span>
                    <span className="font-mono text-2xl font-black text-primary">{entry.motoboys?.number ?? "—"}</span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{entry.motoboys?.name}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeEntry.mutate(entry.id)} aria-label={`Remover ${entry.motoboys?.name ?? "motoboy"}`}><UserRoundX className="h-5 w-5 text-destructive" /></Button>
                  </div>
                ))}
                {!queueLoading && waiting.length === 0 && <p className="p-10 text-center text-muted-foreground">Fila vazia</p>}
                {queueLoading && <p className="flex items-center justify-center p-10 text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando</p>}
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="corridas">
          <div className="border border-border bg-card shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div><h2 className="font-bold text-foreground">Corridas finalizadas hoje</h2><p className="text-sm text-muted-foreground">{finished.length} corrida(s)</p></div>
              <Button variant="destructive" onClick={() => action.mutate({ name: "queue_save_and_reset" })} disabled={action.isPending || finished.length === 0}><Archive className="mr-2 h-4 w-4" /> Zerar e Salvar</Button>
            </div>
            <Table><TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Motoboy</TableHead><TableHead>Chamado</TableHead><TableHead>Finalizado</TableHead></TableRow></TableHeader>
              <TableBody>{finished.map((entry) => <TableRow key={entry.id}><TableCell className="font-mono font-bold text-primary">{entry.motoboys?.number ?? "—"}</TableCell><TableCell className="font-semibold">{entry.motoboys?.name}</TableCell><TableCell>{entry.called_at ? format(new Date(entry.called_at), "HH:mm") : "—"}</TableCell><TableCell>{entry.finished_at ? format(new Date(entry.finished_at), "HH:mm") : "—"}</TableCell></TableRow>)}</TableBody>
            </Table>
            {finished.length === 0 && <p className="p-10 text-center text-muted-foreground">Nenhuma corrida finalizada hoje.</p>}
          </div>
        </TabsContent>

        <TabsContent value="salvas" className="space-y-4">
          {reports.map((report) => (
            <article key={report.id} className="border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between border-b border-border pb-4"><div><h2 className="font-bold">{format(new Date(`${report.report_date}T12:00:00`), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</h2><p className="text-xs text-muted-foreground">Salvo às {format(new Date(report.saved_at), "HH:mm")}</p></div><Badge>{report.total} corridas</Badge></div>
              <div className="mt-3 divide-y divide-border">{report.saved_report_items.map((item) => <div key={item.id} className="flex items-center gap-3 py-3"><span className="font-mono text-lg font-black text-primary">{item.motoboy_code}</span><span className="flex-1 font-semibold">{item.motoboy_name}</span><span className="font-bold">{item.count}</span></div>)}</div>
            </article>
          ))}
          {reports.length === 0 && <div className="border border-border bg-card p-10 text-center text-muted-foreground">Nenhum relatório salvo.</div>}
        </TabsContent>

        <TabsContent value="cadastro">
          <div className="border border-border bg-card shadow-card">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar motoboy" className="pl-9" /></div>
              <Button onClick={() => { setSelectedMotoboy(null); setFormOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Novo motoboy</Button>
            </div>
            <Table><TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Nome</TableHead><TableHead>Status</TableHead><TableHead>Pagamento</TableHead><TableHead className="w-14"><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader>
              <TableBody>{filteredMotoboys.map((motoboy) => <TableRow key={motoboy.id}><TableCell className="font-mono font-bold text-primary">{motoboy.number ?? "—"}</TableCell><TableCell className="font-semibold">{motoboy.name}</TableCell><TableCell><Badge variant={motoboy.status === "active" ? "default" : "secondary"}>{motoboy.status === "active" ? "Ativo" : "Inativo"}</Badge></TableCell><TableCell><span className={motoboy.payment_status === "paid" ? "font-semibold text-success" : "font-semibold text-destructive"}>{motoboy.payment_status === "paid" ? "Pago" : "Pendente"}</span></TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSelectedMotoboy(motoboy); setFormOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => updateMotoboy.mutate({ id: motoboy.id, status: motoboy.status === "active" ? "inactive" : "active" })}><RotateCcw className="mr-2 h-4 w-4" /> {motoboy.status === "active" ? "Inativar" : "Ativar"}</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(motoboy)}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <MotoboyFormDialog open={formOpen} onOpenChange={setFormOpen} motoboy={selectedMotoboy} />
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir motoboy?</AlertDialogTitle><AlertDialogDescription>O cadastro de {deleteTarget?.name} será removido. Registros históricos podem impedir a exclusão.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => { if (deleteTarget) deleteMotoboy.mutate(deleteTarget.id); setDeleteTarget(null); }}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </MainLayout>
  );
}