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
        """Lê as últimas leituras de uma máquina específica ou de todas."""
        with self._lock:
            if not os.path.exists(self.file_path):
                return 0, []
            df = pd.read_csv(self.file_path)

        if df.empty:
            return 0, []

        if machine_id is not None:
            df = df[df["machine_id"] == machine_id]

        total_records = len(df)
        records = df.tail(limit).to_dict(orient="records")
        return total_records, records

    def get_grouped_by_machine(self, limit: int = 20) -> Dict[int, Dict]:
        """
        Lê o CSV uma única vez e retorna um dicionário agrupado por machine_id:
        { 4: { "total_registros": 150, "historico": [...] }, ... }
        """
        with self._lock:
            if not os.path.exists(self.file_path):
                return {}
            df = pd.read_csv(self.file_path)

        if df.empty:
            return {}

        grouped = {}
        # Agrupa pelo ID da sonda e ordena pelo ID crescente
        for machine_id, group_df in df.groupby("machine_id", sort=True):
            m_id = int(machine_id)
            grouped[m_id] = {
                "total_registros": len(group_df),
                "historico": group_df.tail(limit).to_dict(orient="records"),
            }

        return grouped