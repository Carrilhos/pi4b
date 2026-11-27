import express from 'express';
import swaggerUi from 'swagger-ui-express';
import sessaoRoutes from './routes/sessao.routes';
import inscricaoRoutes from './routes/inscricao.routes';
import academicoRoutes from './routes/academico.routes';
import { especificacao } from './swagger';
import { tratarErros } from './erros';

const app = express();

app.use(express.json());

app.use(sessaoRoutes);
app.use(inscricaoRoutes);
app.use(academicoRoutes);

// swagger
app.get('/docs.json', (req, res) => {
  res.json(especificacao);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(especificacao));

// tem que ficar por último
app.use(tratarErros);

export default app;