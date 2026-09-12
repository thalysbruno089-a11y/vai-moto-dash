import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Delete, Loader2, Volume2, VolumeX, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueueBrand } from "@/components/queue/QueueBrand";
import { usePublicQueue } from "@/hooks/usePublicQueue";
import { supabase } from "@/integrations/supabase/client";
import { announceQueueCall } from "@/lib/queueAudio";

export default function QueueApp() {
  const { called, waiting, connected, refresh } = usePublicQueue();
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [audio, setAudio] = useState(true);
  const trackedEntry = useRef<string | null>(sessionStorage.getItem("queue-entry"));
  const announced = useRef<string | null>(null);

  useEffect(() => {
    if (audio && called && called.id === trackedEntry.current && called.id !== announced.current) {
      announced.current = called.id;
      announceQueueCall(called.name);
    }
  }, [audio, called]);

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
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; entryId?: string; position?: number; error?: string }>("queue-checkin", { body: { code } });
    setSending(false);
    if (error || data?.ok === false || data?.error || !data?.entryId) {
      setMessage({ type: "error", text: data?.error ?? "Não foi possível entrar na fila." });
      return;
    }
    trackedEntry.current = data.entryId;
    sessionStorage.setItem("queue-entry", data.entryId);
    setCode("");
    setMessage({ type: "success", text: `Entrada confirmada. Você está na posição ${data.position ?? 1}.` });
    await refresh();
  };

  return (
    <main className="min-h-screen bg-background pb-10">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <QueueBrand compact />
          <Button variant="ghost" size="icon" onClick={() => setAudio((value) => !value)} aria-label={audio ? "Desativar áudio" : "Ativar áudio"}>
            {audio ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-md px-4 pt-5">
        <section className="border-l-4 border-primary bg-card px-4 py-3 shadow-card">
          <p className="text-xs font-bold uppercase text-muted-foreground">Chamando agora</p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-mono text-4xl font-black text-primary">{called?.code ?? "—"}</span>
            <span className="truncate text-lg font-bold text-foreground">{called?.name ?? "Aguardando chamada"}</span>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Digite seu número</h1>
              <p className="text-sm text-muted-foreground">Use o número do seu cadastro.</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{waiting.length} na fila</span>
          </div>

          <div className="mb-4 flex h-20 items-center justify-center border-2 border-primary/30 bg-card font-mono text-4xl font-black text-foreground" aria-live="polite">
            {code || "—"}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <Button key={digit} type="button" variant="outline" className="h-16 font-mono text-2xl font-bold" onClick={() => append(digit)}>{digit}</Button>
            ))}
            <Button type="button" variant="outline" className="h-16" onClick={() => setCode("")} aria-label="Limpar"><Delete className="h-6 w-6" /></Button>
            <Button type="button" variant="outline" className="h-16 font-mono text-2xl font-bold" onClick={() => append("0")}>0</Button>
            <Button type="button" variant="outline" className="h-16" onClick={() => setCode((value) => value.slice(0, -1))} aria-label="Apagar último número"><ArrowLeft className="h-6 w-6" /></Button>
          </div>

          {message && (
            <div className={`mt-4 flex items-start gap-2 border px-4 py-3 text-sm font-semibold ${message.type === "success" ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"}`} role="status">
              {message.type === "success" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}{message.text}
            </div>
          )}
          <Button type="button" className="mt-4 h-14 w-full text-lg font-bold" onClick={checkIn} disabled={sending || !code}>
            {sending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />} Entrar na Fila
          </Button>
        </section>

        <section className="mt-7">
          <h2 className="mb-3 text-sm font-bold uppercase text-muted-foreground">Lista de espera</h2>
          <ol className="divide-y divide-border border border-border bg-card">
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