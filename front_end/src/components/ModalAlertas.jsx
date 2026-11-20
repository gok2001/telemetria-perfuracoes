import { TriangleAlert, X } from "lucide-react";

export default function ModalAlertas({ aberto, aoFechar, alertas }) {
  if (!aberto) return null;

  return (
    <div className="dash-modal-overlay" onClick={aoFechar}>
      <div
        className="dash-modal-conteudo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dash-modal-topo">
          <div className="dash-modal-titulo">
            <TriangleAlert size={20} />
            <span>Alertas Registrados ({alertas.length})</span>
          </div>
          <button
            type="button"
            className="dash-popup-fechar"
            onClick={aoFechar}
            aria-label="Fechar alertas"
          >
            <X size={20} />
          </button>
        </div>

        <div className="dash-modal-corpo">
          {alertas.length === 0 ? (
            <p className="dash-vazio">Nenhum alerta registrado no momento.</p>
          ) : (
            <table className="dash-tabela-alertas">
              <thead>
                <tr>
                  <th>Máquina</th>
                  <th>Sensor</th>
                  <th>Leitura</th>
                  <th>Data e Hora</th>
                </tr>
              </thead>
              <tbody>
                {alertas.map((alerta) => (
                  <tr key={alerta.id}>
                    <td className="col-maquina">Sonda #{alerta.machine_id}</td>
                    <td className="col-sensor">{alerta.titulo}</td>
                    <td className="col-leitura">
                      <strong>
                        {Number(alerta.valor).toLocaleString("pt-BR")}{" "}
                        {alerta.unidade}
                      </strong>
                      <small> (limite {alerta.limite})</small>
                    </td>
                    <td className="col-data">
                      {alerta.data_hora || alerta.hora}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
