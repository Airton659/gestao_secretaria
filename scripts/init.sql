-- Script de inicialização do banco da Secretaria
-- Execute uma única vez antes de subir a aplicação pela primeira vez

-- ── Tabela de Perfis de Acesso ────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PerfisAcesso')
BEGIN
    CREATE TABLE PerfisAcesso (
        Id          INT           IDENTITY(1,1) PRIMARY KEY,
        Nome        NVARCHAR(100) NOT NULL,
        Permissoes  NVARCHAR(MAX) NOT NULL DEFAULT '{}',
        CreatedAt   DATETIME      NOT NULL DEFAULT GETDATE(),
        UpdatedAt   DATETIME      NOT NULL DEFAULT GETDATE(),
        CriadoPor   NVARCHAR(200) NULL,
        AlteradoPor NVARCHAR(200) NULL
    );

    -- Perfil Admin padrão (seed feito também pelo Program.cs, mas garante aqui)
    INSERT INTO PerfisAcesso (Nome, Permissoes, CriadoPor)
    VALUES ('Admin', '{}', 'sistema');

    PRINT 'Tabela PerfisAcesso criada.';
END
ELSE
    PRINT 'Tabela PerfisAcesso já existe — nenhuma alteração.';
GO

-- ── Tabela de Usuários por Perfil ─────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UsuariosPerfil')
BEGIN
    CREATE TABLE UsuariosPerfil (
        Id             INT           IDENTITY(1,1) PRIMARY KEY,
        LoginAd        NVARCHAR(200) NOT NULL,
        PerfilAcessoId INT           NOT NULL REFERENCES PerfisAcesso(Id) ON DELETE CASCADE,
        CreatedAt      DATETIME      NOT NULL DEFAULT GETDATE(),
        UpdatedAt      DATETIME      NOT NULL DEFAULT GETDATE(),
        CriadoPor      NVARCHAR(200) NULL,
        AlteradoPor    NVARCHAR(200) NULL
    );

    CREATE INDEX IX_UsuariosPerfil_LoginAd        ON UsuariosPerfil(LoginAd);
    CREATE INDEX IX_UsuariosPerfil_PerfilAcessoId ON UsuariosPerfil(PerfilAcessoId);

    PRINT 'Tabela UsuariosPerfil criada.';
END
ELSE
    PRINT 'Tabela UsuariosPerfil já existe — nenhuma alteração.';
GO
