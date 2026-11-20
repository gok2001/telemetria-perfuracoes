import { ChevronLeft, ChevronRight } from "lucide-react";
import BlocoMaquina from "./BlocoMaquina";

export default function SeletorMaquinas({
  maquinas,
  conectado,
  modo,
  indiceAtual,
  aoMudarIndice,
}) {
  if (maquinas.length === 0) {
    return <BlocoMaquina maquina={null} conectado={conectado} modo={modo} />;
  }

  const indiceSeguro = indiceAtual < maquinas.length ? indiceAtual : 0;
  const maquinaAtual = maquinas[indiceSeguro];
  const total = maquinas.length;

  function irAnterior() {
    aoMudarIndice(indiceSeguro > 0 ? indiceSeguro - 1 : total - 1);
  }

  function irProxima() {
    aoMudarIndice(indiceSeguro < total - 1 ? indiceSeguro + 1 : 0);
  }

  return (
    <div className="dash-carrossel">
      <BlocoMaquina
        maquina={maquinaAtual}
        conectado={conectado}
        modo={modo}
      />

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
            Sonda #{maquinaAtual.machine_id} ({indiceSeguro + 1} de {total})
          </span>
          <div className="dash-paginacao-pontos">
            {maquinas.map((m, idx) => (
              <button
                key={m.machine_id}
                type="button"
                className={`dash-ponto-btn ${idx === indiceSeguro ? "ativo" : ""}`}
                onClick={() => aoMudarIndice(idx)}
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