/**
 * Chạy nhà cung cấp mini (cổng 4000) và shop (cổng 3000).
 *
 *   npm start  →  mở http://localhost:3000
 */

import { taoNhaCungCap } from './nha-cung-cap/app.js';
import { taoShop } from './shop/app.js';

const env = process.env;
const congShop = Number(env.CONG_SHOP ?? 3000);
const congNcc = Number(env.CONG_NHA_CUNG_CAP ?? 4000);

for (const k of ['OIDC_ISSUER', 'OIDC_CLIENT_ID', 'OIDC_CLIENT_SECRET', 'OIDC_REDIRECT_URI']) {
  if (!env[k]) throw new Error(`Thiếu biến môi trường ${k} (xem .env.example)`); // fail fast — buổi 03
}

if (env.CHAY_NHA_CUNG_CAP === '1') {
  const ncc = await taoNhaCungCap({
    issuer: env.OIDC_ISSUER,
    clients: {
      [env.OIDC_CLIENT_ID]: { secret: env.OIDC_CLIENT_SECRET, redirectUris: [env.OIDC_REDIRECT_URI] },
    },
  });
  await new Promise((r) => ncc.listen(congNcc, r));
  console.log(`Nhà cung cấp mini: ${env.OIDC_ISSUER}`);
}

const shop = await taoShop({
  issuer: env.OIDC_ISSUER,
  clientId: env.OIDC_CLIENT_ID,
  clientSecret: env.OIDC_CLIENT_SECRET,
  redirectUri: env.OIDC_REDIRECT_URI,
});
shop.listen(congShop, () => console.log(`Shop:              http://localhost:${congShop}`));
