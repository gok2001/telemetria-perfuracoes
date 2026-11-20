import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SENSORES = [
  { chave: "profundidade", titulo: "Profundidade", unidade: "m", cor: "#3b82f6", limite: null },
  { chave: "rotacao", titulo: "Rotação", unidade: "RPM", cor: "#22c55e", limite: 45 },
  { chave: "temperatura", titulo: "Temperatura", unidade: "°C", cor: "#f97316", limite: 40 },
  { chave: "vibracao", titulo: "Vibração", unidade: "Hz", cor: "#eab308", limite: 40 },
];

function obterEstado(sensor, valor) {
  if (valor === undefined || valor === null) {
    return { texto: "Aguardando", classe: "aguardando" };
  }
  if (!sensor.limite) {
    return { texto: "Monitorando", classe: "monitorando" };
  }
  if (valor > sensor.limite) {
    return { texto: "Em alerta", classe: "alerta" };
  }
  return { texto: "Normal", classe: "normal" };
}

function formatarNumero(valor) {
  if (valor === undefined || valor === null) return "--";
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

export default function BlocoMaquina({ maquina, conectado, modo = "operador" }) {
  const estatisticas = maquina?.estatisticas || {};
  const historico = maquina?.historico || [];
  const machineId = maquina?.machine_id ?? "--";

  return (
    <section className="dash-maquina-bloco">
      <div className="dash-maquina-cabecalho">
        <h2>Sonda #{machineId}</h2>
        <span className="dash-maquina-registros">
          {maquina?.total_registros_csv
            ? `${maquina.total_registros_csv} leituras hoje (exibindo últimas ${historico.length})`
            : "Sem histórico hoje"}
        </span>
      </div>

      <div className="dashboard-cards">
        {SENSORES.map((sensor) => {
          const dadosSensor = estatisticas[sensor.chave] || {};
          const valorAtual = dadosSensor.atual;
          const estado = obterEstado(sensor, valorAtual);

          return (
            <div key={sensor.chave} className={`dash-card ${estado.classe}`}>
              <p className="dash-titulo">{sensor.titulo}</p>

              {modo === "operador" ? (
                <>
                  <p className="dash-valor">
                    {formatarNumero(valorAtual)}
                    <span className="dash-unidade"> {sensor.unidade}</span>
                  </p>
                  <p className="dash-status">{estado.texto}</p>
                </>
              ) : (
                <>
                  <div className="dash-estatisticas-lista">
                    <div className="dash-stat-item">
                      <span>Média</span>
                      <strong>
                        {formatarNumero(dadosSensor.media)} {sensor.unidade}
                      </strong>
                    </div>
                    <div className="dash-stat-item">
                      <span>Mediana</span>
                      <strong>
                        {formatarNumero(dadosSensor.mediana)} {sensor.unidade}
                      </strong>
                    </div>
                    <div className="dash-stat-item">
                      <span>Moda</span>
                      <strong>
                        {formatarNumero(dadosSensor.moda)} {sensor.unidade}
                      </strong>
                    </div>
                  </div>
                  <p className="dash-status">{estado.texto}</p>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="dash-grafico">
        <div className="dash-grafico-topo">
          <span>Monitoramento da sonda #{machineId}</span>
          <span className={conectado ? "normal" : "alerta"}>
            ● {conectado ? "Conectado" : "Desconectado"}
          </span>
        </div>

        <div className="dash-grafico-area">
          {historico.length === 0 ? (
            <p className="dash-vazio">Aguardando dados da sonda...</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico}>
                <CartesianGrid stroke="#293139" strokeDasharray="3 3" />
                <XAxis dataKey="data_hora" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#151b20",
                    border: "1px solid #293139",
                  }}
                />
                <Legend />
                {SENSORES.map((s) => (
                  <Line
                    key={s.chave}
                    type="monotone"
                    dataKey={s.chave}
                    name={s.titulo}
                    stroke={s.cor}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}