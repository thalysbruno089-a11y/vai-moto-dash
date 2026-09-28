import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, UserRoundX, Volume2, VolumeX, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QueueBrand } from "@/components/queue/QueueBrand";
import { usePublicQueue } from "@/hooks/usePublicQueue";
import { supabase } from "@/integrations/supabase/client";
import { announceQueueCall, speakQueueMessage, stopQueueAudio } from "@/lib/queueAudio";

export default function QueueApp() {
  const { called, waiting, connected, loading, refresh } = usePublicQueue();
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [audio, setAudio] = useState(false);
  const [audioSupported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
  const [trackedEntry, setTrackedEntry] = useState<string | null>(() => sessionStorage.getItem("queue-entry"));
  const [removalToken, setRemovalToken] = useState<string | null>(() => sessionStorage.getItem("queue-removal-token"));
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const observedFirstCall = useRef(false);
  const lastCallKey = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    const key = called ? `${called.id}:${called.calledAt ?? ""}` : null;
    if (!observedFirstCall.current) {
      observedFirstCall.current = true;
      lastCallKey.current = key;
      if (audio && called) announceQueueCall(called.name);
      return;
    }
    if (key !== lastCallKey.current) {
      lastCallKey.current = key;
      if (audio && called) announceQueueCall(called.name);
    }
  }, [audio, called, loading]);

  const toggleAudio = () => {
    if (audio) {
      stopQueueAudio();
      setAudio(false);
    } else if (speakQueueMessage("Áudio da fila ativado.")) {
      setAudio(true);
      if (called) announceQueueCall(called.name);
    }
  };

  const append = (digit: string) => {
    setMessage(null);
    setCode((value) => value.length < 6 ? `${value}${digit}` : value);
  };

  const checkIn = async () => {
    if (!code) {
      setMessage({ type: "error", text: "Digite seu número." });
      return;
    }
    setSending(true);
    setMessage(null);
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; entryId?: string; removalToken?: string; position?: number; error?: string }>("queue-checkin", { body: { code } });
    setSending(false);
    if (error || data?.ok === false || data?.error || !data?.entryId || !data?.removalToken) {
      await refresh();
      setMessage({ type: "error", text: data?.error ?? "Não foi possível confirmar a entrada. Confira a lista e tente novamente com o mesmo código." });
      return;
    }
    setTrackedEntry(data.entryId);
    setRemovalToken(data.removalToken);
    sessionStorage.setItem("queue-entry", data.entryId);
    sessionStorage.setItem("queue-removal-token", data.removalToken);
    setCode("");
    setMessage({ type: "success", text: `Entrada confirmada. Você está na posição ${data.position ?? 1}.` });
    await refresh();
  };

  const removeFromQueue = async () => {
    if (!trackedEntry || !removalToken) return;
    setRemoving(true);
    setMessage(null);
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>("queue-remove", { body: { token: removalToken } });
    setRemoving(false);
    if (error || !data?.ok) {
      setMessage({ type: "error", text: data?.error ?? "Não foi possível remover da fila." });
      return;
    }

    setTrackedEntry(null);
    setRemovalToken(null);
    sessionStorage.removeItem("queue-entry");
    sessionStorage.removeItem("queue-removal-token");
    setRemoveDialogOpen(false);
    setMessage({ type: "success", text: "Você foi removido da fila." });
    await refresh();
  };

  return (
    <main className="min-h-screen bg-[#fbf9ff] pb-10">
      <header className="bg-gradient-to-r from-[#741bd9] via-[#9735df] to-[#c04be7] px-4 py-4 text-white">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <QueueBrand compact inverted />
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={toggleAudio} disabled={!audioSupported} aria-label={audio ? "Desativar áudio" : "Ativar áudio"} title={audioSupported ? (audio ? "Desativar áudio" : "Ativar áudio") : "Áudio indisponível neste navegador"}>
            {audio ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-md px-4 pt-4">
        {!audio && <Button type="button" variant="outline" className="mb-4 h-12 w-full gap-2 border-primary text-primary" onClick={toggleAudio} disabled={!audioSupported}><Volume2 className="h-5 w-5" />{audioSupported ? "Ativar som das chamadas" : "Áudio indisponível neste navegador"}</Button>}
        <section className="rounded-2xl border border-[#eadff7] bg-white px-5 py-4 text-center shadow-[0_14px_30px_rgba(116,27,217,0.12)]">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Chamando agora</p>
          <div className="mt-1">
            <span className="font-mono text-3xl font-black text-[#8e35dc]">{called?.code ?? "—"}</span>
            <p className="truncate text-lg font-extrabold text-slate-900">{called?.name ?? "Aguardando chamada"}</p>
          </div>
        </section>

        <div className="my-4 flex justify-center"><span className="rounded-full border border-[#eadff7] bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm"><span className="mr-2 text-[#8e35dc]">♙</span>{waiting.length} no fila</span></div>

        <section className="rounded-2xl border border-[#eadff7] bg-white p-5 shadow-[0_14px_30px_rgba(116,27,217,0.12)]">
          <div className="mb-4 text-center">
            <h1 className="text-base font-extrabold text-slate-900"><span className="mr-2 text-[#8e35dc]">#</span>Digite seu código</h1>
          </div>

          <div className="mb-3 flex h-20 items-center justify-center rounded-xl border-2 border-[#983ce3] bg-white font-mono text-4xl font-black tracking-[0.25em] text-slate-500" aria-live="polite">
            {code || "EX: 001"}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <Button key={digit} type="button" variant="outline" className="h-14 rounded-xl border-[#e8def5] bg-[#f5f0fc] font-mono text-xl font-bold text-[#342451] hover:bg-[#eadcff]" onClick={() => append(digit)}>{digit}</Button>
            ))}
            <Button type="button" variant="outline" className="h-14 rounded-xl border-[#e8def5] bg-[#f5f0fc] text-xs font-bold text-[#342451] hover:bg-[#eadcff]" onClick={() => setCode("")} aria-label="Limpar">Limpar</Button>
            <Button type="button" variant="outline" className="h-14 rounded-xl border-[#e8def5] bg-[#f5f0fc] font-mono text-xl font-bold text-[#342451] hover:bg-[#eadcff]" onClick={() => append("0")}>0</Button>
            <Button type="button" variant="outline" className="h-14 rounded-xl border-[#e8def5] bg-[#f5f0fc] text-xl text-[#342451] hover:bg-[#eadcff]" onClick={() => setCode((value) => value.slice(0, -1))} aria-label="Apagar último número"><ArrowLeft className="h-5 w-5" /></Button>
          </div>

          {message && (
            <div className={`mt-4 flex items-start gap-2 border px-4 py-3 text-sm font-semibold ${message.type === "success" ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"}`} role="status">
              {message.type === "success" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}{message.text}
            </div>
          )}
          <Button type="button" className="mt-4 h-14 w-full rounded-xl bg-gradient-to-r from-[#a33ee1] to-[#cf8bea] text-lg font-bold text-white shadow-lg hover:opacity-90" onClick={checkIn} disabled={sending || !code}>
            {sending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />} Entrar na Fila
          </Button>
          {trackedEntry && (
            <Button type="button" variant="outline" className="mt-3 h-12 w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setRemoveDialogOpen(true)}>
              <UserRoundX className="mr-2 h-4 w-4" /> Remover da fila
            </Button>
          )}
        </section>

        <Dialog open={removeDialogOpen} onOpenChange={(open) => {
          setRemoveDialogOpen(open);
        }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Remover da fila</DialogTitle>
              <DialogDescription>Confirma sua saída da fila? Sua posição será liberada.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRemoveDialogOpen(false)} disabled={removing}>Cancelar</Button>
              <Button type="button" variant="destructive" onClick={removeFromQueue} disabled={removing || !removalToken}>
                {removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar remoção
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <section className="mt-7">
          <h2 className="mb-3 text-sm font-bold uppercase text-slate-500">Lista de espera</h2>
          <ol className="divide-y divide-[#eee7f8] rounded-2xl border border-[#eadff7] bg-white shadow-sm">
            {waiting.slice(0, 10).map((entry, index) => (
              <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-7 font-mono text-sm text-muted-foreground">{index + 1}º</span>
                <span className="font-mono text-xl font-black text-primary">{entry.code}</span>
                <span className="truncate font-semibold text-foreground">{entry.name}</span>
              </li>
            ))}
            {waiting.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">Fila vazia</li>}
          </ol>
        </section>
        {!connected && <p className="mt-4 flex items-center justify-center gap-2 text-xs text-warning"><WifiOff className="h-4 w-4" /> Atualizando a cada 5 segundos</p>}
      </div>
    </main>
  );
}