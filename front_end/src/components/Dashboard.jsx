import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { useTelemetria } from "../hooks/useTelemetria";
import SeletorMaquinas from "./SeletorMaquinas";
import ModalAlertas from "./ModalAlertas";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const { maquinas, conectado, carregando, todosAlertas } = useTelemetria(20, 2000);
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div className="dashboard">
      <button
        type="button"
        className="dash-alerta-botao"
        onClick={() => setModalAberto(true)}
        aria-label="Abrir alertas"
      >
        <TriangleAlert size={30} />
        {todosAlertas.length > 0 && (
          <span className="dash-alerta-contador">{todosAlertas.length}</span>
        )}
      </button>

      {carregando ? (
        <p className="dash-vazio">Carregando indicadores analíticos...</p>
      ) : (
        <SeletorMaquinas
          maquinas={maquinas}
          conectado={conectado}
          modo="controlador"
        />
      )}

      <ModalAlertas
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        alertas={todosAlertas}
      />
    </div>
  );
}