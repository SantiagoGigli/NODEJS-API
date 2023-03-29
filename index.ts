import app from './app.js';

import { mongooseConnection } from './utils/mongoose.js';

const PORT = 5000;

const startApp = async () => {
  try {
    await mongooseConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Server started on port ${PORT}!`);
    });
  } catch (error) {
    console.error(error);
  }
};

startApp();
