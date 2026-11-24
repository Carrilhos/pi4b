import express from 'express';
import swaggerUi from 'swagger-ui-express';
import sessaoRoutes from './routes/sessao.routes';
import { especificacao } from './swagger';
import { tratarErros } from './erros';

const app = express();

// Lê o corpo das requisições em JSON e coloca em req.body.
app.use(express.json());

// Rotas da API.
app.use(sessaoRoutes);

// Documentação: JSON da especificação e a interface do Swagger.
app.get('/docs.json', (req, res) => {
  res.json(especificacao);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(especificacao));

// Tratamento de erros: precisa ser o último, para receber os erros de todas as rotas.
app.use(tratarErros);

export default app;
