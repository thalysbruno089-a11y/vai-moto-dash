import { useEffect, useRef, useState } from "react";
import { Maximize, Volume2, VolumeX, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueueBrand } from "@/components/queue/QueueBrand";
import { usePublicQueue } from "@/hooks/usePublicQueue";
import { announceQueueCall } from "@/lib/queueAudio";

export default function QueueTV() {
  const { called, waiting, connected } = usePublicQueue();
  const [now, setNow] = useState(new Date());
  const [audio, setAudio] = useState(true);
  const lastCalled = useRef<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (called && called.id !== lastCalled.current) {
      lastCalled.current = called.id;
      if (audio) announceQueueCall(called.name);
    }
  }, [called, audio]);

  return (
    <main className="flex min-h-screen flex-col bg-foreground text-background">
      <header className="flex flex-wrap items-center justify-between gap-5 border-b border-background/15 px-6 py-4 sm:px-10">
        <QueueBrand inverted />
        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <p className="text-3xl font-bold tabular-nums sm:text-5xl">{now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
            <p className="text-sm text-background/70">{now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => setAudio((value) => !value)} aria-label={audio ? "Desativar áudio" : "Ativar áudio"} className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background">
            {audio ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => void document.documentElement.requestFullscreen?.()} aria-label="Tela cheia" className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background">
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[1.55fr_0.85fr]">
        <section className="flex min-h-[55vh] flex-col items-center justify-center border-b border-background/15 px-6 py-12 text-center lg:border-b-0 lg:border-r">
          <p className="text-sm font-bold uppercase text-background/60 sm:text-lg">Chamando agora</p>
          {called ? (
            <div key={called.id} className="animate-in fade-in zoom-in-95 duration-500">
              <p className="mt-4 font-mono text-8xl font-black leading-none text-primary sm:text-[10rem] lg:text-[13rem]">{called.code}</p>
              <h1 className="mt-5 text-3xl font-bold sm:text-5xl">{called.name}</h1>
              <p className="mt-7 animate-pulse rounded-md bg-primary px-8 py-4 text-xl font-bold text-primary-foreground sm:text-3xl">Dirija-se ao balcão</p>
            </div>
          ) : (
            <div className="mt-7">
              <p className="font-mono text-7xl font-bold text-background/20 sm:text-9xl">—</p>
              <h1 className="mt-6 text-3xl font-bold text-background/50">Aguardando chamada</h1>
            </div>
          )}
        </section>

        <aside className="bg-background/5 px-6 py-8 sm:px-10">
          <div className="flex items-end justify-between border-b border-background/15 pb-5">
            <div>
              <p className="text-sm font-bold uppercase text-background/60">Próximos</p>
              <h2 className="mt-1 text-3xl font-bold">Fila de espera</h2>
            </div>
            <span className="font-mono text-4xl font-black text-primary">{waiting.length}</span>
          </div>
          <ol className="mt-5 space-y-3">
            {waiting.slice(0, 8).map((entry, index) => (
              <li key={entry.id} className="flex items-center gap-4 border-b border-background/15 py-4">
                <span className="w-7 font-mono text-lg text-background/50">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-mono text-3xl font-black text-primary">{entry.code}</span>
                <span className="truncate text-lg font-semibold">{entry.name}</span>
              </li>
            ))}
            {waiting.length === 0 && <li className="py-16 text-center text-xl text-background/50">Fila vazia</li>}
          </ol>
        </aside>
      </div>

      {!connected && (
        <footer className="flex items-center justify-center gap-2 bg-warning px-4 py-2 text-sm font-semibold text-warning-foreground">
          <WifiOff className="h-4 w-4" /> Atualização instantânea indisponível. Tentando novamente a cada 5 segundos.
        </footer>
      )}
    </main>
  );
}