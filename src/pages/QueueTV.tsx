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
    <main className="flex min-h-screen flex-col bg-[#090810] text-[#f8f7ff]">
      <header className="flex flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-10">
        <QueueBrand inverted />
        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <p className="text-3xl font-bold tabular-nums sm:text-5xl">{now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
            <p className="text-xs text-white/55">{now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>
          </div>
          <Button onClick={() => setAudio((value) => !value)} aria-label={audio ? "Desativar áudio" : "Ativar áudio"} className="rounded-xl bg-gradient-to-r from-[#8124dc] to-[#bd42e5] text-white hover:opacity-90">
            {audio ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />} {audio ? "Desativar áudio" : "Ativar áudio"}
          </Button>
          <Button variant="outline" size="icon" onClick={() => void document.documentElement.requestFullscreen?.()} aria-label="Tela cheia" className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background">
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="grid flex-1 gap-4 px-3 pb-3 sm:px-4 lg:grid-cols-[1.05fr_1fr]">
        <section className="flex min-h-[55vh] flex-col items-center justify-center rounded-2xl border-2 border-[#7124b5] bg-[#12111d] px-6 py-12 text-center shadow-[0_0_30px_rgba(116,27,217,0.14)] lg:min-h-0">
          <p className="w-full border-b border-white/10 pb-4 text-left text-sm font-bold uppercase tracking-[0.22em] text-white/65 sm:text-lg"><span className="mr-3 text-[#a03ee2]">•</span>Chamando agora</p>
          {called ? (
            <div key={called.id} className="animate-in fade-in zoom-in-95 duration-500">
              <p className="mt-12 rounded-2xl bg-gradient-to-br from-[#8124dc] to-[#bb43e5] px-10 py-4 font-mono text-7xl font-black leading-none text-white shadow-lg sm:text-[8rem]">{called.code}</p>
              <h1 className="mt-7 text-3xl font-bold sm:text-5xl">{called.name}</h1>
              <p className="mt-5 text-lg text-white/55">Dirija-se ao balcão</p>
            </div>
          ) : (
            <div className="mt-7">
              <p className="font-mono text-7xl font-bold text-white/20 sm:text-9xl">—</p>
              <h1 className="mt-6 text-3xl font-bold text-white/50">Aguardando chamada</h1>
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-white/10 bg-[#12111d] px-6 py-8 sm:px-10">
          <div className="flex items-end justify-between border-b border-white/10 pb-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/65">Próximos</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2a1752] font-mono font-black text-[#a03ee2]">{waiting.length}</span>
          </div>
          <ol className="mt-5 space-y-3">
            {waiting.slice(0, 8).map((entry, index) => (
              <li key={entry.id} className="flex items-center gap-4 border-b border-white/10 py-4">
                <span className="w-7 font-mono text-lg text-white/45">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-mono text-3xl font-black text-[#a03ee2]">{entry.code}</span>
                <span className="truncate text-lg font-semibold">{entry.name}</span>
              </li>
            ))}
            {waiting.length === 0 && <li className="flex min-h-80 flex-col items-center justify-center gap-4 py-16 text-xl text-white/50"><span className="text-5xl">♙</span>Fila vazia</li>}
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