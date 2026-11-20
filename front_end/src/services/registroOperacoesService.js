
 // src/services/registroOperacoesService.js
// Somente dados reais.
// Nenhuma informação é simulada ou salva no localStorage.

const API_URL = String(import.meta.env.VITE_API_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

const ROTAS = {
  operadores:
    import.meta.env.VITE_OPERADORES_PATH || "/operadores",

  sondas:
    import.meta.env.VITE_SONDAS_PATH || "/sondas",

  operacoes:
    import.meta.env.VITE_OPERACOES_PATH || "/operacoes",
};

export const API_OPERACOES_CONFIGURADA = Boolean(API_URL);

export const STATUS_OPERACOES = [
  "Operando",
  "Manutenção",
  "Desligado"
];

function endereco(rota) {
  return `${API_URL}/${String(rota).replace(/^\/+/, "")}`;
}

async function requisitar(rota, opcoes = {}) {
  if (!API_OPERACOES_CONFIGURADA) {
    throw new Error(
      "Configure VITE_API_URL no arquivo front_end/.env."
    );
  }

  let resposta;

  try {
    resposta = await fetch(endereco(rota), opcoes);
  } catch (erro) {
    if (erro?.name === "AbortError") {
      throw erro;
    }

    throw new Error(
      "Não foi possível conectar à API. Confira a rede e a rota configurada."
    );
  }

  if (!resposta.ok) {
    throw new Error(
      `API respondeu HTTP ${resposta.status} na rota ${rota}.`
    );
  }

  if (resposta.status === 204 || opcoes.method === "POST") {
    return null;
  }

  const texto = await resposta.text();

  if (!texto.trim()) {
    return null;
  }

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(
      `A rota ${rota} não retornou JSON válido.`
    );
  }
}

function extrairLista(resposta, tipo) {
  if (Array.isArray(resposta)) {
    return resposta;
  }

  const candidatos = [
    resposta?.[tipo],
    resposta?.dados,
    resposta?.data,
    resposta?.items,
    resposta?.content,
    resposta?.results,
    resposta?.registros,
    resposta?.usuarios,
    resposta?.users,
    resposta?.equipamentos,
    resposta?.lista,
  ];

  const lista = candidatos.find(Array.isArray);

  if (!lista) {
    throw new Error(
      `A API de ${tipo} não retornou uma lista válida.`
    );
  }

  return lista;
}

function idValido(id) {
  return (
    id !== null &&
    id !== undefined &&
    String(id).trim() !== ""
  );
}

function texto(valor) {
  return String(valor ?? "").trim();
}

function nomeDe(valor) {
  if (valor && typeof valor === "object") {
    return texto(
      valor.nome ??
      valor.nomeCompleto ??
      valor.nome_completo ??
      valor.name
    );
  }

  return texto(valor);
}

// Busca operadores cadastrados no banco de dados
export async function buscarOperadores({ signal } = {}) {
  const resposta = await requisitar(
    ROTAS.operadores,
    { signal }
  );

  const lista = extrairLista(resposta, "operadores");

  return lista
    .filter((item) => {
      const cargo = texto(
        item?.cargo ??
        item?.perfil ??
        item?.role
      );

      return !cargo || /^operador/i.test(cargo);
    })
    .map((item) => ({
      id:
        item?.id ??
        item?.operador_id ??
        item?.id_operador ??
        item?.usuario_id ??
        item?.usuarioId ??
        item?.idUsuario,

      nome: nomeDe(item),
    }))
    .filter((item) => idValido(item.id) && item.nome);
}

// Busca sondas cadastradas e seus respectivos IDs
export async function buscarSondas({ signal } = {}) {
  const resposta = await requisitar(
    ROTAS.sondas,
    { signal }
  );

  const lista = extrairLista(resposta, "sondas");

  return lista
    .map((item) => ({
      id:
        item?.id ??
        item?.sonda_id ??
        item?.id_sonda ??
        item?.equipamento_id ??
        item?.sondaId ??
        item?.idSonda,

      nome:
        nomeDe(
          item?.nome ??
          item?.nome_sonda ??
          item?.nomeEquipamento ??
          item?.descricao
        ) || "Sonda",
    }))
    .filter((item) => idValido(item.id));
}

export function rotuloSonda(sonda) {
  return `${sonda.nome} — ID ${sonda.id}`;
}

// Padroniza o status para exibição
function statusParaExibicao(valor) {
  const chave = texto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (chave === "operando") {
    return "Operando";
  }

  if (chave === "manutencao") {
    return "Manutenção";
  }

  if (chave === "desligado" || chave === "desligada") {
    return "Desligado";
  }

  return texto(valor);
}

// Consulta as operações cadastradas
export async function buscarOperacoes({ signal } = {}) {
  const resposta = await requisitar(
    ROTAS.operacoes,
    { signal }
  );

  const lista = extrairLista(resposta, "operacoes");

  return lista.map((item, indice) => {
    const operadorObjeto = item.operador ?? item.usuario;
    const sondaObjeto = item.sonda ?? item.equipamento;

    return {
      id:
        item.id ??
        item.operacao_id ??
        item.id_operacao ??
        `indice-${indice}`,

      operadorId:
        item.operador_id ??
        item.operadorId ??
        item.usuario_id ??
        item.usuarioId ??
        (
          operadorObjeto &&
          typeof operadorObjeto === "object"
            ? operadorObjeto.id
            : null
        ),

      operadorNome: nomeDe(
        operadorObjeto ??
        item.nome_operador ??
        item.nomeOperador
      ),

      sondaId:
        item.sonda_id ??
        item.sondaId ??
        item.equipamento_id ??
        item.equipamentoId ??
        (
          sondaObjeto &&
          typeof sondaObjeto === "object"
            ? sondaObjeto.id
            : null
        ),

      sondaNome: nomeDe(
        sondaObjeto ??
        item.nome_sonda ??
        item.nomeEquipamento
      ),

      status: statusParaExibicao(item.status),
    };
  });
}

// Envia nova operação ao Back-End
export async function registrarNovaOperacao({
  operadorId,
  sondaId,
  status
}) {
  if (!idValido(operadorId) || !idValido(sondaId)) {
    throw new Error(
      "Selecione um operador e uma sonda cadastrados."
    );
  }

  if (!STATUS_OPERACOES.includes(status)) {
    throw new Error(
      "Selecione um status válido."
    );
  }

  const campoOperador =
    import.meta.env.VITE_OPERACOES_CAMPO_OPERADOR ||
    "operador_id";

  const campoSonda =
    import.meta.env.VITE_OPERACOES_CAMPO_SONDA ||
    "sonda_id";

  const dados = {
    [campoOperador]: operadorId,
    [campoSonda]: sondaId,
    status,
  };

  await requisitar(ROTAS.operacoes, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(dados),
  });

  return true;
}
