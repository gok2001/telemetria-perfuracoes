import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';

// Importando as páginas
import Dashboard from './components/Dashboard';
import DadosBrutos from './components/DadosBrutos';
import Operacao from './components/Operacao';
import CadUsuario from './components/CadUsuario';
import Usuarios from './components/Usuarios';
import Login from './components/login'; // Certifique-se que o nome e a letra minúscula/maiúscula batem com o arquivo

// Importando o CSS
import './styles/App.css';

export default function App() {
  // Controla se o utilizador está logado ou não (começa como false para mostrar o Login)
  const [estaLogado, setEstaLogado] = useState(false);
  
  const [paginaAtiva, setPaginaAtiva] = useState('Dashboard');
  const [mobileAberta, setMobileAberta] = useState(false);

  // Se NÃO estiver logado, exibe apenas a tela de Login
  if (!estaLogado) {
    // Passamos uma função para o Login avisar o App que o login deu certo
    return <Login onLoginSucesso={() => setEstaLogado(true)} />;
  }

  // Função para decidir qual componente exibir no painel interno
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

  // Se JÁ estiver logado, exibe o layout completo com a Sidebar e o Conteúdo
  return (
    <div className="app d-flex">
      <Sidebar
        paginaAtiva={paginaAtiva}
        onNavegar={setPaginaAtiva}
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