import csv
import os
import threading
from datetime import datetime
from typing import Dict, List, Optional

import pandas as pd
from config import CSV_COLUMNS, CSV_FILE_PATH


class CsvStorage:
    def __init__(self, file_path: str = CSV_FILE_PATH):
        self.file_path = file_path
        # Cadeado de segurança para evitar conflito entre escrita (Serial) e leitura (API)
        self._lock = threading.Lock()
        self._initialize_file()

    def _initialize_file(self) -> None:
        """Cria o arquivo CSV com o cabeçalho caso ele ainda não exista."""
        with self._lock:
            if not os.path.exists(self.file_path):
                with open(self.file_path, mode="w", newline="", encoding="utf-8") as f:
                    writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
                    writer.writeheader()

    def save_reading(self, payload: Dict) -> Dict:
        """
        Recebe um dicionário validado do Arduino, adiciona o timestamp atual
        e grava uma nova linha no final do CSV.
        """
        row = {
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "machine_id": int(payload["id"]),
            "temperatura": float(payload["temperatura"]),
            "vibracao": float(payload["vibracao"]),
            "rotacao": float(payload["rotacao"]),
            "profundidade": float(payload["profundidade"]),
        }

        with self._lock:
            with open(self.file_path, mode="a", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
                writer.writerow(row)

        return row

    def get_recent_readings(
        self, limit: int = 50, machine_id: Optional[int] = None
    ) -> tuple[int, List[Dict]]:
        """
        Lê o CSV de forma segura e retorna:
        (total_registros_no_arquivo, lista_das_ultimas_N_leituras)
        """
        with self._lock:
            if not os.path.exists(self.file_path):
                return 0, []

            df = pd.read_csv(self.file_path)

        if df.empty:
            return 0, []

        # Se o front-end pediu dados de uma sonda específica (ex: ?machine_id=4)
        if machine_id is not None:
            df = df[df["machine_id"] == machine_id]

        total_records = len(df)
        # Pega apenas as últimas 'limit' linhas e converte para lista de dicionários
        recent_df = df.tail(limit)
        records = recent_df.to_dict(orient="records")

        return total_records, records