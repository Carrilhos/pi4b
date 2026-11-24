# API de Monitorias Acadêmicas

API REST da Plataforma de Monitorias Acadêmicas (UCPel - ADS), feita em Node.js + TypeScript, Express e PostgreSQL.

Nesta entrega: `POST /sessoes`, `GET /sessoes` e a documentação Swagger em `/docs`.

## Requisitos

- Node.js 20 ou superior
- Acesso ao banco PostgreSQL na nuvem (já criado, com tabelas e dados de exemplo)

## Instalação

```bash
npm install
```

## Configuração do `.env`

Copie o `.env.example` para `.env` e preencha com os dados do banco:

```
DATABASE_URL=postgresql://usuario:senha@host:5432/banco
PORT=3000
```

`PORT` é opcional (o padrão é `3000`). O `.env` **não** deve ser versionado (já está no `.gitignore`).

> O arquivo `database/schema.sql` é só documentação. **Não execute**: ele apaga e recria as tabelas.

## Como rodar

```bash
npm run dev     # modo desenvolvimento (reinicia ao salvar)
npm start       # modo normal
```

A API sobe em `http://localhost:3000`.

## Documentação (Swagger)

- Interface interativa: `http://localhost:3000/docs` (use *Try it out* para testar)
- Especificação em JSON: `http://localhost:3000/docs.json`

## Estrutura

```
src/
├── server.ts        # carrega o .env e sobe o servidor
├── app.ts           # monta o Express: json, rotas, swagger, erros
├── db.ts            # conexão (Pool) com o PostgreSQL
├── swagger.ts       # configuração do Swagger
├── erros.ts         # ErroNegocio e o middleware tratarErros
├── routes/          # URLs + documentação @openapi
├── controllers/     # valida o formato da requisição
├── services/        # regras de negócio (RN1, RN2, RN-A)
└── repositories/    # SQL
```
