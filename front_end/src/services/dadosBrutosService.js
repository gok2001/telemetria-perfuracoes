// src/services/dadosBrutosService.js
// Busca e registra dados. Entrega tudo num formato único para a tela,
// não importa como o back-end nomeia os campos.

// Endereço do back-end. Configure no arquivo .env (na raiz do front_end):
//   VITE_API_URL=http://localhost:3000
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// AJUSTE AQUI: rotas da API
const ROTA_DADOS_BRUTOS = "/dados-brutos";
const ROTA_OPERACOES = "/operacoes";

// true  = funciona SEM back-end (dados de exemplo + registros salvos no navegador)
// false = usa a API de verdade. Troque quando o back-end estiver pronto.
const MODO_LOCAL = true;

// Sondas disponíveis
export const EQUIPAMENTOS = ["Sonda 01", "Sonda 02", "Sonda 03"];

// Mesmos nomes da legenda da tela
export const STATUS = [ "Operando", "Manutenção", "Desligada"];

function semAcento(texto) {
  return String(texto ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Aceita "alerta", "ALERTA", "manutencao"... e devolve o nome certo da legenda
function normalizarStatus(valor) {
  const achado = STATUS.find((s) => semAcento(s) === semAcento(valor));
  return achado ?? String(valor ?? "");
}

// Aceita "sonda 01", "Sonda01", "SONDA 1"... e devolve "Sonda 01"
function normalizarEquipamento(valor) {
  const chave = (t) => semAcento(t).replace(/\s+/g, "");
  const achado = EQUIPAMENTOS.find((e) => chave(e) === chave(valor));
  return achado ?? String(valor ?? "");
}

function numero(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isNaN(n) ? null : n;
}

// AJUSTE AQUI: de-para dos campos que vêm da API para os campos da tela.
function normalizar(item, indice) {
  const bruto = item.dataHora ?? item.data_hora ?? item.timestamp ?? item.data;
  const data = bruto ? new Date(bruto) : null;

  return {
    id: item.id ?? indice,
    data: data && !Number.isNaN(data.getTime()) ? data : null,
    equipamento: normalizarEquipamento(
      item.equipamento ?? item.nome_equipamento
    ),
    vibracao: numero(item.vibracao ?? item.vibração),
    temperatura: numero(item.temperatura),
    profundidade: numero(item.profundidade),
    rotacao: numero(item.rotacao ?? item.rotação ?? item.rpm),
    status: normalizarStatus(item.status),
    operador: item.operador ?? item.nome_operador ?? "",
  };
}

// ---------- MODO LOCAL (sem back-end) ----------

const CHAVE_LOCAL = "drilltrack:registros-operacao";

function lerRegistrosLocais() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_LOCAL)) ?? [];
  } catch {
    return [];
  }
}

function salvarRegistroLocal(registro) {
  try {
    const atuais = lerRegistrosLocais();
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify([registro, ...atuais]));
  } catch {
    // sem armazenamento disponível: o registro vale só até recarregar a página
  }
}

// Leituras de exemplo. A Sonda 02 tem temperatura média acima do limite,
// para você ver o alerta aparecer.
function gerarDadosExemplo() {
  const operadores = ["Enzo José", "Maria Souza", "Carlos Lima"];

  return Array.from({ length: 30 }, (_, i) => {
    const sonda = i % 3;
    const ordem = Math.floor(i / 3); // 0 = leitura mais recente da sonda

    return {
      id: `exemplo-${i}`,
      dataHora: new Date(Date.now() - i * 15 * 60 * 1000).toISOString(),
      equipamento: EQUIPAMENTOS[sonda],
      vibracao: 800 + (i % 7) * 60,
      temperatura:
        sonda === 1 ? 118 + (ordem % 5) * 6 : 88 + (ordem % 5) * 5,
      profundidade: 3000 + i * 25,
      rotacao: 2800 + (i % 5) * 150,
      operador: operadores[sonda],
    };
  });
}

// ---------- Funções usadas pela tela ----------

// Busca e devolve a lista pronta (mais recentes primeiro)
export async function buscarDadosBrutos({ signal } = {}) {
  let lista;

  if (MODO_LOCAL) {
    lista = [...lerRegistrosLocais(), ...gerarDadosExemplo()];
  } else {
    const resposta = await fetch(`${API_URL}${ROTA_DADOS_BRUTOS}`, { signal });
    if (!resposta.ok) {
      throw new Error(`Erro ${resposta.status} ao buscar os dados.`);
    }
    const json = await resposta.json();
    // aceita tanto [ ... ] quanto { dados: [ ... ] } ou { data: [ ... ] }
    lista = Array.isArray(json) ? json : json.dados ?? json.data ?? [];
  }

  return lista
    .map(normalizar)
    .sort((a, b) => (b.data?.getTime() ?? 0) - (a.data?.getTime() ?? 0));
}

// Registro de operação: salva o operador, a sonda e o status selecionado.
export async function registrarOperacao({ operador, equipamento, status }) {
  if (!operador?.trim() || !EQUIPAMENTOS.includes(equipamento) || !STATUS.includes(status)) {
    throw new Error("Dados do registro de operação inválidos.");
  }

  const corpo = {
    dataHora: new Date().toISOString(),
    operador: operador.trim(),
    equipamento,
    status,
  };

  if (MODO_LOCAL) {
    salvarRegistroLocal({ id: `local-${Date.now()}`, ...corpo });
    return corpo;
  }

  const resposta = await fetch(`${API_URL}${ROTA_OPERACOES}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status} ao registrar a operação.`);
  }
  return resposta.json();
}