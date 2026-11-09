import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import './styles/global.css';

// Importando as páginas
import Dashboard from './components/Dashboard';
import DadosBrutos from './components/DadosBrutos';
import Operacao from './components/Operacao';
import CadUsuario from './components/CadUsuario';
import Usuarios from './components/Usuarios';
import Login from './components/login';

import './styles/App.css';

const CHAVE_SESSAO = 'drilltrack_autenticado';
const CHAVE_PAGINA = 'drilltrack_pagina_ativa';

const PAGINAS_VALIDAS = [
  'Dashboard',
  'Dados Brutos',
  'Operação',
  'Cadastrar Usuário',
  'Usuários',
  'Configuração',
];

function recuperarPagina() {
  try {
    const paginaSalva = localStorage.getItem(CHAVE_PAGINA);
    return PAGINAS_VALIDAS.includes(paginaSalva) ? paginaSalva : 'Dashboard';
  } catch {
    return 'Dashboard';
  }
}

function recuperarSessao() {
  try {
    return localStorage.getItem(CHAVE_SESSAO) === 'true';
  } catch {
    return false;
  }
}

export default function App() {
  // Recupera a sessão e a última página após atualizar o navegador.
  const [estaLogado, setEstaLogado] = useState(recuperarSessao);
  const [paginaAtiva, setPaginaAtiva] = useState(recuperarPagina);
  const [mobileAberta, setMobileAberta] = useState(false);

  function handleLoginSucesso() {
    try {
      localStorage.setItem(CHAVE_SESSAO, 'true');
    } catch (error) {
      console.error('Não foi possível salvar a sessão:', error);
    }
    setEstaLogado(true);
  }

  function handleNavegar(pagina) {
    const paginaValida = PAGINAS_VALIDAS.includes(pagina)
      ? pagina
      : 'Dashboard';

    setPaginaAtiva(paginaValida);

    try {
      localStorage.setItem(CHAVE_PAGINA, paginaValida);
    } catch (error) {
      console.error('Não foi possível salvar a página atual:', error);
    }
  }

  function handleSair() {
    try {
      localStorage.removeItem(CHAVE_SESSAO);
      localStorage.removeItem(CHAVE_PAGINA);
    } catch (error) {
      console.error('Não foi possível limpar os dados da sessão:', error);
    }

    setEstaLogado(false);
    setPaginaAtiva('Dashboard');
    setMobileAberta(false);
  }

  if (!estaLogado) {
    return <Login onLoginSucesso={handleLoginSucesso} />;
  }

  const renderizarPagina = () => {
    switch (paginaAtiva) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Dados Brutos':
        return <DadosBrutos />;
      case 'Operação':
        return <Operacao />;
      case 'Cadastrar Usuário':
        return <CadUsuario />;
      case 'Usuários':
        return <Usuarios />;
      default:
        return <Dashboard />;
    }
  };

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

        <header className="app__cabecalho">
          <h1>{paginaAtiva}</h1>
          <p>DrillTrack — Da Sonda à Decisão</p>
        </header>

        <section className="app__painel">
          {renderizarPagina()}
        </section>
      </main>
    </div>
  );
}
