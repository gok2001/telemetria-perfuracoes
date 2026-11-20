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
const CARGOS = ['Operador', 'Controlador'];
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
