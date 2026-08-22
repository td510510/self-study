/**
 * Buổi 05 — Router mini tự viết.
 *
 * Đây là BẢN CHẤT của mọi routing library: Express, Fastify, Koa, NestJS
 * đều làm đúng những việc trong file này, chỉ nhiều tính năng hơn.
 *
 * Sau khi viết xong file này, học viên sẽ không còn coi router là "phép màu".
 */

/**
 * Chuyển mẫu đường dẫn thành biểu thức chính quy.
 *
 *   '/todos'          → /^\/todos\/?$/                  , tên tham số: []
 *   '/todos/:id'      → /^\/todos\/([^/]+)\/?$/         , tên tham số: ['id']
 *   '/users/:uid/todos/:tid'
 *                     → /^\/users\/([^/]+)\/todos\/([^/]+)\/?$/, ['uid','tid']
 */
export function pathToRegex(path) {
  const tenThamSo = [];

  // Bước 1: escape các ký tự đặc biệt của regex có thể có trong path
  //         (dấu chấm, dấu ngoặc...) để chúng được hiểu theo nghĩa đen.
  //         Cố tình KHÔNG escape dấu ':' vì ta cần nó ở bước 2.
  const escaped = path.replace(/[.+*?^${}()|[\]\\]/g, '\\$&');

  // Bước 2: đổi mỗi ':ten' thành một nhóm bắt giữ.
  //         [^/]+ nghĩa là "một hoặc nhiều ký tự KHÔNG phải dấu /"
  //         → tham số không được ăn lan sang segment kế tiếp.
  const pattern = escaped.replace(/:([A-Za-z0-9_]+)/g, (_, ten) => {
    tenThamSo.push(ten);
    return '([^/]+)';
  });

  // \/?$ cho phép cả '/todos' lẫn '/todos/' đều khớp.
  return { regex: new RegExp(`^${pattern}/?$`), tenThamSo };
}

/**
 * Tạo một router.
 *
 * Cách dùng:
 *   const router = createRouter();
 *   router.get('/todos', handler);
 *   router.get('/todos/:id', handler);
 *   await router.handle(req, res);
 */
export function createRouter() {
  const routes = [];

  function dangKy(method, path, handler) {
    const { regex, tenThamSo } = pathToRegex(path);
    routes.push({ method, path, regex, tenThamSo, handler });
  }

  return {
    get: (path, h) => dangKy('GET', path, h),
    post: (path, h) => dangKy('POST', path, h),
    put: (path, h) => dangKy('PUT', path, h),
    patch: (path, h) => dangKy('PATCH', path, h),
    delete: (path, h) => dangKy('DELETE', path, h),

    /** Dùng để in ra bảng route lúc khởi động — rất tiện khi debug. */
    danhSach: () => routes.map((r) => `${r.method.padEnd(6)} ${r.path}`),

    /**
     * Tìm route khớp và chạy handler.
     * Trả về true nếu tìm thấy, false nếu không (để tầng trên trả 404).
     */
    async handle(req, res) {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathname = url.pathname;

      // Ghi lại các route khớp PATH nhưng sai METHOD,
      // để trả 405 Method Not Allowed thay vì 404 — đúng chuẩn HTTP.
      const methodKhac = [];

      for (const route of routes) {
        const match = route.regex.exec(pathname);
        if (!match) continue;

        if (route.method !== req.method) {
          methodKhac.push(route.method);
          continue;
        }

        // match[0] là toàn bộ chuỗi khớp, match[1..] là các nhóm bắt giữ
        const params = {};
        route.tenThamSo.forEach((ten, i) => {
          // decodeURIComponent: '/todos/xin%20chao' → id = 'xin chao'
          params[ten] = decodeURIComponent(match[i + 1]);
        });

        req.params = params;
        req.query = Object.fromEntries(url.searchParams);

        await route.handler(req, res);
        return true;
      }

      // Khớp path nhưng sai method → 405, kèm header Allow theo chuẩn
      if (methodKhac.length > 0) {
        res.writeHead(405, {
          'Content-Type': 'application/json; charset=utf-8',
          Allow: methodKhac.join(', '),
        });
        res.end(
          JSON.stringify({
            loi: `Method ${req.method} không được hỗ trợ cho đường dẫn này`,
            choPhep: methodKhac,
          })
        );
        return true;
      }

      return false; // không route nào khớp → tầng trên trả 404
    },
  };
}

/*
 * ĐIỂM DẠY QUAN TRỌNG
 *
 * 1. Vì sao dùng [^/]+ mà không dùng .+ ?
 *    Với '.+', route '/todos/:id' sẽ khớp cả '/todos/1/comments/5'
 *    và cho id = '1/comments/5'. Sai hoàn toàn.
 *    [^/]+ chặn tham số ăn lan sang segment kế tiếp.
 *
 * 2. Vì sao phải escape trước khi thay ':ten' ?
 *    Nếu path là '/file.json', dấu '.' trong regex nghĩa là "ký tự bất kỳ"
 *    → '/fileXjson' cũng khớp. Escape để '.' mang nghĩa đen.
 *
 * 3. Vì sao cần decodeURIComponent ?
 *    Client gửi '/todos/xin%20chao'. Không decode thì id = 'xin%20chao'.
 *
 * 4. Vì sao thứ tự đăng ký route quan trọng ?
 *    Router duyệt từ trên xuống, route nào khớp trước thì thắng.
 *    Đăng ký '/todos/:id' TRƯỚC '/todos/thong-ke'
 *    → gọi /todos/thong-ke sẽ rơi vào :id với id='thong-ke'.
 *    Quy tắc: route CỤ THỂ đăng ký trước, route CÓ THAM SỐ đăng ký sau.
 *    Express cũng hành xử đúng như vậy (buổi 10).
 */
