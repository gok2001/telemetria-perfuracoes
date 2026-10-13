
import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [paginaAtiva, setPaginaAtiva] = useState('Dashboard');
  const [mobileAberta, setMobileAberta] = useState(false);

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
          <h2>{paginaAtiva}</h2>
          <p>Área de conteúdo para a página selecionada.</p>
        </section>
      </main>
    </div>
  );
}

export default App;
