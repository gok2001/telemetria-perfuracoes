import { useState } from "react";
import "../styles/CadUsuario.css";

const API_URL = "http://localhost:3001/users";
const CARGOS = ["Operador", "Controlador"];

const FORM_INICIAL = {
  nome: "",
  email: "",
  cpf: "",
  senha: "",
  confirmarSenha: "",
  cargo: CARGOS[0],
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
          cargo: form.cargo,
          status: "Ativo",
          foto: null,
        }),
      });

      if (!resposta.ok) {
        throw new Error("Não foi possível cadastrar o usuário. Verifique a API.");
      }

      setSucesso("Usuário cadastrado com sucesso.");
      setForm({ ...FORM_INICIAL });
    } catch (err) {
      setErro(`${err.message} Confira se o JSON Server está executando na porta 3001.`);
    } finally {
      setEnviando(false);
    }
  }

