import { useEffect, useState } from "react";
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
import "../styles/Dashboard.css";

const WS_URL = "ws://localhost:8765";
const MAX_PONTOS = 20;

// "chave" é o campo "medida" que vem no JSON do subscriber.
// "limite" é o valor acima do qual a leitura vira alerta (null = sem limite).
const SENSORES = [
  { chave: "profundidade", titulo: "Profundidade", unidade: "m", cor: "#3b82f6", limite: null, card: true },
  { chave: "rotacao", titulo: "Rotação", unidade: "RPM", cor: "#22c55e", limite: 45, card: true },
  { chave: "temperatura", titulo: "Temperatura", unidade: "°C", cor: "#f97316", limite: 40, card: true },
  { chave: "vibracao", titulo: "Vibração", unidade: "Hz", cor: "#eab308", limite: 40, card: false },
];

function obterEstado(sensor, valor) {
  if (valor === undefined) return { texto: "Aguardando", classe: "aguardando" };
  if (!sensor.limite) return { texto: "Monitorando", classe: "monitorando" };
  if (valor > sensor.limite) return { texto: "Em alerta", classe: "alerta" };
  return { texto: "Normal", classe: "normal" };
}

export default function Dashboard() {
  const [conectado, setConectado] = useState(false);
  const [ultimos, setUltimos] = useState({});
  const [historico, setHistorico] = useState([]);
  const [alertas, setAlertas] = useState(0);

  useEffect(() => {
    let ws;
    let timer;
    let ativo = true;

    function receber(dados) {
      const sensor = SENSORES.find((s) => s.chave === dados.medida);
      if (!sensor) return;

      const hora = new Date(dados.timestamp * 1000).toLocaleTimeString("pt-BR");

      setUltimos((atual) => ({ ...atual, [dados.medida]: dados.medicao }));

      // Cada mensagem traz um sensor só: copia o ponto anterior e troca o valor novo.
      setHistorico((atual) => [
        ...atual.slice(-(MAX_PONTOS - 1)),
        { ...atual.at(-1), hora, [dados.medida]: dados.medicao },
      ]);

      if (sensor.limite && dados.medicao > sensor.limite) {
        setAlertas((n) => n + 1);
      }
    }

    function conectar() {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => setConectado(true);
      ws.onmessage = (evento) => receber(JSON.parse(evento.data));
      ws.onclose = () => {
        setConectado(false);
        if (ativo) timer = setTimeout(conectar, 3000); // tenta reconectar
      };
    }

    conectar();

    return () => {
      ativo = false;
      clearTimeout(timer);
      ws.close();
    };
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-cards">
        {SENSORES.filter((s) => s.card).map((sensor) => {
          const valor = ultimos[sensor.chave];
          const estado = obterEstado(sensor, valor);

          return (
            <div key={sensor.chave} className={`dash-card ${estado.classe}`}>
              <p className="dash-titulo">{sensor.titulo}</p>
              <p className="dash-valor">
                {valor === undefined ? "--" : valor.toLocaleString("pt-BR")}
                <span className="dash-unidade"> {sensor.unidade}</span>
              </p>
              <p className="dash-status">{estado.texto}</p>
            </div>
          );
        })}

        <div className={`dash-card ${alertas > 0 ? "alerta" : "normal"}`}>
          <p className="dash-titulo">Alertas</p>
          <p className="dash-valor">{alertas}</p>
          <p className="dash-status">{alertas > 0 ? "Em alerta" : "Sem alertas"}</p>
        </div>
      </div>

      <div className="dash-grafico">
        <div className="dash-grafico-topo">
          <span>Monitoramento da sonda</span>
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
                <XAxis dataKey="hora" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "#151b20", border: "1px solid #293139" }}
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
    </div>
  );
}