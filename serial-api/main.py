from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, List, Optional

import pandas as pd
import uvicorn
from config import API_HOST, API_PORT
from csv_storage import CsvStorage
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from serial_worker import SerialWorker

storage = CsvStorage()
worker = SerialWorker(storage=storage)

METRIC_COLUMNS = ["temperatura", "vibracao", "rotacao", "profundidade"]

SENSOR_CONFIG = {
    "profundidade": {"titulo": "Profundidade", "unidade": "m", "limite": None},
    "rotacao": {"titulo": "Rotação", "unidade": "RPM", "limite": 45.0},
    "temperatura": {"titulo": "Temperatura", "unidade": "°C", "limite": 40.0},
    "vibracao": {"titulo": "Vibração", "unidade": "Hz", "limite": 40.0},
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    worker.start()
    yield
    worker.stop()


app = FastAPI(
    title="GEOSOL - API de Telemetria Edge",
    description="Coleta dados da Serial do Arduino, salva em CSV e calcula estatísticas.",
    version="1.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def formatar_data_hora(iso_ts: str) -> tuple[str, str]:
    """Converte '2026-11-20T15:52:40' em ('15:52:40', '20/11/2026 15:52:40')."""
    try:
        dt = datetime.fromisoformat(iso_ts)
        return dt.strftime("%H:%M:%S"), dt.strftime("%d/%m/%Y %H:%M:%S")
    except ValueError:
        hora = iso_ts.split("T")[1] if "T" in iso_ts else iso_ts
        return hora, iso_ts


def calculate_statistics(records: List[Dict]) -> Dict:
    """Calcula Atual, Média, Mediana e Moda para cada métrica."""
    if not records:
        return {}

    df = pd.DataFrame(records)
    stats = {}

    for col in METRIC_COLUMNS:
        series = df[col].dropna()
        if series.empty:
            continue

        modes = series.round(1).mode()
        moda_val = float(modes.iloc[0]) if not modes.empty else float(series.iloc[-1])

        stats[col] = {
            "atual": round(float(series.iloc[-1]), 2),
            "media": round(float(series.mean()), 2),
            "mediana": round(float(series.median()), 2),
            "moda": round(moda_val, 2),
        }

    return stats


def extract_alerts(machine_id: int, records: List[Dict]) -> List[Dict]:
    """Identifica leituras fora do limite e formata dia e hora para a tabela."""
    alertas = []

    for row in records:
        ts = row.get("timestamp", "")
        hora, data_hora = formatar_data_hora(ts)

        for chave, meta in SENSOR_CONFIG.items():
            limite = meta["limite"]
            valor = row.get(chave)

            if limite is not None and valor is not None and float(valor) > limite:
                alertas.append(
                    {
                        "id": f"{machine_id}-{ts}-{chave}",
                        "machine_id": machine_id,
                        "chave": chave,
                        "titulo": meta["titulo"],
                        "unidade": meta["unidade"],
                        "valor": round(float(valor), 2),
                        "limite": limite,
                        "hora": hora,
                        "data_hora": data_hora,
                    }
                )

    alertas.reverse()
    return alertas


@app.get("/api/telemetria")
def get_telemetria(
    limite: int = Query(default=30, ge=1, le=1000),
    machine_id: Optional[int] = Query(default=None),
):
    total_registros, historico = storage.get_recent_readings(
        limit=limite, machine_id=machine_id
    )
    return {
        "machine_id_filtro": machine_id,
        "total_registros_csv": total_registros,
        "amostra_analisada": len(historico),
        "estatisticas": calculate_statistics(historico),
        "historico": historico,
    }


@app.get("/api/dashboard")
def get_dashboard(
    limite: int = Query(default=20, ge=1, le=500),
):
    grouped = storage.get_grouped_by_machine(limit=limite)
    maquinas_lista = []

    for machine_id, data in grouped.items():
        historico = data["historico"]
        for item in historico:
            hora, _ = formatar_data_hora(item.get("timestamp", ""))
            item["hora"] = hora

        alertas = extract_alerts(machine_id, historico)

        maquinas_lista.append(
            {
                "machine_id": machine_id,
                "total_registros_csv": data["total_registros"],
                "estatisticas": calculate_statistics(historico),
                "total_alertas": len(alertas),
                "alertas": alertas,
                "historico": historico,
            }
        )

    return {
        "total_maquinas": len(maquinas_lista),
        "maquinas": maquinas_lista,
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=False)