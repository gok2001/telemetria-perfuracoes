import { useState, useEffect } from "react";
import { FiEye, FiEyeOff, FiX } from "react-icons/fi";
import "../styles/login.css";
import logo from "../assets/logos/logo.png";

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (carregando) return;

    setErro("");
    setCarregando(true);
    try {
      // Simulação de 2s da API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const senhaCorreta = senha === "123456";
      if (!senhaCorreta) {
        setErro("Senha incorreta. Tente novamente.");
        return;
      }

      // Avisa o App.jsx que o login deu certo
      if (onLoginSucesso) {
        onLoginSucesso();
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="container-fluid login-page">
      <div className="row g-0 min-vh-100">
        {/* Lado esquerdo */}
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center login-left">
          <img src={logo} alt="DrillTrack - Da sonda à decisão" className="login-logo" />
          <h2 className="login-welcome">Bem-vindo de volta!</h2>
          <p className="login-subtitle">Faça login para acessar sua conta</p>
        </div>

        {/* Lado direito */}
        <div className="col-md-6 d-flex justify-content-center align-items-center login-right">
          <form className="login-card" onSubmit={handleSubmit}>
            <h1 className="login-title">Login</h1>

            <label htmlFor="email" className="login-label">E-mail</label>
            <input
              id="email"
              type="email"
              className="login-input"
              placeholder="operador@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="senha" className="login-label">Senha</label>
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
                {mostrarSenha ? <FiEye /> : <FiEyeOff />}
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

            <button type="submit" className="login-button" disabled={carregando}>
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

            <p className="login-register">
              Não tem conta? <a href="#">Cadastre-se</a>
            </p>
          </form>
        </div>
      </div>

      {/* Pop-up de senha esquecida */}
      {mostrarAviso && (
        <div className="modal-overlay" onClick={() => setMostrarAviso(false)}>
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
              <FiX />
            </button>

            <h2 className="modal-title">Alteração de senha</h2>
            <p className="modal-text">
              Alteração de senha solicitada à Central de Operação. Aguarde o
              contato para redefinir sua senha.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}