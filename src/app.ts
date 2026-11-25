import express from 'express';
import swaggerUi from 'swagger-ui-express';
import sessaoRoutes from './routes/sessao.routes';
import { especificacao } from './swagger';
import { tratarErros } from './erros';

const app = express();

app.use(express.json());

app.use(sessaoRoutes);

// swagger
app.get('/docs.json', (req, res) => {
  res.json(especificacao);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(especificacao));

// tem que ficar por último
app.use(tratarErros);


//Uma diff para ser removida

export default app;
