import { taoApp } from './app.js';
import { prisma } from './lib/prisma.js';

const PORT = Number(process.env.PORT ?? 3000);
const app = taoApp();

const server = app.listen(PORT, () => console.log(`http://localhost:${PORT}`));

async function tatTuTe() {
  server.close();
  server.closeIdleConnections();
  await prisma.$disconnect();
  process.exitCode = 0;
}
process.on('SIGINT', tatTuTe);
process.on('SIGTERM', tatTuTe);
if (process.send) process.on('message', (m) => m === 'shutdown' && tatTuTe().then(() => process.disconnect()));
