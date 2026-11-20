import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { EQUIPAMENTOS, STATUS } from "../services/dadosBrutosService";

const OUTRO_OPERADOR = "__outro_operador__";

// Os nomes disponíveis vêm das leituras já carregadas na tela Dados Brutos.
// Como ainda não existe um cadastro de usuários integrado, também é possível
// informar outro operador manualmente sem inventar nomes fixos na interface.
export default function RegistroOperacaoModal({
  onFechar,
  onRegistrar,
  operadoresDisponiveis = [],
}) {
  const [operadorSelecionado, setOperadorSelecionado] = useState("");
  const [outroOperador, setOutroOperador] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [status, setStatus] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    function handleEsc(evento) {
      if (evento.key === "Escape" && !enviando) onFechar();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [enviando, onFechar]);

  async function handleSubmit(evento) {
    evento.preventDefault();
    if (enviando) return;

    const operador =
      operadorSelecionado === OUTRO_OPERADOR
        ? outroOperador.trim()
        : operadorSelecionado;

    if (!operador) {
      setErro("Selecione ou informe o operador.");
      return;
    }
    if (!equipamento) {
      setErro("Selecione o equipamento.");
      return;
    }
    if (!status) {
      setErro("Selecione o status da operação.");
      return;
    }

    setErro("");
    setEnviando(true);
    try {
      await onRegistrar({ operador, equipamento, status });
      // O componente DadosBrutos fecha o modal depois do registro bem-sucedido.
    } catch {
      setErro("Não foi possível registrar a operação. Tente novamente.");
      setEnviando(false);
    }
  }

  return (
    <div className="rop-overlay" onClick={() => !enviando && onFechar()}>
      <form
        className="rop-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rop-titulo"
        onClick={(evento) => evento.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className="rop-fechar"
          onClick={onFechar}
          disabled={enviando}
          aria-label="Fechar registro de operações"
        >
          <FiX />
        </button>

        <h2 id="rop-titulo" className="rop-titulo">
          REGISTRAR OPERAÇÕES
        </h2>

        <div className="rop-campos">
          <div className="rop-campo">
            <label htmlFor="rop-operador" className="rop-label-visualmente-oculta">
              Operador
            </label>
            <select
              id="rop-operador"
              className="rop-select"
              value={operadorSelecionado}
              onChange={(evento) => {
                setOperadorSelecionado(evento.target.value);
                setErro("");
              }}
              autoFocus
              required
              disabled={enviando}
            >
              <option value="" disabled>
                Operador
              </option>
              {operadoresDisponiveis.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
              <option value={OUTRO_OPERADOR}>Outro operador...</option>
            </select>
            {operadorSelecionado === OUTRO_OPERADOR && (
              <input
                type="text"
                className="rop-outro-operador"
                placeholder="Nome do operador"
                aria-label="Nome do operador"
                value={outroOperador}
                onChange={(evento) => {
                  setOutroOperador(evento.target.value);
                  setErro("");
                }}
                maxLength={100}
                required
                disabled={enviando}
              />
            )}
          </div>

          <div className="rop-campo">
            <label htmlFor="rop-equipamento" className="rop-label-visualmente-oculta">
              Equipamento
            </label>
            <select
              id="rop-equipamento"
              className="rop-select"
              value={equipamento}
              onChange={(evento) => {
                setEquipamento(evento.target.value);
                setErro("");
              }}
              required
              disabled={enviando}
            >
              <option value="" disabled>
                Equipamento
              </option>
              {EQUIPAMENTOS.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </div>

          <div className="rop-campo">
            <label htmlFor="rop-status" className="rop-label-visualmente-oculta">
              Status
            </label>
            <select
              id="rop-status"
              className="rop-select"
              value={status}
              onChange={(evento) => {
                setStatus(evento.target.value);
                setErro("");
              }}
              required
              disabled={enviando}
            >
              <option value="" disabled>
                Status
              </option>
              {STATUS.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {erro && (
          <p className="rop-erro" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="rop-btn" disabled={enviando}>
          {enviando ? "Registrando..." : "Registrar"}
        </button>
      </form>
    </div>
  );
}
