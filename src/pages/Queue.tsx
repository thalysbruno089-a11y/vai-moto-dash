import { Link } from "react-router-dom";
import { Monitor, Settings2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueueBrand } from "@/components/queue/QueueBrand";

const options = [
  { href: "/fila/tv", icon: Monitor, title: "Abrir TV / Display", description: "Exiba a chamada e os próximos motoboys." },
  { href: "/fila/app", icon: Smartphone, title: "Check-in do Motoboy", description: "Entre na fila usando o número cadastrado." },
  { href: "/fila/admin", icon: Settings2, title: "Administração", description: "Chame, finalize e acompanhe as corridas." },
];

export default function Queue() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <QueueBrand />
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">FILA DIGITAL</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-9 max-w-2xl">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Fila Digital</h1>
          <p className="mt-3 text-base text-muted-foreground">Escolha a tela que deseja abrir.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {options.map((option) => (
            <article key={option.href} className="flex min-h-64 flex-col border border-border bg-card p-6 shadow-card">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <option.icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{option.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{option.description}</p>
              <Button asChild className="mt-6 w-full">
                <Link to={option.href}>Abrir</Link>
              </Button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}