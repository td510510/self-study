import { taoKho } from './app.js';
import { chayChinh } from '../../shared/dich-vu.js';
import { taoLogger } from '../../shared/logger.js';

const logger = taoLogger('kho');
const env = process.env;

await chayChinh(
  ({ khiMatKetNoi }) =>
    taoKho({
      dbUrl: env.DB_KHO, mqUrl: env.RABBITMQ_URL, cong: Number(env.CONG_KHO ?? 3202), logger, khiMatKetNoi,
      doTreMs: Number(env.KHO_DO_TRE_MS ?? 0),
    }),
  logger
);
