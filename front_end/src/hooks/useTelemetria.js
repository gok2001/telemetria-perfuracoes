import { useEffect, useState } from "react";
import { buscarDadosDashboard } from "../services/telemetriaApi";

export function useTelemetria(limite = 20, intervaloMs = 2000) {
  const [maquinas, setMaquinas] = useState([]);
  const [conectado, setConectado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function atualizar() {
      try {
        const dados = await buscarDadosDashboard(limite);
        if (ativo) {
          setMaquinas(dados.maquinas || []);
          setConectado(true);
        }
      } catch (erro) {
        if (ativo) {
          setConectado(false);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    atualizar();
    const timer = setInterval(atualizar, intervaloMs);

    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, [limite, intervaloMs]);

  // Junta todos os alertas de todas as máquinas para o pop-up global
  const todosAlertas = maquinas.flatMap((m) => m.alertas || []);

  return { maquinas, conectado, carregando, todosAlertas };
}