import { taoDonHang } from './app.js';
import { chayChinh } from '../../shared/dich-vu.js';
import { taoLogger } from '../../shared/logger.js';

const logger = taoLogger('don-hang');
const env = process.env;

await chayChinh(
  ({ khiMatKetNoi }) =>
    taoDonHang({ dbUrl: env.DB_DON_HANG, mqUrl: env.RABBITMQ_URL, cong: Number(env.CONG_DON_HANG ?? 3201), logger, khiMatKetNoi }),
  logger
);
