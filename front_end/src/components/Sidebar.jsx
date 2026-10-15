
import { useState } from 'react';
import {
  Menu,
  LayoutDashboard,
  Database,
  Users,
  UserRoundPlus,
  Settings,
  LogOut,
} from 'lucide-react';

import './Sidebar.css';
import logo from '../assets/logos/logo.png';

const itensMenu = [
  { nome: 'Dashboard', icone: LayoutDashboard },
  { nome: 'Dados Brutos', icone: Database },
  { nome: 'Usuários', icone: Users },
  { nome: 'Cadastrar Usuário', icone: UserRoundPlus },
  { nome: 'Configuração', icone: Settings },
];

function Sidebar({
  paginaAtiva = 'Dashboard',
  onNavegar,
  mobileAberta = false,
  onFecharMobile,
}) {
  const [recolhida, setRecolhida] = useState(false);

  // No mobile, os nomes aparecem sempre que o menu está aberto.
  const mostrarRotulos = mobileAberta || !recolhida;

  function handleMenu() {
    if (mobileAberta) {
      onFecharMobile?.();
      return;
    }

    setRecolhida((atual) => !atual);
  }

  function handleNavegacao(pagina) {
    onNavegar?.(pagina);
    onFecharMobile?.();
  }

  return (
    <>
      {mobileAberta && (
        <button
          type="button"
          className="sidebar__overlay"
          onClick={onFecharMobile}
          aria-label="Fechar menu"
        />
      )}

      <aside
        id="menu-lateral"
        className={`sidebar d-flex flex-column ${
          recolhida ? 'sidebar--recolhida' : ''
        } ${mobileAberta ? 'sidebar--mobile-aberta' : ''}`}
      >
        <button
          type="button"
          className="sidebar__menu-toggle btn"
          onClick={handleMenu}
          aria-label={
            mobileAberta
              ? 'Fechar menu'
              : recolhida
                ? 'Expandir menu'
                : 'Recolher menu'
          }
          aria-expanded={mobileAberta || !recolhida}
        >
          <Menu size={19} />
        </button>

        
        <div className="sidebar__marca d-flex flex-column align-items-center justify-content-center">
            <img
                src={logo}
                alt="DrillTrack — Da Sonda à Decisão"
                className="sidebar__logo-img"
            />
        </div>


        <nav
          className="sidebar__navegacao d-flex flex-column gap-1"
          aria-label="Navegação principal"
        >
          {itensMenu.map(({ nome, icone: Icone }) => (
            <button
              key={nome}
              type="button"
              className={`sidebar__item btn d-flex align-items-center ${
                paginaAtiva === nome ? 'sidebar__item--ativo' : ''
              }`}
              onClick={() => handleNavegacao(nome)}
              title={!mostrarRotulos ? nome : undefined}
              aria-current={
                paginaAtiva === nome ? 'page' : undefined
              }
            >
              <Icone size={16} />
              {mostrarRotulos && <span>{nome}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar__rodape mt-auto">
          <button
            type="button"
            className="sidebar__item btn d-flex align-items-center"
            onClick={() => handleNavegacao('Sair')}
            title={!mostrarRotulos ? 'Sair' : undefined}
          >
            <LogOut size={16} />
            {mostrarRotulos && <span>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
