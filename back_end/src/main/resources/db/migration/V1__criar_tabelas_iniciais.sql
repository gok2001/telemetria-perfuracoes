CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(11) UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nivel_acesso VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo'
) ENGINE = InnoDB;

CREATE TABLE sonda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'disponivel'
) ENGINE = InnoDB;

CREATE TABLE operacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    sonda_id INT NOT NULL,
    data_hora_inicio TIMESTAMP(3) NOT NULL,
    data_hora_fim TIMESTAMP(3) NULL DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'operando',
    caminho_arquivo VARCHAR(500),

    CONSTRAINT fk_operacao_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario(id),

    CONSTRAINT fk_operacao_sonda
        FOREIGN KEY (sonda_id) REFERENCES sonda(id),

    CONSTRAINT chk_operacao_datas
        CHECK (
            data_hora_fim IS NULL
            OR data_hora_fim >= data_hora_inicio
        ),

    INDEX idx_operacao_sonda_status (sonda_id, status),
    INDEX idx_operacao_usuario (usuario_id)
) ENGINE = InnoDB;

CREATE TABLE limite_medicao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sonda_id INT NOT NULL,
    tipo_medicao VARCHAR(30) NOT NULL,
    valor_minimo DECIMAL(12,4),
    valor_maximo DECIMAL(12,4),

    CONSTRAINT fk_limite_sonda
        FOREIGN KEY (sonda_id) REFERENCES sonda(id),

    CONSTRAINT uk_limite_sonda_tipo
        UNIQUE (sonda_id, tipo_medicao),

    CONSTRAINT chk_limite_valores
        CHECK (
            (valor_minimo IS NOT NULL OR valor_maximo IS NOT NULL)
            AND (
                valor_minimo IS NULL
                OR valor_maximo IS NULL
                OR valor_minimo <= valor_maximo
            )
        )
) ENGINE = InnoDB;

CREATE TABLE alerta (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    operacao_id INT NOT NULL,
    tipo_medicao VARCHAR(30) NOT NULL,
    valor_registrado DECIMAL(12,4) NOT NULL,
    limite_violado DECIMAL(12,4) NOT NULL,
    gravidade VARCHAR(20) NOT NULL,
    data_hora TIMESTAMP(3) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo',

    CONSTRAINT fk_alerta_operacao
        FOREIGN KEY (operacao_id) REFERENCES operacao(id),

    INDEX idx_alerta_operacao_data (operacao_id, data_hora)
) ENGINE = InnoDB;