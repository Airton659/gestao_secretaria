# FUNCESI · Gestão Secretaria

[![Tests](https://github.com/Airton659/gestao_secretaria/actions/workflows/tests.yml/badge.svg)](https://github.com/Airton659/gestao_secretaria/actions/workflows/tests.yml)

Sistema da secretaria acadêmica com indicadores de notas dos alunos e ajuste da capacidade das
subturmas, lendo e gravando direto na base do TOTVS RM.

> ⚠️ **Sem testes automatizados.** O `tests.yml` só compila a API. Veja
> [Adequação aos padrões](#adequação-aos-padrões).

---

## Visão Geral

- **Indicadores:** notas de provas e de etapas dos alunos, por período letivo, turma e
  disciplina.
- **Subturmas:** lista as subturmas das turmas/disciplinas gerenciadas e altera o máximo de
  alunos (`SSUBTURMA`).
- **Perfis de acesso:** perfis com permissões por tela, ligados a usuários do AD.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | .NET 9, ASP.NET Core com Controllers e Repositories, Dapper + ODBC (FreeTDS) |
| Frontend | React 19, Vite, TailwindCSS, `keycloak-js` |
| Banco | SQL Server: base da Secretaria (perfis) e base do RM (indicadores e subturmas) |
| Autenticação | Keycloak (realm `funcesi-sso`, client `avaliacao`) |
| Infra | Docker, GitHub Actions, GHCR, Portainer |

---

## Funcionalidades e API

Todas as rotas exigem o token do Keycloak.

| Rota | O que faz |
|---|---|
| `GET /api/auth/me`, `GET /api/auth/perfil` | Usuário logado e permissões do perfil |
| `GET /api/indicadores/notas-provas` | Notas de provas (`SNOTAS`) |
| `GET /api/indicadores/notas-etapas` | Notas de etapas (`SNOTAETAPA`) |
| `GET /api/subturmas` | Subturmas das turmas/disciplinas gerenciadas |
| `PUT /api/subturmas/maxalunos` | Altera o máximo de alunos da subturma no RM |
| `/api/perfis` | CRUD de perfis e vínculo de usuários (`/{id}/usuarios`) |

---

## Estrutura do Projeto

```
GestaoSecretaria/
├── Controllers/          # Auth, Indicadores, Subturmas, Perfis
├── Services/             # PermissaoService
├── Repositories/         # SQL por domínio
├── Data/                 # fábricas de conexão (Secretaria e RM)
├── Configuration/ e Middleware/
├── frontend/             # React + Vite
├── scripts/init.sql      # criação das tabelas de perfis
├── Dockerfile.api / Dockerfile.frontend / nginx.conf
├── docker-compose.yml    # stack do Portainer
└── docker-compose.dev.yml
```

---

## Como Rodar

### Pré-requisitos

- Docker, ou .NET SDK 9 e Node 20
- Acesso à rede interna: SQL Server e Keycloak

### Variáveis de Ambiente

Copie `.env.example` para `.env` (está no `.gitignore`) e preencha:

```env
DB_CONNECTION_STRING=Driver={FreeTDS};Server=<servidor-sql>;Port=<porta-sql>;Database=<banco-secretaria>;UID=<usuario>;PWD=<senha>;TDS_Version=7.4;
CORP_CONNECTION_STRING=Driver={FreeTDS};Server=<servidor-sql>;Port=<porta-sql>;Database=<banco-corp>;UID=<usuario>;PWD=<senha>;TDS_Version=7.4;
KEYCLOAK_AUTHORITY=<url-keycloak>/realms/funcesi-sso
KEYCLOAK_METADATA_ADDRESS=<url-interna-keycloak>/realms/funcesi-sso/.well-known/openid-configuration
Keycloak__AdminClientSecret=<secret-do-client-admin>
API_PORT=<porta-api>
FRONTEND_PORT=<porta-frontend>
```

`KEYCLOAK_METADATA_ADDRESS` é opcional: serve para a API buscar a configuração do Keycloak pela
rede interna do Docker (`keycloak_default`) em vez do endereço externo.

Rodando sem Docker, as mesmas chaves ficam no `appsettings.json` (com placeholders no repositório).

### Desenvolvimento local

```bash
docker compose -f docker-compose.dev.yml up
```

Usa o `.env.dev` (também no `.gitignore`). API em http://localhost:5001 e frontend em
http://localhost:5173.

---

## Banco de Dados

| Conexão | Uso |
|---|---|
| `DefaultConnection` | Base da Secretaria: `PerfisAcesso` e `UsuariosPerfil` |
| `CorpConnection` | Base do RM: notas, turmas e subturmas. **Grava** em `SSUBTURMA` |

O `scripts/init.sql` cria as tabelas de perfis. É rodado uma vez, manualmente, pelo DBA.

---

## Testes

Ainda não há projeto de testes. O workflow `tests.yml` só garante que a API compila.

---

## CI/CD

### Repositórios

| Remote | Endereço | Papel |
|---|---|---|
| `origin` | Projeto Fluir `FUN.Web.ACA.GestaoSecretaria` | Fonte. O desenvolvimento acontece aqui |
| `github` | GitHub `Airton659/gestao_secretaria` | Espelho do deploy (Actions → GHCR → Portainer) |

Para publicar o que está na `main` do Fluir:

1. `git pull origin main`
2. `git push github main`
3. Esperar o Actions terminar verde e fazer o redeploy no Portainer.

### Workflows

| Arquivo | Quando | O que faz |
|---|---|---|
| `tests.yml` | Push e PR na `main` | Compila a API |
| `deploy.yml` | `Tests` terminou com sucesso na `main` | Builda e publica `ghcr.io/airton659/secretaria-api:latest` e `secretaria-frontend:latest` |

---

## Deploy (Portainer)

| Item | Valor |
|---|---|
| Stack | `gestao-secretaria` (compose colado no editor do Portainer) |
| Containers | `secretaria-api` e `secretaria-frontend` |
| Portas publicadas | `${API_PORT}` e `${FRONTEND_PORT}`, definidas no Portainer |
| Rede | `keycloak_default` (externa), para a API falar com o Keycloak |
| Variáveis do stack | As do `.env.example`, nas *Environment variables* do stack, nunca no repositório |

O frontend é um nginx que serve o build e repassa `/api/` para a `secretaria-api:8080`.

### Atualizar

1. `git push github main` → `tests.yml` passa → `deploy.yml` publica as imagens.
2. No Portainer, stack `gestao-secretaria` → **Pull and redeploy**.

### Proxy reverso (nginx)

Ainda não tem rota no nginx-proxy: o acesso é direto pela porta do servidor. Para publicar num
caminho (`/<caminho>/`), buildar o frontend com `VITE_BASE_PATH=/<caminho>/`.

---

## Adequação aos padrões

| Padrão | Hoje |
|---|---|
| Minimal API com Endpoint, Handler e Service | Controllers e Repositories |
| Banco via `Funcesi.DbConnector` | Fábricas de conexão próprias com Dapper/ODBC |
| Frontend com `@funcesi/ui` | Componentes próprios com Tailwind |
| Testes travando o deploy | Só compilação |

---

## Licença

Projeto desenvolvido para uso interno da **FUNCESI — Fundação Comunitária de Ensino Superior de
Itabira**.
