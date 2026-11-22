const API_URL = String(import.meta.env.VITE_API_URL ?? "http://localhost:8080/api")
  .trim()
  .replace(/\/+$/, "");

const SERIAL_API_URL = String(import.meta.env.VITE_SERIAL_API_URL ?? "http://localhost:8001")
  .trim()
  .replace(/\/+$/, "");

const ROTAS = {
  usuarios: import.meta.env.VITE_OPERADORES_PATH || "/usuarios",
  sondas: import.meta.env.VITE_SONDAS_PATH || "/sondas",
  operacoes: import.meta.env.VITE_OPERACOES_PATH || "/operacoes",
};

export const API_OPERACOES_CONFIGURADA = Boolean(API_URL);
export const STATUS_OPERACOES = ["Operando", "Manutenção", "Desligado"];

const TEMPO_LIMITE_INATIVIDADE_MS = 10000; // 10 segundos sem dados = Inativa
const codigosEmCadastro = new Set();

const STATUS_PARA_ENUM = {
  Operando: "OPERANDO",
  Manutenção: "MANUTENCAO",
  Desligado: "DESLIGADO",
};

function endereco(rota) {
  return `${API_URL}/${String(rota).replace(/^\/+/, "")}`;
}

async function requisitar(rota, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(endereco(rota), opcoes);
  } catch (erro) {
    if (erro?.name === "AbortError") throw erro;
    throw new Error("Não foi possível conectar ao back-end Java (porta 8080).");
  }

  if (!resposta.ok) {
    const detalhe = await resposta.json().catch(() => null);
    throw new Error(detalhe?.message || `API respondeu HTTP ${resposta.status} na rota ${rota}.`);
  }

  if (resposta.status === 204) return null;
  const texto = await resposta.text();
  if (!texto.trim()) return null;

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(`A rota ${rota} não retornou JSON válido.`);
  }
}

function extrairLista(resposta, tipo) {
  if (Array.isArray(resposta)) return resposta;
  const candidatos = [resposta?.[tipo], resposta?.dados, resposta?.data, resposta?.items, resposta?.content];
  const lista = candidatos.find(Array.isArray);
  if (!lista) throw new Error(`A API de ${tipo} não retornou uma lista válida.`);
  return lista;
}

function formatarCodigoSonda(machineId) {
  return `SND-${String(machineId).padStart(2, "0")}`;
}

function formatarNomeSonda(machineId) {
  return `Sonda ${String(machineId).padStart(2, "0")}`;
}

function extrairNumeroSonda(sonda) {
  const matchCodigo = String(sonda.codigo ?? "").match(/(\d+)/);
  if (matchCodigo) return Number(matchCodigo[1]);
  const matchNome = String(sonda.nome ?? "").match(/(\d+)/);
  if (matchNome) return Number(matchNome[1]);
  return Number(sonda.id);
}

