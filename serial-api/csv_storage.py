import csv
import os
import threading
from datetime import datetime
from typing import Dict, List, Optional

import pandas as pd
from config import CSV_COLUMNS, CSV_FILENAME, DATA_DIR


class CsvStorage:
    def __init__(self, base_data_dir: str = DATA_DIR):
        self.base_data_dir = base_data_dir
        self._lock = threading.Lock()
        # Garante que a pasta e o CSV do dia atual já existam ao iniciar
        self._ensure_today_file()

    def _get_today_csv_path(self) -> str:
        """Retorna o caminho 'serial-api/dados/YYYY-MM-DD/dados_sonda.csv' do dia atual."""
        today_folder = datetime.now().strftime("%Y-%m-%d")
        daily_dir = os.path.join(self.base_data_dir, today_folder)
        os.makedirs(daily_dir, exist_ok=True)
        return os.path.join(daily_dir, CSV_FILENAME)

    def _ensure_today_file(self) -> str:
        """Cria a pasta do dia e o CSV com cabeçalho caso ainda não existam."""
        with self._lock:
            file_path = self._get_today_csv_path()
            if not os.path.exists(file_path):
                with open(file_path, mode="w", newline="", encoding="utf-8") as f:
                    writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
                    writer.writeheader()
            return file_path

    def save_reading(self, payload: Dict) -> Dict:
        """Salva a leitura no CSV da pasta correspondente ao dia atual."""
        now = datetime.now()
        row = {
            "timestamp": now.isoformat(timespec="seconds"),
            "machine_id": int(payload["id"]),
            "temperatura": float(payload["temperatura"]),
            "vibracao": float(payload["vibracao"]),
            "rotacao": float(payload["rotacao"]),
            "profundidade": float(payload["profundidade"]),
        }

        with self._lock:
            file_path = self._get_today_csv_path()
            file_exists = os.path.exists(file_path)

            with open(file_path, mode="a", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
                if not file_exists:
                    writer.writeheader()
                writer.writerow(row)

        return row

    def get_recent_readings(
        self, limit: int = 50, machine_id: Optional[int] = None
    ) -> tuple[int, List[Dict]]:
        """Lê as últimas leituras do CSV do dia atual."""
        with self._lock:
            file_path = self._get_today_csv_path()
            if not os.path.exists(file_path):
                return 0, []
            df = pd.read_csv(file_path)

        if df.empty:
            return 0, []

        if machine_id is not None:
            df = df[df["machine_id"] == machine_id]

        total_records = len(df)
        records = df.tail(limit).to_dict(orient="records")
        return total_records, records

    def get_grouped_by_machine(self, limit: int = 50) -> Dict[int, Dict]:
        """Lê o CSV do dia atual e agrupa as últimas 'limit' leituras por machine_id."""
        with self._lock:
            file_path = self._get_today_csv_path()
            if not os.path.exists(file_path):
                return {}
            df = pd.read_csv(file_path)

        if df.empty:
            return {}

        grouped = {}
        for machine_id, group_df in df.groupby("machine_id", sort=True):
            m_id = int(machine_id)
            grouped[m_id] = {
                "total_registros": len(group_df),
                "historico": group_df.tail(limit).to_dict(orient="records"),
            }

        return grouped