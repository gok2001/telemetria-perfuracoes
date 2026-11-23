import { useEffect, useState } from "react";
import { LogOut, TriangleAlert, User } from "lucide-react";
import { useTelemetria } from "../hooks/useTelemetria";
import SeletorMaquinas from "./SeletorMaquinas";
import ModalAlertas from "./ModalAlertas";
import logo from "../assets/logos/logo.png";
import "../styles/Dashboard.css";
import "../styles/Operacao.css";

export default function Operacao({ usuario, onSair }) {
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
    <div className="operacao-page">
      <header className="operacao-topbar">
        <div className="operacao-topbar__marca">
          <img src={logo} alt="DrillTrack" className="operacao-topbar__logo" />
          <div>
            <h1 className="operacao-topbar__titulo">Painel de Operação</h1>
            <p className="operacao-topbar__subtitulo">Monitoramento em tempo real das sondas</p>
          </div>
        </div>

        <div className="operacao-topbar__acoes">
          {usuario?.nome && (
            <div className="operacao-usuario-badge" title={usuario.email || ""}>
              <User size={16} aria-hidden="true" />
              <span>{usuario.nome}</span>
              <small>Operador</small>
            </div>
          )}

          <button
            type="button"
            className="operacao-btn-alerta"
            onClick={() => setModalAberto(true)}
            aria-label="Abrir alertas da sonda atual"
            title="Alertas da sonda atual"
          >
            <TriangleAlert size={20} />
            <span>Alertas</span>
            {alertasDaMaquina.length > 0 && (
              <span className="operacao-btn-alerta__contador">
                {alertasDaMaquina.length}
              </span>
            )}
          </button>

          {onSair && (
            <button
              type="button"
              className="operacao-btn-sair"
              onClick={onSair}
              aria-label="Sair da conta"
            >
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          )}
        </div>
      </header>

      <main className="dashboard operacao-conteudo">
        {carregando ? (
          <p className="dash-vazio">Conectando à API de telemetria...</p>
        ) : (
          <SeletorMaquinas
            maquinas={maquinas}
            conectado={conectado}
            modo="operador"
            indiceAtual={indiceAtual}
            aoMudarIndice={setIndiceAtual}
          />
        )}
      </main>

      <ModalAlertas
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        alertas={alertasDaMaquina}
        machineId={maquinaAtual?.machine_id}
      />
    </div>
  );
}