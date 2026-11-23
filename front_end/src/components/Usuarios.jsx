import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from 'lucide-react';
import '../styles/Usuarios.css';

const API_BASE = String(import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/+$/, '');
const API_URL = `${API_BASE}/usuarios`;
const ITENS_POR_PAGINA = 10;

const CARGOS_FILTRO = [
  { rotulo: 'Operador', valor: 'OPERADOR' },
  { rotulo: 'Controlador', valor: 'CONTROLADOR' },
];

const STATUS_OPCOES = [
  { rotulo: 'Ativo', valor: 'ATIVO' },
  { rotulo: 'Inativo', valor: 'INATIVO' },
];

function formatarCargo(cargo) {
  if (cargo === 'OPERADOR') return 'Operador';
  if (cargo === 'CONTROLADOR') return 'Controlador';
  return cargo || '-';
}

function formatarStatus(status) {
  if (status === 'ATIVO') return 'Ativo';
  if (status === 'INATIVO') return 'Inativo';
  return status || '-';
}

function paginasVisiveis(atual, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (atual <= 3) return [1, 2, 3, '...', total];
  if (atual >= total - 2) return [1, '...', total - 2, total - 1, total];
  return [1, '...', atual, '...', total];
}

function iniciais(nome = '') {
  return (
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() || '')
      .join('') || 'US'
  );
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [cargoFiltro, setCargoFiltro] = useState('TODOS');
  const [pagina, setPagina] = useState(1);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [novoStatus, setNovoStatus] = useState('ATIVO');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregarUsuarios() {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await fetch(API_URL);
      if (!resposta.ok) throw new Error(`Erro HTTP ${resposta.status} ao carregar usuários.`);
      const dados = await resposta.json();
      setUsuarios(Array.isArray(dados) ? dados : []);
    } catch (error) {
      setErro(`${error.message} Verifique se o back-end Java está rodando na porta 8080.`);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return usuarios.filter((usuario) => {
      const correspondeBusca =
        usuario.nome?.toLocaleLowerCase('pt-BR').includes(termo) ||
        usuario.email?.toLocaleLowerCase('pt-BR').includes(termo);
      const correspondeCargo = cargoFiltro === 'TODOS' || usuario.cargo === cargoFiltro;
      return correspondeBusca && correspondeCargo;
    });
  }, [usuarios, busca, cargoFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const usuariosPagina = usuariosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);

  function abrirEdicaoStatus(usuario) {
    setUsuarioSelecionado(usuario);
    setNovoStatus(usuario.status || 'ATIVO');
    setErro('');
  }

  function fecharEdicao() {
    setUsuarioSelecionado(null);
  }

  async function salvarStatus(event) {
    event.preventDefault();
    if (!usuarioSelecionado) return;

    setSalvando(true);
    setErro('');
    try {
      const resposta = await fetch(`${API_URL}/${usuarioSelecionado.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (!resposta.ok) {
        throw new Error(`Erro HTTP ${resposta.status} ao alterar status.`);
      }

      const usuarioAtualizado = await resposta.json();
      setUsuarios((atuais) =>
        atuais.map((u) => (u.id === usuarioAtualizado.id ? usuarioAtualizado : u))
      );
      fecharEdicao();
    } catch (error) {
      setErro(error.message || 'Não foi possível salvar o status.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="usuarios-layout">
      <section className="usuarios-conteudo">
        <div className="usuarios-titulo">
          <p>Gerenciar os usuários da plataforma</p>
        </div>

        <div className="usuarios-filtros">
          <label className="usuarios-busca">
            <span className="visually-hidden">Buscar usuário</span>
            <input
              type="search"
              placeholder="Buscar usuário..."
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setPagina(1);
              }}
            />
            <Search size={21} aria-hidden="true" />
          </label>

          <select
            aria-label="Filtrar por cargo"
            value={cargoFiltro}
            onChange={(event) => {
              setCargoFiltro(event.target.value);
              setPagina(1);
            }}
          >
            <option value="TODOS">Todos os cargos</option>
            {CARGOS_FILTRO.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.rotulo}
              </option>
            ))}
          </select>
        </div>

        {erro && !usuarioSelecionado && <div className="usuarios-alerta">{erro}</div>}

        <div className="usuarios-tabela-wrapper">
          <table className="usuarios-tabela">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Cargo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan="5" className="usuarios-vazio">
                    <LoaderCircle className="usuarios-spinner" size={20} /> Carregando usuários...
                  </td>
                </tr>
              ) : usuariosPagina.length === 0 ? (
                <tr>
                  <td colSpan="5" className="usuarios-vazio">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                usuariosPagina.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <div className="usuarios-identificacao">
                        <span className="usuarios-avatar usuarios-avatar-iniciais">
                          {iniciais(usuario.nome)}
                        </span>
                        <span>{usuario.nome}</span>
                      </div>
                    </td>
                    <td>
                      <a className="usuarios-email" href={`mailto:${usuario.email}`}>
                        {usuario.email}
                      </a>
                    </td>
                    <td>{formatarCargo(usuario.cargo)}</td>
                    <td>
                      <span
                        className={`usuarios-status ${
                          usuario.status === 'ATIVO' ? 'is-ativo' : 'is-inativo'
                        }`}
                      >
                        {formatarStatus(usuario.status)}
                      </span>
                    </td>
                    <td>
                      <div className="usuarios-acoes">
                        <button
                          type="button"
                          className="usuarios-acao editar"
                          onClick={() => abrirEdicaoStatus(usuario)}
                          aria-label={`Alterar status de ${usuario.nome}`}
                          title="Alterar status"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="usuarios-paginacao">
          <span>
            {carregando
              ? 'Carregando registros...'
              : usuariosFiltrados.length === 0
              ? 'Mostrando 0 de 0 registros.'
              : `Mostrando ${inicio + 1} a ${Math.min(
                  inicio + ITENS_POR_PAGINA,
                  usuariosFiltrados.length
                )} de ${usuariosFiltrados.length} registros.`}
          </span>

          {!carregando && totalPaginas > 1 && (
            <div className="usuarios-paginas">
              <button
                type="button"
                onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
                disabled={paginaAtual === 1}
                aria-label="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>

              {paginasVisiveis(paginaAtual, totalPaginas).map((numero, idx) =>
                numero === '...' ? (
                  <span key={`pontos-${idx}`} className="pag-pontos">
                    ...
                  </span>
                ) : (
                  <button
                    key={numero}
                    type="button"
                    className={paginaAtual === numero ? 'pagina-ativa' : ''}
                    onClick={() => setPagina(numero)}
                    aria-label={`Ir para página ${numero}`}
                    aria-current={paginaAtual === numero ? 'page' : undefined}
                  >
                    {numero}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))}
                disabled={paginaAtual === totalPaginas}
                aria-label="Próxima página"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </footer>
      </section>

      {usuarioSelecionado && (
        <>
          <button
            type="button"
            className="usuarios-drawer-overlay"
            onClick={fecharEdicao}
            aria-label="Fechar edição"
          />
          <aside className="usuarios-drawer" aria-label="Alterar status do usuário">
            <div className="usuarios-drawer-cabecalho">
              <h3>Alterar status</h3>
              <button type="button" onClick={fecharEdicao} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={salvarStatus} className="usuarios-formulario">
              <label className="usuarios-campo">
                <span>Usuário</span>
                <input value={usuarioSelecionado.nome} disabled />
              </label>
              <label className="usuarios-campo">
                <span>E-mail</span>
                <input value={usuarioSelecionado.email} disabled />
              </label>
              <label className="usuarios-campo">
                <span>Cargo</span>
                <input value={formatarCargo(usuarioSelecionado.cargo)} disabled />
              </label>
              <label className="usuarios-campo">
                <span>Status</span>
                <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)}>
                  {STATUS_OPCOES.map((st) => (
                    <option key={st.valor} value={st.valor}>
                      {st.rotulo}
                    </option>
                  ))}
                </select>
              </label>

              {erro && <div className="usuarios-alerta">{erro}</div>}

              <div className="usuarios-form-acoes">
                <button type="button" className="usuarios-btn-cancelar" onClick={fecharEdicao}>
                  Cancelar
                </button>
                <button type="submit" className="usuarios-btn-salvar" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}