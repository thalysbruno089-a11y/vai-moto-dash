import { AlertTriangle } from "lucide-react";

const SystemBlock = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black p-6 text-white">
      <div className="max-w-xl w-full border border-red-600 bg-zinc-950 rounded-lg p-8 text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <AlertTriangle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-red-500 mb-4 uppercase tracking-wide">
          Atualização de Software Necessária
        </h1>
        <p className="text-base leading-relaxed text-zinc-200">
          Seu sistema operacional está desatualizado e não foi possível iniciar
          o aplicativo desejado.
        </p>
        <p className="mt-4 text-base leading-relaxed text-zinc-300">
          Atualize os drivers para iniciar o aplicativo.
        </p>
        <div className="mt-8 text-xs text-zinc-500 uppercase tracking-widest">
          Erro: 0x80070643
        </div>
      </div>
    </div>
  );
};

export default SystemBlock;