from contextlib import asynccontextmanager
from typing import Dict, List, Optional
import uvicorn
import pandas as pd
from csv_storage import CsvStorage
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from serial_worker import SerialWorker
from config import API_HOST, API_PORT

# Instâncias únicas (Singletons) compartilhadas pela aplicação
storage = CsvStorage()
worker = SerialWorker(storage=storage)

# Lista das métricas numéricas sobre as quais calcularemos Média, Mediana e Moda
METRIC_COLUMNS = ["temperatura", "vibracao", "rotacao", "profundidade"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o que acontece quando a API liga e quando ela desliga."""
    worker.start()  # Liga a leitura da Serial em segundo plano
    yield
    worker.stop()   # Desliga a Serial de forma limpa ao encerrar o servidor


app = FastAPI(
    title="API de Telemetria",
    description="Coleta dados da Serial do Arduino, salva em CSV e calcula estatísticas.",
    version="1.0.0",
    lifespan=lifespan,
)

# Libera o acesso para o Front-end React (rodando em outra porta, ex: 5173 ou 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restringiremos ao domínio exato do front-end
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def calculate_statistics(records: List[Dict]) -> Dict:
    """Recebe a lista de leituras recentes e calcula Atual, Média, Mediana e Moda."""
    if not records:
        return {}

    df = pd.DataFrame(records)
    stats = {}

    for col in METRIC_COLUMNS:
        series = df[col].dropna()
        if series.empty:
            continue

        # Arredonda para 1 casa decimal para encontrar a moda real de sinais contínuos
        modes = series.round(1).mode()
        moda_val = float(modes.iloc[0]) if not modes.empty else float(series.iloc[-1])

        stats[col] = {
            "atual": round(float(series.iloc[-1]), 2),
            "media": round(float(series.mean()), 2),
            "mediana": round(float(series.median()), 2),
            "moda": round(moda_val, 2),
        }

    return stats


@app.get("/api/telemetria")
def get_telemetria(
    limite: int = Query(default=30, ge=1, le=1000, description="Quantidade de leituras recentes"),
    machine_id: Optional[int] = Query(default=None, description="Filtrar pelo ID da sonda (ex: 4)"),
):
    """
    Retorna as últimas leituras salvas no CSV junto com os cálculos
    de Média, Mediana e Moda calculados sob demanda.
    """
    total_registros, historico = storage.get_recent_readings(
        limit=limite, machine_id=machine_id
    )
    estatisticas = calculate_statistics(historico)

    return {
        "machine_id_filtro": machine_id,
        "total_registros_csv": total_registros,
        "amostra_analisada": len(historico),
        "estatisticas": estatisticas,
        "historico": historico,
    }

if __name__ == "__main__":
    # Inicia o servidor Uvicorn usando o host e a porta configurados no config.py
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=False)