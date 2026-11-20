import os

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8001"))

SERIAL_PORT = os.getenv("SERIAL_PORT", "COM3")

BAUD_RATE = int(os.getenv("BAUD_RATE", "115200"))

CSV_FILE_PATH = "dados_sonda.csv"

CSV_COLUMNS = [
    "timestamp",
    "machine_id",
    "temperatura",
    "vibracao",
    "rotacao",
    "profundidade",
]