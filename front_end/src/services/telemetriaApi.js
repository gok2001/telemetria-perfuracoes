const API_BASE_URL = "http://localhost:8001";

export async function buscarDadosDashboard(limite = 20) {
  const resposta = await fetch(`${API_BASE_URL}/api/dashboard?limite=${limite}`);

  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status} ao buscar dados da API`);
  }

  return resposta.json();
}