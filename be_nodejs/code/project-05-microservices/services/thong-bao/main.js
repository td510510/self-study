import { taoThongBao, hopThuGiaLap } from './app.js';
import { chayChinh } from '../../shared/dich-vu.js';
import { taoLogger } from '../../shared/logger.js';

const logger = taoLogger('thong-bao');
const env = process.env;

await chayChinh(
  ({ khiMatKetNoi }) =>
    taoThongBao({
      dbUrl: env.DB_THONG_BAO, mqUrl: env.RABBITMQ_URL, cong: Number(env.CONG_THONG_BAO ?? 3203), logger, khiMatKetNoi,
      hopThu: hopThuGiaLap({ tiLeLoi: Number(env.THONG_BAO_TI_LE_LOI ?? 0), logger }),
    }),
  logger
);
