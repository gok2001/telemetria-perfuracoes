import { useState, useEffect } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import "../styles/login.css";
import logo from "../assets/logos/logo.png";

const API_BASE = String(import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/+$/, "");
const USUARIOS_URL = `${API_BASE}/usuarios`;

export const ADMIN_PADRAO = {
  nome: "Administrador",
  email: "admin@drilltrack.com",
  cpf: "00000000000",
  senha: "admin123",
  cargo: "CONTROLADOR",
};

let adminVerificado = false;

export default function Login({ onLoginSucesso }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") setMostrarAviso(false);
    }

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Garante automaticamente o cadastro do Controlador padrão ao iniciar a página
  useEffect(() => {
    if (adminVerificado) return;
    adminVerificado = true;

    async function garantirAdminPadrao() {
      try {
        const resp = await fetch(USUARIOS_URL);
        if (!resp.ok) return;

        const lista = await resp.json();
        const jaExiste = Array.isArray(lista) && lista.some(
          (u) => String(u.email ?? "").toLowerCase() === ADMIN_PADRAO.email
        );

        if (!jaExiste) {
          await fetch(USUARIOS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ADMIN_PADRAO),
          });
        }
      } catch {
        // Ignora silenciosamente se o back-end ainda estiver subindo
      }
    }

    garantirAdminPadrao();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (carregando) return;

    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch(`${USUARIOS_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          senha,
        }),
      });

      if (!resposta.ok) {
        const detalhe = await resposta.json().catch(() => null);
        throw new Error(detalhe?.message || "E-mail ou senha incorretos.");
      }

      const usuario = await resposta.json();

      if (usuario.status === "INATIVO") {
        throw new Error("Este usuário está inativo. Contate o Controlador.");
      }

      if (onLoginSucesso) {
        onLoginSucesso(usuario);
      }
    } catch (err) {
      setErro(err.message || "Não foi possível autenticar no servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="container-fluid login-page">
      <div className="row g-0 min-vh-100">
        {/* Lado esquerdo */}
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center login-left">
          <img
            src={logo}
            alt="DrillTrack - Da sonda à decisão"
            className="login-logo"
          />

          <h2 className="login-welcome">Bem-vindo de volta!</h2>
          <p className="login-subtitle">
            Faça login para acessar sua conta
          </p>
        </div>

        {/* Lado direito */}
        <div className="col-md-6 d-flex justify-content-center align-items-center login-right">
          <form className="login-card" onSubmit={handleSubmit}>
            <h1 className="login-title">Login</h1>

            <label htmlFor="email" className="login-label">
              E-mail
            </label>

            <input
              id="email"
              type="email"
              className="login-input"
              placeholder="seuemail@drilltrack.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErro("");
              }}
              required
            />

            <label htmlFor="senha" className="login-label">
              Senha
            </label>

            <div className="login-input-wrap">
              <input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                className={`login-input ${erro ? "login-input-erro" : ""}`}
                placeholder="••••••••••"
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  setErro("");
                }}
                aria-invalid={erro ? "true" : "false"}
                required
              />

              <button
                type="button"
                className="login-eye"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {erro && (
              <p className="login-error" role="alert">
                {erro}
              </p>
            )}

            <button
              type="button"
              className="login-forgot"
              onClick={() => setMostrarAviso(true)}
            >
              Esqueceu sua senha?
            </button>

            <button
              type="submit"
              className="login-button"
              disabled={carregando}
            >
              {carregando ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  ></span>
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Pop-up de senha esquecida */}
      {mostrarAviso && (
        <div
          className="modal-overlay"
          onClick={() => setMostrarAviso(false)}
        >
          <div
            className="modal-box"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setMostrarAviso(false)}
              aria-label="Fechar mensagem"
            >
              <X size={20} />
            </button>

            <h2 className="modal-title">Alteração de senha</h2>

            <p className="modal-text">
              Alteração de senha solicitada à Central de Operação.
              Aguarde o contato para redefinir sua senha.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}