async function atualizarStatusSondaNoBanco(sondaId, statusBanco) {
  try {
    await requisitar(`${ROTAS.sondas}/${sondaId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusBanco }),
    });
  } catch {
    // Ignora silenciosamente se o endpoint PATCH ainda não foi criado no Java
  }
}

/**
 * Sincroniza cada sonda individualmente com a API Python (Arduino):
 * 1. Cadastra no Java se uma nova machine_id aparecer transmitindo.
 * 2. Marca cada sonda como ATIVA (<= 10s desde a última leitura) ou INATIVA (> 10s).
 * 3. Persiste a mudança de status no banco Java via PATCH /api/sondas/{id}/status.
 */
export async function sincronizarSondasComTelemetria(sondasExistentes = []) {
  const mapaAtividade = new Map();

  try {
    const respPython = await fetch(`${SERIAL_API_URL}/api/dashboard?limite=1`);
    if (!respPython.ok) return { mudouNoBanco: false, mapaAtividade };

    const dadosPython = await respPython.json();
    const maquinas = Array.isArray(dadosPython?.maquinas) ? dadosPython.maquinas : [];

    const sondasPorCodigo = new Map(
      sondasExistentes.map((s) => [String(s.codigo ?? "").toUpperCase(), s])
    );

    let mudouNoBanco = false;
    const agora = Date.now();

    // 1. Verifica todas as sondas que já enviaram dados hoje no Python
    for (const maquina of maquinas) {
      const mId = Number(maquina.machine_id);
      if (!Number.isFinite(mId)) continue;

      const ultimaLeitura = maquina.historico?.[maquina.historico.length - 1];
      const tsLeitura = ultimaLeitura?.timestamp ? new Date(ultimaLeitura.timestamp).getTime() : 0;
      const ativa = tsLeitura > 0 && agora - tsLeitura <= TEMPO_LIMITE_INATIVIDADE_MS;
      mapaAtividade.set(mId, ativa);

      const codigo = formatarCodigoSonda(mId);
      const nome = formatarNomeSonda(mId);
      const existente = sondasPorCodigo.get(codigo);

      if (!existente && !codigosEmCadastro.has(codigo)) {
        codigosEmCadastro.add(codigo);
        try {
          await requisitar(ROTAS.sondas, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigo, nome }),
          });
          mudouNoBanco = true;
        } finally {
          codigosEmCadastro.delete(codigo);
        }
      } else if (existente) {
        const statusDesejado = ativa ? "ATIVA" : "INATIVA";
        const statusAtualBanco = String(existente.status ?? "").toUpperCase();
        if (statusAtualBanco && statusAtualBanco !== statusDesejado) {
          await atualizarStatusSondaNoBanco(existente.id, statusDesejado);
          mudouNoBanco = true;
        }
      }
    }

    // 2. Se alguma sonda já cadastrada no Java não apareceu no CSV de hoje, garante status INATIVA
    for (const sonda of sondasExistentes) {
      const numero = extrairNumeroSonda(sonda);
      if (!mapaAtividade.has(numero)) {
        mapaAtividade.set(numero, false);
        const statusAtualBanco = String(sonda.status ?? "").toUpperCase();
        if (statusAtualBanco && statusAtualBanco !== "INATIVA") {
          await atualizarStatusSondaNoBanco(sonda.id, "INATIVA");
          mudouNoBanco = true;
        }
      }
    }

    return { mudouNoBanco, mapaAtividade };
  } catch {
    return { mudouNoBanco: false, mapaAtividade };
  }
}

function statusParaExibicao(valor) {
  const chave = String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (chave === "OPERANDO") return "Operando";
  if (chave === "MANUTENCAO") return "Manutenção";
  if (chave === "DESLIGADO" || chave === "DESLIGADA") return "Desligado";
  return String(valor ?? "").trim();
}

export async function buscarOperadores({ signal } = {}) {
  const resposta = await requisitar(ROTAS.usuarios, { signal });
  const lista = extrairLista(resposta, "usuarios");

  return lista
    .filter((item) => item?.cargo === "OPERADOR" && item?.status !== "INATIVO")
    .map((item) => ({
      id: item.id,
      nome: String(item.nome ?? "").trim(),
    }))
    .filter((item) => item.id !== null && item.id !== undefined && item.nome);
}

export async function buscarSondas({ signal } = {}) {
  let resposta = await requisitar(ROTAS.sondas, { signal });
  let lista = extrairLista(resposta, "sondas");

  const { mudouNoBanco, mapaAtividade } = await sincronizarSondasComTelemetria(lista);

  if (mudouNoBanco) {
    resposta = await requisitar(ROTAS.sondas, { signal });
    lista = extrairLista(resposta, "sondas");
  }

  return lista
    .map((item) => {
      const numeroSonda = extrairNumeroSonda(item);
      const ativa = mapaAtividade.has(numeroSonda)
        ? mapaAtividade.get(numeroSonda)
        : String(item.status ?? "").toUpperCase() === "ATIVA";

      return {
        id: item.id,
        codigo: item.codigo,
        nome: String(item.nome ?? "").trim() || `Sonda #${item.id}`,
        statusBanco: item.status,
        ativa,
      };
    })
    .filter((item) => item.id !== null && item.id !== undefined);
}

export function rotuloSonda(sonda) {
  const estado = sonda.ativa ? "Ativa" : "Inativa";
  return sonda.codigo
    ? `${sonda.nome} (${sonda.codigo}) — ${estado}`
    : `${sonda.nome} — ID ${sonda.id} (${estado})`;
}

export async function buscarOperacoes({ signal } = {}) {
  const resposta = await requisitar(ROTAS.operacoes, { signal });
  const lista = extrairLista(resposta, "operacoes");

  return lista
    .map((item) => ({
      id: item.id,
      operadorId: item.usuarioId,
      operadorNome: String(item.operador ?? "").trim(),
      sondaId: item.sondaId,
      sondaNome: String(item.sonda ?? "").trim(),
      status: statusParaExibicao(item.status),
      dataHoraInicio: item.dataHoraInicio,
      dataHoraFim: item.dataHoraFim,
    }))
    .sort((a, b) => Number(b.id) - Number(a.id));
}

export async function registrarNovaOperacao({ operadorId, sondaId, status }) {
  const statusEnum = STATUS_PARA_ENUM[status];
  if (!operadorId || !sondaId || !statusEnum) {
    throw new Error("Selecione um operador, uma sonda e um status válidos.");
  }

  await requisitar(ROTAS.operacoes, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuarioId: Number(operadorId),
      sondaId: Number(sondaId),
      status: statusEnum,
    }),
  });

  return true;
}