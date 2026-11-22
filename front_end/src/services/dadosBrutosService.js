// src/services/dadosBrutosService.js
// Integração com a API Edge Python (serial-api) para histórico de leituras CSV.

const SERIAL_API_URL = String(
  import.meta.env.VITE_SERIAL_API_URL ?? "http://localhost:8001"
)
  .trim()
  .replace(/\/+$/, "");

const ROTA_DADOS_BRUTOS =
  import.meta.env.VITE_DADOS_BRUTOS_PATH ?? "/api/dados-brutos";

export const API_CONFIGURADA = Boolean(SERIAL_API_URL);

export const EQUIPAMENTOS = ["Sonda 01", "Sonda 02", "Sonda 03"];

export const STATUS = ["Operando", "Manutenção", "Desligada"];

function semAcento(texto) {
  return String(texto ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarStatus(valor) {
  const achado = STATUS.find((s) => semAcento(s) === semAcento(valor));
  return achado ?? String(valor ?? "");
}

function normalizarEquipamento(valor) {
  const chave = (t) => semAcento(t).replace(/\s+/g, "");
  const achado = EQUIPAMENTOS.find((e) => chave(e) === chave(valor));
  return achado ?? String(valor ?? "");
}

function numero(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }
  const n = Number(valor);
  return Number.isFinite(n) ? round2(n) : null;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function normalizar(item, indice) {
  const bruto =
    item.timestamp ??
    item.dataHora ??
    item.data_hora ??
    item.data;

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

function validarLista(json) {
  const lista = Array.isArray(json)
    ? json
    : json?.dados ?? json?.data ?? json?.registros ?? json?.content;

  if (!Array.isArray(lista)) {
    throw new Error("A API retornou um formato inesperado para as leituras.");
  }

  return lista;
}

export async function buscarDadosBrutos({ signal } = {}) {
  if (!API_CONFIGURADA) {
    return [];
  }

  const resposta = await fetch(`${SERIAL_API_URL}${ROTA_DADOS_BRUTOS}`, {
    signal,
  });

  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status} ao buscar leituras na API.`);
  }

  const lista = validarLista(await resposta.json());

  return lista
    .map(normalizar)
    .sort((a, b) => (b.data?.getTime() ?? 0) - (a.data?.getTime() ?? 0));
}