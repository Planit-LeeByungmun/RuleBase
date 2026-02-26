import app from './app';
import { pool } from './config/database';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function startServer() {
  try {
    // Test DB connection
    await pool.query('SELECT 1');
    console.log('Database connected');

    app.listen(PORT, () => {
      console.log(`RuleBase backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
