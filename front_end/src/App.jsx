
import { useState } from 'react';
import { Menu } from 'lucide-react';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DadosBrutos from './components/DadosBrutos';
import CadUsuario from './components/CadUsuario';
import Usuarios from './components/Usuarios';
import Login from './components/login';
import RegistroOperacoes from './components/RegistroOperacoes';

import './styles/global.css';
import './styles/App.css';

// Chaves utilizadas no localStorage
const CHAVE_SESSAO = 'drilltrack_autenticado';
const CHAVE_PAGINA = 'drilltrack_pagina_ativa';

// Páginas disponíveis no sistema
const PAGINAS_VALIDAS = [
  'Dashboard',
  'Dados Brutos',
  'Usuários',
  'Cadastrar Usuário',
  'Registro de Operações',
];

// Compatibilidade com o nome antigo
function normalizarPagina(pagina) {
  if (pagina === 'Registro Operações') {
    return 'Registro de Operações';
  }

  return pagina;
}

// Recupera a sessão
function recuperarSessao() {
  try {
    return localStorage.getItem(CHAVE_SESSAO) === 'true';
  } catch (error) {
    console.error('Erro ao recuperar sessão:', error);
    return false;
  }
}

// Recupera a última página acessada
function recuperarPagina() {
  try {
    const paginaSalva = normalizarPagina(
      localStorage.getItem(CHAVE_PAGINA)
    );

    return PAGINAS_VALIDAS.includes(paginaSalva)
      ? paginaSalva
      : 'Dashboard';
  } catch (error) {
    console.error('Erro ao recuperar página:', error);
    return 'Dashboard';
  }
}

export default function App() {
  // Estados principais
  const [estaLogado, setEstaLogado] = useState(recuperarSessao);
  const [paginaAtiva, setPaginaAtiva] = useState(recuperarPagina);
  const [mobileAberta, setMobileAberta] = useState(false);

  // Login
  function handleLoginSucesso() {
    try {
      localStorage.setItem(CHAVE_SESSAO, 'true');
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
    }

    setEstaLogado(true);
  }

  // Navegação entre páginas
  function handleNavegar(pagina) {
    const paginaNormalizada = normalizarPagina(pagina);

    const paginaValida = PAGINAS_VALIDAS.includes(paginaNormalizada)
      ? paginaNormalizada
      : 'Dashboard';

    setPaginaAtiva(paginaValida);

    try {
      localStorage.setItem(CHAVE_PAGINA, paginaValida);
    } catch (error) {
      console.error('Erro ao salvar página:', error);
    }

    setMobileAberta(false);
  }

  // Logout
  function handleSair() {
    try {
      localStorage.removeItem(CHAVE_SESSAO);
      localStorage.removeItem(CHAVE_PAGINA);
    } catch (error) {
      console.error('Erro ao limpar sessão:', error);
    }

    setEstaLogado(false);
    setPaginaAtiva('Dashboard');
    setMobileAberta(false);
  }

  // Renderização das páginas
  function renderizarPagina() {
    switch (paginaAtiva) {
      case 'Dashboard':
        return <Dashboard />;

      case 'Dados Brutos':
        return <DadosBrutos />;

      case 'Usuários':
        return <Usuarios />;

      case 'Cadastrar Usuário':
        return <CadUsuario />;

      case 'Registro de Operações':
        return <RegistroOperacoes />;

      default:
        return <Dashboard />;
    }
  }

  // Se não estiver logado, exibe a tela de login
  if (!estaLogado) {
    return <Login onLoginSucesso={handleLoginSucesso} />;
  }

  // Essas páginas já possuem cabeçalho próprio
  const possuiCabecalhoProprio =
    paginaAtiva === 'Dados Brutos' ||
    paginaAtiva === 'Registro de Operações';

  return (
    <div className="app d-flex">
      <Sidebar
        paginaAtiva={paginaAtiva}
        onNavegar={handleNavegar}
        onSair={handleSair}
        mobileAberta={mobileAberta}
        onFecharMobile={() => setMobileAberta(false)}
      />

      <main className="app__conteudo flex-grow-1">
        <button
          type="button"
          className="app__mobile-toggle btn"
          onClick={() => setMobileAberta(true)}
          aria-label="Abrir menu de navegação"
          aria-expanded={mobileAberta}
        >
          <Menu size={22} />
        </button>

        {!possuiCabecalhoProprio && (
          <header className="app__cabecalho">
            <h1>{paginaAtiva}</h1>
            <p>DrillTrack — Da Sonda à Decisão</p>
          </header>
        )}

        <section className="app__painel">
          {renderizarPagina()}
        </section>
      </main>
    </div>
  );
}
