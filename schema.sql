-- Remove tabelas existentes se houver (para reinicialização fácil)
DROP TABLE IF EXISTS voos;
DROP TABLE IF EXISTS elenco;
DROP TABLE IF EXISTS projetos;

-- Tabela de Projetos
CREATE TABLE projetos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE, -- Nome do projeto deve ser único
    data_inicio TEXT,          -- Armazenar como TEXT (YYYY-MM-DD)
    data_fim TEXT
);

-- Tabela de Elenco/Diretores (associados a um projeto)
CREATE TABLE elenco (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    projeto_id INTEGER NOT NULL,
    FOREIGN KEY (projeto_id) REFERENCES projetos (id)
        ON DELETE CASCADE -- Se um projeto for excluído, seus membros de elenco também serão
);

-- Tabela de Dados de Voo (associados a um membro do elenco específico)
-- Note que o vínculo com projeto é indireto, via elenco_id -> elenco.projeto_id
CREATE TABLE voos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    elenco_id INTEGER NOT NULL,
    preco_passagem REAL,     -- Usar REAL para valores monetários
    dados_voo TEXT,
    trecho TEXT,
    data_voo TEXT,           -- Armazenar como TEXT (YYYY-MM-DD)
    horario TEXT,            -- Armazenar como TEXT (HH:MM)
    data_emissao TEXT,       -- Armazenar como TEXT (YYYY-MM-DD)
    solicitacao TEXT,
    complemento TEXT,
    FOREIGN KEY (elenco_id) REFERENCES elenco (id)
        ON DELETE CASCADE -- Se um membro do elenco for excluído, seus voos também serão
);

-- Índices para melhorar performance de busca (opcional, mas recomendado)
CREATE INDEX idx_elenco_projeto_id ON elenco (projeto_id);
CREATE INDEX idx_voos_elenco_id ON voos (elenco_id);