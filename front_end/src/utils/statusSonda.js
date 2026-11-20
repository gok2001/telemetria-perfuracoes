// src/utils/statusSonda.js
// Regras que decidem o status da sonda a partir dos parâmetros medidos.

// AJUSTE AQUI: limites que a sonda suporta.
// Os valores abaixo são DE EXEMPLO, confirme os reais com o grupo/orientador.
export const LIMITES = {
  temperatura: { nome: "temperatura", max: 120, unidade: "°C" },
  vibracao: { nome: "vibração", max: 1200, unidade: "mm" },
  rotacao: { nome: "rotação", max: 3500, unidade: "RPM" },
};

// Quantas das últimas leituras entram na média de cada sonda
export const LEITURAS_NA_MEDIA = 5;

// Status definidos por uma pessoa (Registro Operação): a máquina não sobrescreve
const STATUS_MANUAIS = ["Desligada", "Manutenção"];
const STATUS_DISPONIVEIS = ["Alerta", "Operando", ...STATUS_MANUAIS];

const CAMPOS = Object.keys(LIMITES);

function ehNumero(valor) {
  return typeof valor === "number" && !Number.isNaN(valor);
}

// Um registro inserido pelo formulário tem status, mas não tem medições.
// Assim não é confundido com uma leitura real dos sensores.
function ehRegistroOperacao(leitura) {
  return (
    STATUS_DISPONIVEIS.includes(leitura.status) &&
    !CAMPOS.some((campo) => ehNumero(leitura[campo]))
  );
}

// Status de UMA leitura (usado em cada linha da tabela)
export function statusDaLeitura(leitura) {
  if (STATUS_MANUAIS.includes(leitura.status)) return leitura.status;

  const medidos = CAMPOS.filter((campo) => ehNumero(leitura[campo]));
  if (medidos.length === 0) return leitura.status || "";

  const passouDoLimite = medidos.some(
    (campo) => leitura[campo] > LIMITES[campo].max
  );
  return passouDoLimite ? "Alerta" : "Operando";
}

// Resumo de cada sonda: média das últimas leituras e status atual.
// "leituras" precisa estar ordenada da mais recente para a mais antiga.
export function resumoPorSonda(leituras, equipamentos) {
  return equipamentos.map((equipamento) => {
    const daSonda = leituras.filter((l) => l.equipamento === equipamento);
    const ultima = daSonda[0];

    // só leituras de sensor entram na média (não os registros manuais)
    const medicoes = daSonda
      .filter(
        (l) =>
          !ehRegistroOperacao(l) &&
          !STATUS_MANUAIS.includes(l.status) &&
          CAMPOS.some((campo) => ehNumero(l[campo]))
      )
      .slice(0, LEITURAS_NA_MEDIA);

    const medias = {};
    const excedidos = [];

    CAMPOS.forEach((campo) => {
      const valores = medicoes.map((l) => l[campo]).filter(ehNumero);
      if (valores.length === 0) return;

      const media = valores.reduce((soma, v) => soma + v, 0) / valores.length;
      medias[campo] = media;

      if (media > LIMITES[campo].max) {
        excedidos.push({
          campo,
          nome: LIMITES[campo].nome,
          media,
          limite: LIMITES[campo].max,
          unidade: LIMITES[campo].unidade,
        });
      }
    });

    let status = "";
    if (ultima && (ehRegistroOperacao(ultima) || STATUS_MANUAIS.includes(ultima.status))) {
      status = ultima.status; // respeita o último registro feito no formulário
    } else if (medicoes.length > 0) {
      status = excedidos.length > 0 ? "Alerta" : "Operando";
    }

    return { equipamento, status, medias, excedidos };
  });
}