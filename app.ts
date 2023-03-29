import express from 'express';
import bodyParser from 'body-parser';
import router from './api/routes/Transactions.js';

const app = express();

app.use(bodyParser.json());
app.use('/api', router);
app.use('/api', (req, res) => {
  if (req.originalUrl !== '/api') {
    res.status(404);
    res.send();
    return;
  }
  res.status(200);
  res.send(`
    <h1>Welcome to the API</h1>
  `);
});

export default app;
