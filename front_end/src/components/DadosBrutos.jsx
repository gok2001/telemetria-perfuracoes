import { useState, useEffect } from "react";
import {
  FiEdit,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import {
  buscarDadosBrutos,
  registrarOperacao,
  EQUIPAMENTOS,
} from "../services/dadosBrutosService";
import RegistroOperacaoModal from "./RegistroOperacaoModal";
import "../styles/dadosBrutos.css";

const POR_PAGINA = 10;

const COLUNAS = [
  "Data/Hora",
  "Equipamento",
  "Vibração",
  "Temperatura",
  "Profundidade (m)",
  "Rotação",
];

function doisDigitos(n) {
  return String(n).padStart(2, "0");
}

function formatarDataHora(data) {
  if (!data) return "-";
  return `${doisDigitos(data.getDate())}/${doisDigitos(
    data.getMonth() + 1
  )}/${data.getFullYear()}  ${doisDigitos(data.getHours())}:${doisDigitos(
    data.getMinutes()
  )}`;
}

// "2021-08-19": usado para comparar com os filtros de data
function diaDe(data) {
  if (!data) return "";
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(
    data.getDate()
  )}`;
}

// Mostra "-" quando o dado não veio da API
function valor(v, sufixo = "") {
  return v === null || v === undefined || v === "" ? "-" : `${v}${sufixo}`;
}

// Gera os números da paginação: 1 2 3 ... 13
function paginasVisiveis(atual, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (atual <= 3) return [1, 2, 3, "...", total];
  if (atual >= total - 2) return [1, "...", total - 2, total - 1, total];
  return [1, "...", atual, "...", total];
}

export default function DadosBrutos() {
  // Dados vindos da API
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroApi, setErroApi] = useState("");
  const [recarregar, setRecarregar] = useState(0); // muda para buscar de novo

  // Registro de operação
  const [modalAberto, setModalAberto] = useState(false);

  // Filtros
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [pagina, setPagina] = useState(1);

  // Busca os dados quando a tela abre (e quando precisar atualizar)
  useEffect(() => {
    const controle = new AbortController();
    setCarregando(true);
    setErroApi("");

    buscarDadosBrutos({ signal: controle.signal })
      .then(setDados)
      .catch((erro) => {
        if (erro.name === "AbortError") return;
        setErroApi("Não foi possível carregar os dados.");
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });

    return () => controle.abort();
  }, [recarregar]);

  // Chamado pelo pop-up de Registro Operação
  async function registrar(dadosForm) {
    await registrarOperacao(dadosForm); // se falhar, o pop-up mostra o erro
    setModalAberto(false);
    setRecarregar((n) => n + 1); // busca a lista de novo, já com o registro
  }

  // Ao mudar qualquer filtro, volta para a página 1
  function alterar(setter) {
    return (e) => {
      setter(e.target.value);
      setPagina(1);
    };
  }

  // Aplica somente os filtros de período e equipamento
  const filtrados = dados.filter((item) => {
    const dia = diaDe(item.data);
    if ((dataInicio || dataFim) && !dia) return false;
    if (dataInicio && dia < dataInicio) return false;
    if (dataFim && dia > dataFim) return false;
    if (equipamento && item.equipamento !== equipamento) return false;
    return true;
  });

  // Paginação
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const visiveis = filtrados.slice(inicio, inicio + POR_PAGINA);
  // completa com linhas vazias, para a tabela manter sempre a mesma altura
  const linhas = [...visiveis, ...Array(POR_PAGINA - visiveis.length).fill(null)];

  // Mensagem que aparece na primeira linha quando não há dados para mostrar
  const mensagem = carregando
    ? "Carregando dados..."
    : erroApi
    ? erroApi
    : filtrados.length === 0
    ? "Nenhum registro encontrado."
    : "";

  return (
    <div className="dados-page">
      <div className="dados-content">
        {/* ===== Parte 1: cabeçalho ===== */}
        <header className="dados-header">
          <div>
            <h1 className="dados-title">Dados Brutos</h1>
            <p className="dados-subtitle">
              Visualize e filtre todos os dados coletados.
            </p>
          </div>

          <button
            type="button"
            className="dados-btn-registro"
            onClick={() => setModalAberto(true)}
          >
            Registro Operação
            <FiEdit />
          </button>
        </header>

        {/* ===== Parte 2: filtros ===== */}
        <section className="dados-filtros" aria-label="Filtros">
          <div className="filtro-box filtro-data">
            <input
              type="date"
              aria-label="Data inicial"
              value={dataInicio}
              onChange={alterar(setDataInicio)}
            />
            <span>a</span>
            <input
              type="date"
              aria-label="Data final"
              value={dataFim}
              onChange={alterar(setDataFim)}
            />
          </div>

          <select
            className="filtro-box filtro-select"
            aria-label="Equipamento"
            value={equipamento}
            onChange={alterar(setEquipamento)}
          >
            <option value="">Todos os equipamentos</option>
            {EQUIPAMENTOS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

        </section>

        {/* ===== Parte 3: tabela ===== */}
        <div className="dados-tabela-wrap">
          <table className="dados-tabela">
            <thead>
              <tr>
                {COLUNAS.map((coluna) => (
                  <th key={coluna}>{coluna}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((item, i) =>
                item ? (
                  <tr key={item.id}>
                    <td>{formatarDataHora(item.data)}</td>
                    <td>{valor(item.equipamento)}</td>
                    <td>{valor(item.vibracao, " mm")}</td>
                    <td>{valor(item.temperatura, " °C")}</td>
                    <td>
                      {typeof item.profundidade === "number"
                        ? `${item.profundidade.toLocaleString("pt-BR")} (m)`
                        : valor(item.profundidade)}
                    </td>
                    <td>{valor(item.rotacao, " RPM")}</td>
                  </tr>
                ) : (
                  <tr key={`vazio-${i}`} className="linha-vazia">
                    {i === 0 && mensagem ? (
                      <td colSpan={COLUNAS.length} className="linha-aviso">
                        {mensagem}
                        {erroApi && (
                          <button
                            type="button"
                            className="btn-tentar"
                            onClick={() => setRecarregar((n) => n + 1)}
                          >
                            Tentar novamente
                          </button>
                        )}
                      </td>
                    ) : (
                      <td colSpan={COLUNAS.length}>&nbsp;</td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* ===== Parte 4: paginação ===== */}
        <footer className="dados-rodape">
          <p className="dados-contagem">
            {carregando
              ? "Carregando registros..."
              : filtrados.length === 0
              ? "Nenhum registro encontrado."
              : `Mostrando de ${inicio + 1} a ${
                  inicio + visiveis.length
                } de ${filtrados.length} registros.`}
          </p>

          <nav className="dados-paginacao" aria-label="Paginação">
            <button
              type="button"
              className="pag-seta"
              onClick={() => setPagina(paginaAtual - 1)}
              disabled={paginaAtual === 1}
              aria-label="Página anterior"
            >
              <FiChevronLeft />
            </button>

            {paginasVisiveis(paginaAtual, totalPaginas).map((p, i) =>
              p === "..." ? (
                <span key={`pontos-${i}`} className="pag-pontos">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  className={`pag-num ${p === paginaAtual ? "pag-num--ativo" : ""}`}
                  onClick={() => setPagina(p)}
                  aria-current={p === paginaAtual ? "page" : undefined}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              className="pag-seta"
              onClick={() => setPagina(paginaAtual + 1)}
              disabled={paginaAtual === totalPaginas}
              aria-label="Próxima página"
            >
              <FiChevronRight />
            </button>
          </nav>
        </footer>
      </div>

      {/* Pop-up de Registro Operação */}
      {modalAberto && (
        <RegistroOperacaoModal
          onFechar={() => setModalAberto(false)}
          onRegistrar={registrar}
          operadoresDisponiveis={[...new Set(dados.map((item) => item.operador?.trim()).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, "pt-BR"))}
        />
      )}
    </div>
  );
}