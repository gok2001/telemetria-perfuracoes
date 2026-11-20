import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BlocoMaquina from "./BlocoMaquina";

export default function SeletorMaquinas({ maquinas, conectado, modo }) {
  const [indiceAtual, setIndiceAtual] = useState(0);

  // Garante que o índice nunca fique inválido se a lista mudar
  useEffect(() => {
    if (indiceAtual >= maquinas.length && maquinas.length > 0) {
      setIndiceAtual(maquinas.length - 1);
    }
  }, [maquinas.length, indiceAtual]);

  if (maquinas.length === 0) {
    return <BlocoMaquina maquina={null} conectado={conectado} modo={modo} />;
  }

  const maquinaAtual = maquinas[indiceAtual];
  const total = maquinas.length;

  function irAnterior() {
    setIndiceAtual((atual) => (atual > 0 ? atual - 1 : total - 1));
  }

  function irProxima() {
    setIndiceAtual((atual) => (atual < total - 1 ? atual + 1 : 0));
  }

  return (
    <div className="dash-carrossel">
      <BlocoMaquina
        maquina={maquinaAtual}
        conectado={conectado}
        modo={modo}
      />

      {/* Barra inferior com setas para alternar entre as máquinas */}
      <div className="dash-paginacao">
        <button
          type="button"
          className="dash-seta-btn"
          onClick={irAnterior}
          disabled={total <= 1}
          aria-label="Sonda anterior"
        >
          <ChevronLeft size={20} />
          <span>Anterior</span>
        </button>

        <div className="dash-paginacao-centro">
          <span className="dash-paginacao-texto">
            Sonda #{maquinaAtual.machine_id} ({indiceAtual + 1} de {total})
          </span>
          <div className="dash-paginacao-pontos">
            {maquinas.map((m, idx) => (
              <button
                key={m.machine_id}
                type="button"
                className={`dash-ponto-btn ${idx === indiceAtual ? "ativo" : ""}`}
                onClick={() => setIndiceAtual(idx)}
                aria-label={`Ir para Sonda #${m.machine_id}`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          className="dash-seta-btn"
          onClick={irProxima}
          disabled={total <= 1}
          aria-label="Próxima sonda"
        >
          <span>Próxima</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}