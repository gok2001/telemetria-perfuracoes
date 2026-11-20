
import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";

import { useTelemetria } from "../hooks/useTelemetria";
import SeletorMaquinas from "./SeletorMaquinas";
import ModalAlertas from "./ModalAlertas";

import "../styles/Dashboard.css";

export default function Dashboard() {
  // Consulta os dados das sondas automaticamente
  const { maquinas, conectado, carregando } = useTelemetria(30, 2000);

  // Controla a sonda selecionada
  const [indiceAtual, setIndiceAtual] = useState(0);

  // Controla a abertura do modal de alertas
  const [modalAberto, setModalAberto] = useState(false);

  // Ajusta o índice caso a lista de sondas seja alterada
  useEffect(() => {
    if (indiceAtual >= maquinas.length && maquinas.length > 0) {
      setIndiceAtual(maquinas.length - 1);
    }
  }, [maquinas.length, indiceAtual]);

  // Recupera a sonda selecionada
  const maquinaAtual = maquinas[indiceAtual] || null;

  // Recupera os últimos 10 alertas da sonda
  const alertasDaMaquina = (maquinaAtual?.alertas || []).slice(0, 10);

  return (
    <div className="dashboard">

      {/* Botão para abrir os alertas */}
      <button
        type="button"
        className="dash-alerta-botao"
        onClick={() => setModalAberto(true)}
        aria-label="Abrir alertas da sonda atual"
      >
        <TriangleAlert size={30} />

        {alertasDaMaquina.length > 0 && (
          <span className="dash-alerta-contador">
            {alertasDaMaquina.length}
          </span>
        )}
      </button>

      {/* Exibição dos dados das sondas */}
      {carregando ? (
        <p className="dash-vazio">
          Carregando indicadores analíticos...
        </p>
      ) : (
        <SeletorMaquinas
          maquinas={maquinas}
          conectado={conectado}
          modo="controlador"
          indiceAtual={indiceAtual}
          aoMudarIndice={setIndiceAtual}
        />
      )}

      {/* Modal dos alertas */}
      <ModalAlertas
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        alertas={alertasDaMaquina}
        machineId={maquinaAtual?.machine_id}
      />

    </div>
  );
}
