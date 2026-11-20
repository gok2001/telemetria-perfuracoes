

const API_URL = String(import.meta.env.VITE_API_URL "10.110.12.44:8001")
  .trim()
  .replace(/\/+$/, "");

const ROTA_DADOS_BRUTOS =
  import.meta.env.VITE_DADOS_BRUTOS_PATH ?? "/dados-brutos";

const ROTA_OPERACOES =
  import.meta.env.VITE_OPERACOES_PATH ?? "/operacoes";

// Sem endereço configurado, a tabela permanece vazia.
export const API_CONFIGURADA = Boolean(API_URL);

// Equipamentos previstos no projeto.
export const EQUIPAMENTOS = [
  "Sonda 01",
  "Sonda 02",
  "Sonda 03"
];

export const STATUS = [
  "Operando",
  "Manutenção",
  "Desligada"
];

function semAcento(texto) {
  return String(texto ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarStatus(valor) {
  const achado = STATUS.find(
    (s) => semAcento(s) === semAcento(valor)
  );

  return achado ?? String(valor ?? "");
}

function normalizarEquipamento(valor) {
  const chave = (t) =>
    semAcento(t).replace(/\s+/g, "");

  const achado = EQUIPAMENTOS.find(
    (e) => chave(e) === chave(valor)
  );

  return achado ?? String(valor ?? "");
}

function numero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const n = Number(valor);

  return Number.isFinite(n) ? n : null;
}

// Adapte os campos conforme a API real.
function normalizar(item, indice) {
  const bruto =
    item.dataHora ??
    item.data_hora ??
    item.timestamp ??
    item.data;

  const data = bruto ? new Date(bruto) : null;

  return {
    id: item.id ?? indice,

    data:
      data && !Number.isNaN(data.getTime())
        ? data
        : null,

    equipamento: normalizarEquipamento(
      item.equipamento ?? item.nome_equipamento
    ),

    vibracao: numero(
      item.vibracao ?? item.vibração
    ),

    temperatura: numero(item.temperatura),

    profundidade: numero(item.profundidade),

    rotacao: numero(
      item.rotacao ?? item.rotação ?? item.rpm
    ),

    status: normalizarStatus(item.status),

    operador:
      item.operador ?? item.nome_operador ?? "",
  };
}

function validarLista(json) {
  const lista = Array.isArray(json)
    ? json
    : json?.dados ??
      json?.data ??
      json?.registros ??
      json?.content;

  if (!Array.isArray(lista)) {
    throw new Error(
      "A API retornou um formato inesperado para as leituras."
    );
  }

  return lista;
}

// Busca exclusivamente dados reais da API.
export async function buscarDadosBrutos({ signal } = {}) {
  if (!API_CONFIGURADA) {
    return [];
  }

  const resposta = await fetch(
    `${API_URL}${ROTA_DADOS_BRUTOS}`,
    { signal }
  );

  if (!resposta.ok) {
    throw new Error(
      `Erro ${resposta.status} ao buscar leituras na API.`
    );
  }

  const lista = validarLista(await resposta.json());

  return lista
    .map(normalizar)
    .sort(
      (a, b) =>
        (b.data?.getTime() ?? 0) -
        (a.data?.getTime() ?? 0)
    );
}

// Função disponível para futura integração de operações.
export async function registrarOperacao({
  operador,
  equipamento,
  status
}) {
  if (
    !operador?.trim() ||
    !EQUIPAMENTOS.includes(equipamento) ||
    !STATUS.includes(status)
  ) {
    throw new Error(
      "Preencha operador, equipamento e status válidos."
    );
  }

  if (!API_CONFIGURADA) {
    throw new Error(
      "Aguardando"
    );
  }

  const corpo = {
    dataHora: new Date().toISOString(),
    operador: operador.trim(),
    equipamento,
    status,
  };

  const resposta = await fetch(
    `${API_URL}${ROTA_OPERACOES}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(corpo),
    }
  );

  if (!resposta.ok) {
    throw new Error(
      `Erro ${resposta.status} ao registrar operação na API.`
    );
  }

  if (resposta.status === 204) {
    return corpo;
  }

  const texto = await resposta.text();

  return texto ? JSON.parse(texto) : corpo;
}
