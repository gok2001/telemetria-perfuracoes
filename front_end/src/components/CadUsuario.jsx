import { useState } from "react";
import "../styles/CadUsuario.css";
import logo from "../assets/logos/logo.png";

const API_BASE = String(import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/+$/, "");
const API_URL = `${API_BASE}/usuarios`;

const CARGOS = [
  { rotulo: "Operador", valor: "OPERADOR" },
  { rotulo: "Controlador", valor: "CONTROLADOR" },
];

const FORM_INICIAL = {
  nome: "",
  email: "",
  cpf: "",
  senha: "",
  confirmarSenha: "",
  cargo: "OPERADOR",
};

export default function CadUsuario() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((atual) => ({ ...atual, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const cpf = form.cpf.replace(/\D/g, "");

    if (cpf.length !== 11) {
      setErro("Informe um CPF válido com 11 números.");
      return;
    }

    if (form.senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (form.senha !== form.confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setEnviando(true);

    try {
      const resposta = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          email: form.email.trim().toLowerCase(),
          cpf,
          senha: form.senha,
          cargo: form.cargo,
        }),
      });

      if (!resposta.ok) {
        const detalhe = await resposta.json().catch(() => null);
        throw new Error(detalhe?.message || `Erro HTTP ${resposta.status} ao cadastrar usuário.`);
      }

      setSucesso("Usuário cadastrado com sucesso.");
      setForm({ ...FORM_INICIAL });
    } catch (err) {
      setErro(err.message || "Não foi possível conectar ao back-end.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="cadastro">
      <form className="cadastro-form" onSubmit={handleSubmit}>
        <div className="campo">
          <label htmlFor="nome">Nome Completo</label>
          <input
            id="nome"
            name="nome"
            type="text"
            value={form.nome}
            onChange={handleChange}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="cpf">CPF</label>
          <input
            id="cpf"
            name="cpf"
            type="text"
            inputMode="numeric"
            maxLength={11}
            value={form.cpf}
            onChange={handleChange}
            required
          />
        </div>

        <div className="linha">
          <div className="campo">
            <label htmlFor="senha">Senha (mín. 8 caracteres)</label>
            <input
              id="senha"
              name="senha"
              type="password"
              minLength={8}
              value={form.senha}
              onChange={handleChange}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="confirmarSenha">Confirmar senha</label>
            <input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              minLength={8}
              value={form.confirmarSenha}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="campo">
          <label htmlFor="cargo">Cargo</label>
          <select
            id="cargo"
            name="cargo"
            value={form.cargo}
            onChange={handleChange}
          >
            {CARGOS.map((cargo) => (
              <option key={cargo.valor} value={cargo.valor}>
                {cargo.rotulo}
              </option>
            ))}
          </select>
        </div>

        {erro && <p className="mensagem erro">{erro}</p>}
        {sucesso && <p className="mensagem sucesso">{sucesso}</p>}

        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>

      <div className="cadastro-logo-area">
        <img
          src={logo}
          alt="DrillTrack - Da sonda à decisão"
          className="cadastro-logo"
        />
      </div>
    </div>
  );
}