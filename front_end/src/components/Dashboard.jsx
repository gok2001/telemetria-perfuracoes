import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { useTelemetria } from "../hooks/useTelemetria";
import SeletorMaquinas from "./SeletorMaquinas";
import ModalAlertas from "./ModalAlertas";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const { maquinas, conectado, carregando } = useTelemetria(30, 2000);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    if (indiceAtual >= maquinas.length && maquinas.length > 0) {
      setIndiceAtual(maquinas.length - 1);
    }
  }, [maquinas.length, indiceAtual]);

  const maquinaAtual = maquinas[indiceAtual] || null;
  const alertasDaMaquina = (maquinaAtual?.alertas || []).slice(0, 10);

  return (
    <div className="dashboard">
      <button
        type="button"
        className="dash-alerta-botao"
        onClick={() => setModalAberto(true)}
        aria-label="Abrir alertas da sonda atual"
      >
        <TriangleAlert size={30} />
        {alertasDaMaquina.length > 0 && (
          <span className="dash-alerta-contador">{alertasDaMaquina.length}</span>
        )}
      </button>

      {carregando ? (
        <p className="dash-vazio">Carregando indicadores analíticos...</p>
      ) : (
        <SeletorMaquinas
          maquinas={maquinas}
          conectado={conectado}
          modo="controlador"
          indiceAtual={indiceAtual}
          aoMudarIndice={setIndiceAtual}
        />
      )}

      <ModalAlertas
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        alertas={alertasDaMaquina}
        machineId={maquinaAtual?.machine_id}
      />
    </div>
  );
}