import json
import threading
import time
from typing import Optional

import serial
from config import BAUD_RATE, SERIAL_PORT
from csv_storage import CsvStorage

# Chaves obrigatórias que o JSON do Arduino precisa ter
REQUIRED_KEYS = {"id", "temperatura", "vibracao", "rotacao", "profundidade"}


class SerialWorker:
    def __init__(self, storage: CsvStorage):
        self.storage = storage
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def start(self) -> None:
        """Inicia a leitura Serial em uma thread paralela (não bloqueia a API)."""
        self._thread = threading.Thread(target=self._run_serial, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        """Sinaliza para o loop encerrar de forma limpa."""
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2)

    def _validate_and_save(self, raw_line: str) -> None:
        """Converte a string JSON, valida os campos e salva no CSV."""
        try:
            data = json.loads(raw_line)

            if not isinstance(data, dict) or not REQUIRED_KEYS.issubset(data.keys()):
                print(f"[AVISO] JSON incompleto ignorado: {raw_line}")
                return

            saved_row = self.storage.save_reading(data)
            print(f"[OK] Dado salvo: {saved_row}")

        except json.JSONDecodeError:
            print(f"[RUÍDO SERIAL] Linha descartada (não é JSON válido): {raw_line}")
        except (ValueError, TypeError) as e:
            print(f"[ERRO DE TIPO] Valor inválido no JSON ({e}): {raw_line}")

    def _run_serial(self) -> None:
        """Conecta na porta USB real do Arduino e lê linha por linha."""
        while not self._stop_event.is_set():
            try:
                print(f"[SERIAL] Conectando em {SERIAL_PORT} ({BAUD_RATE} baud)...")
                with serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2) as ser:
                    print(f"[SERIAL] Conectado com sucesso em {SERIAL_PORT}!")
                    # Descarta o buffer inicial que pode conter lixo elétrico
                    ser.reset_input_buffer()

                    while not self._stop_event.is_set():
                        if ser.in_waiting > 0:
                            line = ser.readline().decode("utf-8", errors="ignore").strip()
                            if line:
                                self._validate_and_save(line)
                        else:
                            time.sleep(0.05)

            except serial.SerialException as e:
                print(f"[ERRO SERIAL] Falha na porta {SERIAL_PORT}: {e}")
                print("[SERIAL] Tentando reconectar em 3 segundos...")
                time.sleep(3)