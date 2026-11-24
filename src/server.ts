// Carrega o .env antes de tudo, para que o db.ts já encontre as variáveis.
import 'dotenv/config';
import app from './app';

const porta = process.env.PORT || 3000;

app.listen(porta, () => {
  console.log(`API rodando em http://localhost:${porta}`);
  console.log(`Documentação em http://localhost:${porta}/docs`);
});
