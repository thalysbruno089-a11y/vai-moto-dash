import { FormEvent, useEffect, useState } from "react";
import { Bike, CheckCircle2, Fuel, LockKeyhole, LogOut, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";

type BenefitMotoboy = {
  id: string;
  name: string;
  number: string | null;
  plate: string | null;
  status: string;
  payment_status: string | null;
};

const TOKEN_KEY = "vai-moto-benefits-token";

const Benefits = () => {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [motoboy, setMotoboy] = useState<BenefitMotoboy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const callAccess = async (payload: Record<string, string>) => {
    const { data, error: requestError } = await supabase.functions.invoke("motoboy-benefits-auth", { body: payload });
    if (requestError) throw requestError;
    return data as { motoboy?: BenefitMotoboy; token?: string; error?: string };
  };

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    callAccess({ action: "session", token })
      .then((data) => {
        if (data.motoboy) setMotoboy(data.motoboy);
        else window.localStorage.removeItem(TOKEN_KEY);
      })
      .catch(() => window.localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await callAccess({ action: "login", code, password });
      if (!data.motoboy || !data.token) throw new Error(data.error || "Código ou senha incorretos");
      window.localStorage.setItem(TOKEN_KEY, data.token);
      setMotoboy(data.motoboy);
    } catch {
      setError("Código ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    setMotoboy(null);
    setCode("");
    setPassword("");
  };

  const isActive = motoboy?.status === "active" && motoboy.payment_status === "paid";

  if (!motoboy) {
    return (
      <main className="min-h-screen bg-background px-5 py-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-sm flex-col justify-center">
          <div className="mb-8 text-center">
            <img src={logo} alt="Vai Moto" className="mx-auto mb-6 h-20 w-auto object-contain" />
            <p className="mb-2 text-sm font-semibold uppercase text-primary">Clube de benefícios</p>
            <h1 className="text-3xl font-bold text-foreground">Sua carteirinha digital</h1>
            <p className="mt-2 text-sm text-muted-foreground">Entre com seu código e os dois últimos caracteres da placa.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 rounded-lg border bg-card p-6 shadow-elevated">
            <div className="space-y-2">
              <Label htmlFor="benefit-code">Código do motoboy</Label>
              <div className="relative">
                <Bike className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="benefit-code" value={code} onChange={(event) => setCode(event.target.value)} className="h-12 pl-10" inputMode="numeric" autoComplete="username" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="benefit-password">Senha</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="benefit-password" value={password} onChange={(event) => setPassword(event.target.value.toUpperCase().slice(0, 2))} className="h-12 pl-10 uppercase" maxLength={2} autoComplete="current-password" required />
              </div>
            </div>
            {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
            <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-5 flex items-center justify-between">
          <img src={logo} alt="Vai Moto" className="h-12 w-auto object-contain" />
          <Button type="button" variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
            <LogOut />
          </Button>
        </header>

        <section className={`overflow-hidden rounded-lg border shadow-elevated ${isActive ? "border-success/40" : "border-destructive/40"}`}>
          <div className={`${isActive ? "bg-success" : "bg-destructive"} p-5 text-primary-foreground`}>
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase opacity-80">Carteirinha digital</p>
                <p className="mt-1 text-sm font-medium">Vai Moto Benefícios</p>
              </div>
              <ShieldCheck className="h-8 w-8" />
            </div>
            <p className="text-2xl font-bold">{motoboy.name}</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase opacity-80">Código</p>
                <p className="font-semibold">{motoboy.number || "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase opacity-80">Placa</p>
                <p className="font-semibold">{motoboy.plate || "—"}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card p-5">
            {isActive ? <CheckCircle2 className="h-7 w-7 text-success" /> : <XCircle className="h-7 w-7 text-destructive" />}
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Situação</p>
              <p className={`text-lg font-bold ${isActive ? "text-success" : "text-destructive"}`}>{isActive ? "ATIVO" : "NÃO ATIVO"}</p>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Benefícios</h2>
            <span className="text-sm text-muted-foreground">1 parceiro</span>
          </div>
          <article className={`rounded-lg border bg-card p-5 shadow-card ${!isActive ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-warning/15 text-warning">
                <Fuel className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-foreground">Posto de combustível</h3>
                <p className="mt-1 text-sm text-muted-foreground">Benefício disponível para membros ativos.</p>
              </div>
            </div>
            {!isActive && <p className="mt-4 border-t pt-4 text-sm font-medium text-destructive">Regularize seu pagamento para utilizar este benefício.</p>}
          </article>
        </section>
      </div>
    </main>
  );
};

export default Benefits;