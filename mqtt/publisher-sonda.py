import paho.mqtt.client as mqtt
import time
import random
import json

broker = "10.110.18.11"
port = 1883

topicTemperatura = "sensorMz/temperatura"
topicRotatcao = "sensorMz/rotacao"
topicProfundidade = "sensorMz/profundidade"
topicVibracao = "sensorMz/vibracao"

def publicacaoDados(id, medida, unidade, topic):

    dados = {
        "sensor" : str(id),
        "medida" : medida,
        "medicao" : round(random.uniform(10, 50), 2),
        "unidade" : unidade,
        "timestamp" : time.time()
    }

    mensagem = json.dumps(dados)
    client.publish(topic, mensagem)
    print(f"Enviado: {mensagem}\n")
    time.sleep(15)


client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

client.connect(broker, port, 60)

while True:
    publicacaoDados(1, "temperatura", "°C", topicTemperatura)
    publicacaoDados(2, "rotacao", "rpm", topicRotatcao)
    publicacaoDados(3, "profundidade", "m", topicProfundidade)
    publicacaoDados(4, "vibracao", "Hz", topicVibracao)