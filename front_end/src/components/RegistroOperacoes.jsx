// src/components/RegistroOperacoes.jsx
import { useEffect, useMemo, useState } from "react";
import { FiEdit, FiX, FiSearch, FiActivity, FiClock, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import {
  API_OPERACOES_CONFIGURADA,
  STATUS_OPERACOES,
  buscarOperadores,
  buscarSondas,
  buscarOperacoes,
  registrarNovaOperacao,
  finalizarOperacao,
  rotuloSonda,
} from "../services/registroOperacoesService";
import "../styles/dadosBrutos.css";
import "../styles/RegistroOperacoes.css";

const HISTORICO_POR_PAGINA = 6;

function formatarDataHora(valor) {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Data indisponível";
  return data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
}

function normalizarBusca(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function classeStatus(status) {
  const chave = normalizarBusca(status);
  return ["operando", "manutencao", "finalizado"].includes(chave)
    ? `ro-status--${chave}`
    : "ro-status--indefinido";
}

function FormularioRegistro({ operadores, sondas, registros, erroCadastros, onFechar, onRegistrar }) {
  const [operadorSelecionado, setOperadorSelecionado] = useState("");
  const [sondaSelecionada, setSondaSelecionada] = useState("");
  const [status, setStatus] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const operadoresDisponiveis = status === "Finalizado"
    ? Array.from(new Map([
        ...operadores.map((p) => [String(p.id), p]),
        ...registros
          .filter((r) => !r.dataHoraFim && r.operadorId != null)
          .map((r) => [String(r.operadorId), { id: r.operadorId, nome: r.operadorNome || `Operador ${r.operadorId}` }])
      ]).values())
    : operadores;

  const disponivel = API_OPERACOES_CONFIGURADA && operadoresDisponiveis.length > 0 && sondas.length > 0;

  useEffect(() => {
    function fecharComEsc(evento) {
      if (evento.key === "Escape" && !enviando) onFechar();
    }
    window.addEventListener("keydown", fecharComEsc);
    return () => window.removeEventListener("keydown", fecharComEsc);
  }, [enviando, onFechar]);

  async function enviar(evento) {
    evento.preventDefault();
    const operador = operadoresDisponiveis.find((item) => String(item.id) === operadorSelecionado);
    const sonda = sondas.find((item) => String(item.id) === sondaSelecionada);

    if (!operador || !sonda || !STATUS_OPERACOES.includes(status)) {
      setErro("Selecione um operador, uma sonda e um status válidos.");
      return;
    }

    setEnviando(true);
    setErro("");
    try {
      await onRegistrar({ operadorId: operador.id, sondaId: sonda.id, status });
    } catch (falha) {
      setErro(falha.message || "Não foi possível registrar a operação.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="rop-overlay"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !enviando) onFechar();
      }}
    >
      <form className="rop-box" role="dialog" aria-modal="true" aria-labelledby="rop-titulo" onSubmit={enviar}>
        <button type="button" className="rop-fechar" aria-label="Fechar formulário" onClick={onFechar} disabled={enviando}>
          <FiX />
        </button>
        <h2 id="rop-titulo" className="rop-titulo">REGISTRAR OPERAÇÕES</h2>

        <div className="rop-campos">
          <label className="rop-campo">
            <span className="rop-label-visualmente-oculta">Operador</span>
            <select
              className="rop-select"
              value={operadorSelecionado}
              onChange={(e) => { setOperadorSelecionado(e.target.value); setErro(""); }}
              required
              disabled={enviando || operadoresDisponiveis.length === 0}
            >
              <option value="" disabled>Operador</option>
              {operadoresDisponiveis.map((item) => (
                <option key={String(item.id)} value={String(item.id)}>{item.nome}</option>
              ))}
            </select>
          </label>

          <label className="rop-campo">
            <span className="rop-label-visualmente-oculta">Equipamento</span>
            <select
              className="rop-select"
              value={sondaSelecionada}
              onChange={(e) => { setSondaSelecionada(e.target.value); setErro(""); }}
              required
              disabled={enviando || sondas.length === 0}
            >
              <option value="" disabled>Equipamento</option>
              {sondas.map((item) => (
                <option key={String(item.id)} value={String(item.id)}>{rotuloSonda(item)}</option>
              ))}
            </select>
          </label>

          <label className="rop-campo">
            <span className="rop-label-visualmente-oculta">Status</span>
            <select
              className="rop-select"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setErro(""); }}
              required
              disabled={enviando}
            >
              <option value="" disabled>Status</option>
              {STATUS_OPERACOES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        {!disponivel && (
          <p className="ro-form-aviso" role="status">
            {erroCadastros || "Aguardando Registro"}
          </p>
        )}
        {erro && <p className="rop-erro" role="alert">{erro}</p>}
        <button type="submit" className="rop-btn" disabled={enviando || !disponivel}>
          {enviando ? "Registrando..." : "Registrar"}
        </button>
      </form>
    </div>
  );
}

export default function RegistroOperacoes() {
  const [operadores, setOperadores] = useState([]);
  const [sondas, setSondas] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [filtroSonda, setFiltroSonda] = useState("");
  const [buscaNome, setBuscaNome] = useState("");
  const [pagina, setPagina] = useState(1);
  const [recarregar, setRecarregar] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erros, setErros] = useState({ operadores: "", sondas: "", operacoes: "" });
  const [sucesso, setSucesso] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    const controle = new AbortController();
    setCarregando(true);
    setErros({ operadores: "", sondas: "", operacoes: "" });

    if (!API_OPERACOES_CONFIGURADA) {
      setOperadores([]);
      setSondas([]);
      setRegistros([]);
      setCarregando(false);
      return () => controle.abort();
    }

    Promise.allSettled([
      buscarOperadores({ signal: controle.signal }),
      buscarSondas({ signal: controle.signal }),
      buscarOperacoes({ signal: controle.signal }),
    ]).then(([respOperadores, respSondas, respOperacoes]) => {
      if (controle.signal.aborted) return;
      setOperadores(respOperadores.status === "fulfilled" ? respOperadores.value : []);
      setSondas(respSondas.status === "fulfilled" ? respSondas.value : []);
      setRegistros(respOperacoes.status === "fulfilled" ? respOperacoes.value : []);
      setErros({
        operadores: respOperadores.status === "rejected" ? respOperadores.reason?.message || "Erro ao buscar operadores." : "",
        sondas: respSondas.status === "rejected" ? respSondas.reason?.message || "Erro ao buscar sondas." : "",
        operacoes: respOperacoes.status === "rejected" ? respOperacoes.reason?.message || "Erro ao buscar operações." : "",
      });
    }).finally(() => {
      if (!controle.signal.aborted) setCarregando(false);
    });

    return () => controle.abort();
  }, [recarregar]);

  useEffect(() => {
    if (!API_OPERACOES_CONFIGURADA) return;
    const timer = setInterval(() => {
      buscarSondas().then(setSondas).catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const sondasOrdenadas = useMemo(() => {
    return [...sondas].sort((a, b) => Number(a.id) - Number(b.id));
  }, [sondas]);

  const { cards, historico } = useMemo(() => {
    const operadoresPorId = new Map(operadores.map((p) => [String(p.id), p.nome]));
    const anteriores = [];

    const pertenceASonda = (registro, sonda) => {
      if (registro.sondaId !== null && registro.sondaId !== undefined) {
        return String(registro.sondaId) === String(sonda.id);
      }
      return Boolean(registro.sondaNome) &&
        normalizarBusca(registro.sondaNome) === normalizarBusca(sonda.nome);
    };

    const atuais = sondasOrdenadas.map((sonda) => {
      const operacoesDaSonda = registros
        .map((registro, indiceOriginal) => ({ registro, indiceOriginal }))
        .filter(({ registro }) => pertenceASonda(registro, sonda));

      const operacaoAtual = operacoesDaSonda.find(
        ({ registro }) =>
          !registro.dataHoraFim &&
          !["finalizado", "finalizada", "desligado", "desligada"].includes(normalizarBusca(registro.status))
      )?.registro;

      operacoesDaSonda
        .filter(({ registro }) => registro !== operacaoAtual)
        .forEach(({ registro, indiceOriginal }) => {
          anteriores.push({
            chave: `${sonda.id}-${registro.id ?? indiceOriginal}-${indiceOriginal}`,
            indiceOriginal,
            sonda,
            operadorNome: registro.operadorNome ||
              operadoresPorId.get(String(registro.operadorId)) || "Não informado",
            statusHistorico: "Finalizado",
            dataHoraInicio: registro.dataHoraInicio,
            dataHoraFim: registro.dataHoraFim,
          });
        });

      return {
        id: String(sonda.id),
        sonda,
        operacaoId: operacaoAtual?.id,
        operadorId: operacaoAtual?.operadorId,
        nomeOperador: operacaoAtual
          ? operacaoAtual.operadorNome || operadoresPorId.get(String(operacaoAtual.operadorId)) || "Não informado"
          : "Nenhum operador responsável",
        status: operacaoAtual?.status || "",
        temOperacao: Boolean(operacaoAtual),
      };
    });

    anteriores.sort((a, b) => {
      if (a.dataHoraFim && b.dataHoraFim) {
        return new Date(b.dataHoraFim) - new Date(a.dataHoraFim);
      }
      return a.indiceOriginal - b.indiceOriginal;
    });

    return { cards: atuais, historico: anteriores };
  }, [operadores, sondasOrdenadas, registros]);

  const termoBusca = normalizarBusca(buscaNome);
  const correspondeFiltro = (item, nomeOperador) =>
    (!filtroSonda || String(item.sonda.id) === filtroSonda) &&
    (!termoBusca || normalizarBusca(nomeOperador).includes(termoBusca));

  const cardsFiltrados = cards.filter((item) =>
    correspondeFiltro(item, item.nomeOperador)
  );
  const historicoFiltrado = historico.filter((item) =>
    correspondeFiltro(item, item.operadorNome)
  );

  const comFiltro = Boolean(filtroSonda || termoBusca);
  const semSondasCadastradas = !comFiltro && cards.length === 0;

  const totalPaginas = Math.max(
    2,
    1 + Math.ceil(historicoFiltrado.length / HISTORICO_POR_PAGINA)
  );
  const paginaAtual = Math.min(pagina, totalPaginas);
  const vendoHistorico = paginaAtual > 1;
  const inicioHistorico = (paginaAtual - 2) * HISTORICO_POR_PAGINA;
  const historicoDaPagina = vendoHistorico
    ? historicoFiltrado.slice(inicioHistorico, inicioHistorico + HISTORICO_POR_PAGINA)
    : [];

  function mudarPagina(novaPagina) {
    setPagina(Math.max(1, Math.min(totalPaginas, novaPagina)));
  }

  function alterarFiltros(setter, valor) {
    setter(valor);
    setPagina(1);
  }

  async function salvar(dados) {
    const registrosAtualizados = await buscarOperacoes();
    const operacaoAtual = registrosAtualizados.find(
      (registro) =>
        String(registro.sondaId) === String(dados.sondaId) &&
        !registro.dataHoraFim &&
        !["finalizado", "finalizada", "desligado", "desligada"].includes(normalizarBusca(registro.status))
    );

    if (dados.status === "Finalizado") {
      if (!operacaoAtual) {
        throw new Error("Esta sonda não possui uma operação em andamento.");
      }
      if (String(operacaoAtual.operadorId) !== String(dados.operadorId)) {
        throw new Error("Selecione o operador responsável pela operação atual.");
      }
      await finalizarOperacao(operacaoAtual.id);
      setSucesso("Operação finalizada com sucesso.");
    } else {
      if (operacaoAtual) {
        throw new Error("Finalize a operação atual antes de iniciar outra.");
      }
      await registrarNovaOperacao(dados);
      setSucesso("Operação registrada com sucesso.");
    }

    setModalAberto(false);
    setPagina(1);
    setRecarregar((n) => n + 1);
  }

  const erroCadastros = [erros.operadores, erros.sondas].filter(Boolean).join(" ");
  const erroGeral = [erros.operadores, erros.sondas, erros.operacoes].filter(Boolean).join(" ");

  const resumoContador = vendoHistorico
    ? `${historicoFiltrado.length} ${historicoFiltrado.length === 1 ? "registro anterior" : "registros anteriores"}`
    : `${cardsFiltrados.filter((item) => item.temOperacao).length} de ${cardsFiltrados.length} ${cardsFiltrados.length === 1 ? "sonda" : "sondas"} em operação`;

  return (
    <div className="dados-page ro-page">
      <div className="dados-content">
        <header className="dados-header">
          <div>
            <h1 className="dados-title">Registro de Operações</h1>
            <p className="dados-subtitle">Acompanhe o operador, equipamento e status de cada sonda.</p>
          </div>
          <button
            type="button"
            className="dados-btn-registro"
            onClick={() => { setSucesso(""); setModalAberto(true); }}
          >
            Registrar Operação <FiEdit aria-hidden="true" />
          </button>
        </header>

        <section className="dados-filtros" aria-label="Filtros de operação">
          <select
            className="filtro-box filtro-select"
            aria-label="Filtrar por equipamento"
            value={filtroSonda}
            onChange={(e) => alterarFiltros(setFiltroSonda, e.target.value)}
          >
            <option value="">Todos os equipamentos ({sondasOrdenadas.length})</option>
            {sondasOrdenadas.map((sonda) => (
              <option key={String(sonda.id)} value={String(sonda.id)}>{rotuloSonda(sonda)}</option>
            ))}
          </select>
          <div className="ro-busca">
            <input
              type="search"
              className="ro-busca-input"
              aria-label="Buscar pelo nome do operador"
              placeholder="Buscar operador..."
              value={buscaNome}
              onChange={(e) => alterarFiltros(setBuscaNome, e.target.value)}
            />
            <FiSearch className="ro-busca-icone" aria-hidden="true" />
          </div>
        </section>

        {sucesso && <p className="ro-sucesso" role="status">{sucesso}</p>}
        {!API_OPERACOES_CONFIGURADA && (
          <p className="ro-api-aviso" role="status">API ainda não configurada. Os cards serão preenchidos quando houver conexão.</p>
        )}
        {erroGeral && (
          <div className="ro-aviso-erro" role="alert">
            <span>Não foi possível carregar todas as informações. {erroGeral}</span>
            <button type="button" className="btn-tentar" onClick={() => setRecarregar((n) => n + 1)}>Tentar novamente</button>
          </div>
        )}

        <section className="ro-visualizacao" aria-label={vendoHistorico ? "Registros anteriores" : "Operações atuais"}>
          <div className="ro-visualizacao__topo">
            <div>
              <div className="ro-visualizacao__titulo-linha">
                <h2 className="ro-visualizacao__titulo">
                  {vendoHistorico ? <><FiClock aria-hidden="true" /> Registros anteriores</> : "Operações atuais"}
                </h2>
                <span className="ro-contador-badge">{resumoContador}</span>
              </div>
              <p className="ro-visualizacao__descricao">
                {vendoHistorico
                  ? "Operações anteriores das sondas, exibidas como finalizadas."
                  : `Acompanhe as últimas operações das ${sondasOrdenadas.length} sondas cadastradas.`}
              </p>
            </div>

            <div className="ro-visualizacao__acoes">
              {!vendoHistorico ? (
                <button type="button" className="ro-atalho" onClick={() => mudarPagina(2)}>
                  Ver registros anteriores <FiChevronRight aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className="ro-atalho" onClick={() => mudarPagina(1)}>
                  <FiChevronLeft aria-hidden="true" /> Voltar aos cards atuais
                </button>
              )}

              <nav className="ro-paginacao__controles" aria-label="Páginas do Registro de Operações">
                <button
                  type="button"
                  aria-label="Voltar uma página"
                  onClick={() => mudarPagina(paginaAtual - 1)}
                  disabled={paginaAtual === 1}
                >
                  <FiChevronLeft />
                </button>
                <span aria-live="polite">{paginaAtual} / {totalPaginas}</span>
                <button
                  type="button"
                  aria-label="Avançar uma página"
                  onClick={() => mudarPagina(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                >
                  <FiChevronRight />
                </button>
              </nav>
            </div>
          </div>

          {!vendoHistorico ? (
            <>
              <div className="ro-cards" aria-label="Cards das sondas" aria-busy={carregando}>
                {cardsFiltrados.map((item) => (
                  <article
                    className={`ro-card ${item.sonda.ativa ? "ro-card--ativa" : "ro-card--inativa"}`}
                    key={item.id}
                  >
                    <div className="ro-card__topo">
                      <div className="ro-card__identidade">
                        <span className="ro-card__icone" aria-hidden="true"><FiActivity /></span>
                        <div>
                          <span className="ro-card__rotulo">SONDA CADASTRADA</span>
                          <h3 className="ro-card__titulo">{item.sonda.nome}</h3>
                        </div>
                      </div>
                      <span className="ro-card__id">ID {item.sonda.id}</span>
                    </div>
                    <div className="ro-card__campos">
                      <div className="ro-card__linha">
                        <span>Operador</span>
                        <strong className={!item.temOperacao ? "ro-texto-neutro" : ""}>
                          {erros.operacoes ? "Indisponível" : item.nomeOperador}
                        </strong>
                      </div>
                      <div className="ro-card__linha">
                        <span>Equipamento</span>
                        <strong>{rotuloSonda(item.sonda)}</strong>
                      </div>
                      <div className="ro-card__linha">
                        <span>Conexão Sonda</span>
                        <strong className={`ro-status ${item.sonda.ativa ? "ro-status--operando" : "ro-status--desligado"}`}>
                          {item.sonda.ativa ? "Ativa" : "Inativa"}
                        </strong>
                      </div>
                      <div className="ro-card__linha">
                        <span>Status</span>
                        <strong className={`ro-status ${classeStatus(item.status)}`}>
                          {erros.operacoes ? "Indisponível" : item.temOperacao ? item.status || "Não informado" : "Sem registro"}
                        </strong>
                      </div>
                    </div>
                  </article>
                ))}

                {semSondasCadastradas && (
                  <article className="ro-card ro-card--vazio">
                    <div className="ro-card__topo">
                      <span className="ro-card__icone" aria-hidden="true"><FiActivity /></span>
                      <h3 className="ro-card__titulo">
                        {carregando ? "Carregando sondas..." : "Aguardando sonda cadastrada"}
                      </h3>
                    </div>
                    <div className="ro-card__campos">
                      <div className="ro-card__linha"><span>Operador</span><strong>—</strong></div>
                      <div className="ro-card__linha"><span>Equipamento</span><strong>—</strong></div>
                      <div className="ro-card__linha"><span>Conexão Sonda</span><strong>—</strong></div>
                      <div className="ro-card__linha"><span>Status</span><strong>—</strong></div>
                    </div>
                  </article>
                )}
              </div>
              {!carregando && comFiltro && cardsFiltrados.length === 0 && (
                <p className="ro-resultado-vazio">Nenhuma sonda encontrada para os filtros selecionados.</p>
              )}
            </>
          ) : (
            historicoDaPagina.length > 0 ? (
              <div className="ro-cards ro-cards--historico" aria-label="Cards de operações anteriores" aria-busy={carregando}>
                {historicoDaPagina.map((item) => (
                  <article className="ro-card ro-card--historico" key={item.chave}>
                    <div className="ro-card__topo">
                      <div className="ro-card__identidade">
                        <span className="ro-card__icone" aria-hidden="true"><FiClock /></span>
                        <div>
                          <span className="ro-card__rotulo">OPERAÇÃO ANTERIOR</span>
                          <h3 className="ro-card__titulo">{item.sonda.nome}</h3>
                        </div>
                      </div>
                      <span className="ro-card__id">ID {item.sonda.id}</span>
                    </div>
                    <div className="ro-card__campos">
                      <div className="ro-card__linha">
                        <span>Operador</span><strong>{item.operadorNome}</strong>
                      </div>
                      <div className="ro-card__linha">
                        <span>Equipamento</span><strong>{rotuloSonda(item.sonda)}</strong>
                      </div>
                      <div className="ro-card__linha">
                        <span>Início da operação</span>
                        <strong>{formatarDataHora(item.dataHoraInicio)}</strong>
                      </div>
                      <div className="ro-card__linha">
                        <span>Finalização da operação</span>
                        <strong>{formatarDataHora(item.dataHoraFim)}</strong>
                      </div>
                      <div className="ro-card__linha">
                        <span>Situação do registro</span>
                        <strong className="ro-status ro-status--finalizado">{item.statusHistorico}</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="ro-historico__vazio" role="status">
                {carregando
                  ? "Carregando histórico..."
                  : erros.operacoes
                  ? "Não foi possível consultar as operações anteriores."
                  : !API_OPERACOES_CONFIGURADA
                  ? "O histórico aparecerá aqui quando a API estiver disponível."
                  : "Nenhum registro anterior para os filtros selecionados."}
              </div>
            )
          )}
        </section>
      </div>

      {modalAberto && (
        <FormularioRegistro
          operadores={operadores}
          sondas={sondasOrdenadas}
          registros={registros}
          erroCadastros={erroCadastros}
          onFechar={() => setModalAberto(false)}
          onRegistrar={salvar}
        />
      )}
    </div>
  );
}