import { taoApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3000);
const app = taoApp({ thuMucLuu: process.env.THU_MUC_LUU ?? './uploads' });

const server = app.listen(PORT, () => console.log(`http://localhost:${PORT}`));

function tat() {
  server.close();
  server.closeIdleConnections();
  process.exitCode = 0;
}
process.on('SIGINT', tat);
process.on('SIGTERM', tat);
