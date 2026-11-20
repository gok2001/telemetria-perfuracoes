
-- Padronização da tabela usuario

ALTER TABLE usuario
    RENAME COLUMN nivel_acesso TO cargo;

UPDATE usuario
SET cargo = UPPER(TRIM(cargo)),
    status = UPPER(TRIM(status));

ALTER TABLE usuario
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ATIVO';

ALTER TABLE usuario
    ADD CONSTRAINT chk_usuario_cargo
        CHECK (cargo IN ('OPERADOR', 'CONTROLADOR'));

ALTER TABLE usuario
    ADD CONSTRAINT chk_usuario_status
        CHECK (status IN ('ATIVO', 'INATIVO'));


-- Padronização da tabela operacao

UPDATE operacao
SET status = UPPER(TRIM(status));

ALTER TABLE operacao
    MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'OPERANDO';

ALTER TABLE operacao
    ADD CONSTRAINT chk_operacao_status
        CHECK (status IN ('OPERANDO', 'MANUTENCAO', 'DESLIGADO'));
