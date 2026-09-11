import app from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Vynexa CRM Backend API running on http://localhost:${PORT}`);
  console.log(`📡 Health endpoint available at http://localhost:${PORT}/api/health`);
});
