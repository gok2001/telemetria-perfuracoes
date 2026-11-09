import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Pencil,
  Trash2,
  X,
  Camera,
  ChevronLeft,
  ChevronRight,
  UserRound,
  LoaderCircle,
} from 'lucide-react';
import '../styles/Usuarios.css';

const API_URL = 'http://localhost:3001/users';
const ITENS_POR_PAGINA = 5;
const CARGOS = ['Operador', 'Auxiliar', 'Gestor', 'Administrador'];
const STATUS = ['Ativo', 'Inativo'];

const usuarioVazio = {
  id: null,
  nome: '',
  email: '',
  cargo: 'Operador',
  status: 'Ativo',
  foto: null,
};

function iniciais(nome = '') {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() || '')
    .join('') || 'US';
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [cargoFiltro, setCargoFiltro] = useState('Todos os cargos');
  const [pagina, setPagina] = useState(1);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [formulario, setFormulario] = useState(usuarioVazio);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregarUsuarios() {
    setCarregando(true);
    setErro('');
    try {
      const resposta = await fetch(API_URL);
      if (!resposta.ok) throw new Error('Não foi possível carregar os usuários.');
      const dados = await resposta.json();
      setUsuarios(Array.isArray(dados) ? dados : []);
    } catch (error) {
      setErro(`${error.message} Verifique se o JSON Server está executando na porta 3001.`);
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
      const correspondeCargo =
        cargoFiltro === 'Todos os cargos' || usuario.cargo === cargoFiltro;
      return correspondeBusca && correspondeCargo;
    });
  }, [usuarios, busca, cargoFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const usuariosPagina = usuariosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);

  function abrirEdicao(usuario) {
    setFormulario({ ...usuario });
    setUsuarioSelecionado(usuario.id);
    setErro('');
  }

  function fecharEdicao() {
    setUsuarioSelecionado(null);
    setFormulario(usuarioVazio);
  }

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setFormulario((atual) => ({ ...atual, [name]: value }));
  }

  function selecionarFoto(event) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem válido.');
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => setFormulario((atual) => ({ ...atual, foto: leitor.result }));
    leitor.onerror = () => setErro('Não foi possível carregar a imagem.');
    leitor.readAsDataURL(arquivo);
  }

  async function salvarUsuario(event) {
    event.preventDefault();
    if (!formulario.nome.trim() || !formulario.email.trim()) {
      setErro('Preencha o nome completo e o e-mail.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      const resposta = await fetch(`${API_URL}/${usuarioSelecionado}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formulario,
          nome: formulario.nome.trim(),
          email: formulario.email.trim(),
        }),
      });
      if (!resposta.ok) throw new Error('Não foi possível salvar as alterações.');
      const usuarioAtualizado = await resposta.json();
      setUsuarios((atuais) => atuais.map((usuario) =>
        usuario.id === usuarioAtualizado.id ? usuarioAtualizado : usuario
      ));
      fecharEdicao();
    } catch (error) {
      setErro(`${error.message} Confira se a API está disponível.`);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirUsuario(usuario) {
    const confirmar = window.confirm(`Deseja realmente excluir o usuário ${usuario.nome}?`);
    if (!confirmar) return;

    try {
      const resposta = await fetch(`${API_URL}/${usuario.id}`, { method: 'DELETE' });
      if (!resposta.ok) throw new Error('Não foi possível excluir o usuário.');
      setUsuarios((atuais) => atuais.filter((item) => item.id !== usuario.id));
      if (usuarioSelecionado === usuario.id) fecharEdicao();
    } catch (error) {
      setErro(error.message);
    }
  }

  return (
    <div className="usuarios-layout">
      <section className="usuarios-conteudo">
        <div className="usuarios-titulo">
          <div>
            <h2>Usuários</h2>
            <p>Gerenciar os usuários da plataforma</p>
          </div>
        </div>

        <div className="usuarios-filtros">
          <label className="usuarios-busca">
            <span className="visually-hidden">Buscar usuário</span>
            <input
              type="search"
              placeholder="Buscar usuário..."
              value={busca}
              onChange={(event) => { setBusca(event.target.value); setPagina(1); }}
            />
            <Search size={21} aria-hidden="true" />
          </label>

          <select
            aria-label="Filtrar por cargo"
            value={cargoFiltro}
            onChange={(event) => { setCargoFiltro(event.target.value); setPagina(1); }}
          >
            <option>Todos os cargos</option>
            {CARGOS.map((cargo) => <option key={cargo}>{cargo}</option>)}
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
                <tr><td colSpan="5" className="usuarios-vazio"><LoaderCircle className="usuarios-spinner" size={20} /> Carregando usuários...</td></tr>
              ) : usuariosPagina.length === 0 ? (
                <tr><td colSpan="5" className="usuarios-vazio">Nenhum usuário encontrado.</td></tr>
              ) : usuariosPagina.map((usuario) => (
                <tr key={usuario.id}>
                  <td>
                    <div className="usuarios-identificacao">
                      {usuario.foto ? (
                        <img className="usuarios-avatar" src={usuario.foto} alt={`Foto de ${usuario.nome}`} />
                      ) : (
                        <span className="usuarios-avatar usuarios-avatar-iniciais">{iniciais(usuario.nome)}</span>
                      )}
                      <span>{usuario.nome}</span>
                    </div>
                  </td>
                  <td><a className="usuarios-email" href={`mailto:${usuario.email}`}>{usuario.email}</a></td>
                  <td>{usuario.cargo}</td>
                  <td><span className={`usuarios-status ${usuario.status === 'Ativo' ? 'is-ativo' : 'is-inativo'}`}>{usuario.status}</span></td>
                  <td>
                    <div className="usuarios-acoes">
                      <button type="button" className="usuarios-acao editar" onClick={() => abrirEdicao(usuario)} aria-label={`Editar ${usuario.nome}`} title="Editar"><Pencil size={16} /></button>
                      <button type="button" className="usuarios-acao excluir" onClick={() => excluirUsuario(usuario)} aria-label={`Excluir ${usuario.nome}`} title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="usuarios-paginacao">
          <span>
            {usuariosFiltrados.length === 0
              ? 'Mostrando 0 de 0 registros'
              : `Mostrando ${inicio + 1} a ${Math.min(inicio + ITENS_POR_PAGINA, usuariosFiltrados.length)} de ${usuariosFiltrados.length} registros`}
          </span>
          <div className="usuarios-paginas">
            <button type="button" onClick={() => setPagina((atual) => Math.max(1, atual - 1))} disabled={paginaAtual === 1} aria-label="Página anterior"><ChevronLeft size={18} /></button>
            <strong>{paginaAtual}</strong>
            <button type="button" onClick={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))} disabled={paginaAtual === totalPaginas} aria-label="Próxima página"><ChevronRight size={18} /></button>
          </div>
        </footer>
      </section>

      {usuarioSelecionado && (
        <>
          <button type="button" className="usuarios-drawer-overlay" onClick={fecharEdicao} aria-label="Fechar edição" />
          <aside className="usuarios-drawer" aria-label="Editar usuário">
            <div className="usuarios-drawer-cabecalho">
              <h3>Editar usuário</h3>
              <button type="button" onClick={fecharEdicao} aria-label="Fechar"><X size={18} /></button>
            </div>

            <form onSubmit={salvarUsuario} className="usuarios-formulario">
              <div className="usuarios-foto-area">
                <div className="usuarios-foto-preview">
                  {formulario.foto ? <img src={formulario.foto} alt="Prévia da foto do usuário" /> : <><UserRound size={38} /><span>{iniciais(formulario.nome)}</span></>}
                </div>
                <label className="usuarios-foto-botao">
                  <Camera size={15} /> Alterar foto
                  <input type="file" accept="image/*" onChange={selecionarFoto} />
                </label>
              </div>

              <label className="usuarios-campo">
                <span>Nome completo</span>
                <input name="nome" value={formulario.nome} onChange={atualizarCampo} placeholder="Nome completo" required />
              </label>
              <label className="usuarios-campo">
                <span>E-mail</span>
                <input type="email" name="email" value={formulario.email} onChange={atualizarCampo} placeholder="email@exemplo.com" required />
              </label>
              <label className="usuarios-campo">
                <span>Cargo</span>
                <select name="cargo" value={formulario.cargo} onChange={atualizarCampo}>
                  {CARGOS.map((cargo) => <option key={cargo}>{cargo}</option>)}
                </select>
              </label>
              <label className="usuarios-campo">
                <span>Status</span>
                <select name="status" value={formulario.status} onChange={atualizarCampo}>
                  {STATUS.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>

              {erro && <div className="usuarios-alerta">{erro}</div>}

              <div className="usuarios-form-acoes">
                <button type="button" className="usuarios-btn-cancelar" onClick={fecharEdicao}>Cancelar</button>
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
