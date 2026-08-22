/**
 * Router mini — bản hoàn thiện từ buổi 05.
 */

export function pathToRegex(path) {
  const tenThamSo = [];

  // Escape các ký tự đặc biệt của regex để chúng mang nghĩa đen.
  // Cố tình KHÔNG escape dấu ':' vì ta cần nó ở bước sau.
  const escaped = path.replace(/[.+*?^${}()|[\]\\]/g, '\\$&');

  // Đổi mỗi ':ten' thành một nhóm bắt giữ.
  // [^/]+ = "một hoặc nhiều ký tự KHÔNG phải dấu /"
  // → tham số không ăn lan sang segment kế tiếp.
  const pattern = escaped.replace(/:([A-Za-z0-9_]+)/g, (_, ten) => {
    tenThamSo.push(ten);
    return '([^/]+)';
  });

  // \/?$ cho phép cả '/todos' lẫn '/todos/' đều khớp
  return { regex: new RegExp(`^${pattern}/?$`), tenThamSo };
}

export function createRouter() {
  const routes = [];

  function dangKy(method, path, handler) {
    const { regex, tenThamSo } = pathToRegex(path);
    routes.push({ method, path, regex, tenThamSo, handler });
  }

  return {
    get: (p, h) => dangKy('GET', p, h),
    post: (p, h) => dangKy('POST', p, h),
    put: (p, h) => dangKy('PUT', p, h),
    patch: (p, h) => dangKy('PATCH', p, h),
    delete: (p, h) => dangKy('DELETE', p, h),

    danhSach: () => routes.map((r) => `${r.method.padEnd(6)} ${r.path}`),

    /**
     * Tìm route khớp.
     * @returns {{loai:'khop',handler,params,query} | {loai:'sai-method',choPhep} | {loai:'khong-thay'}}
     *
     * Chú ý: hàm này KHÔNG tự gửi response. Nó chỉ TRẢ VỀ kết quả tra cứu
     * để tầng trên quyết định. Nhờ vậy nó là hàm thuần → test được dễ dàng.
     */
    tim(method, url, host) {
      const u = new URL(url, `http://${host}`);
      const methodKhac = [];

      for (const route of routes) {
        const match = route.regex.exec(u.pathname);
        if (!match) continue;

        if (route.method !== method) {
          methodKhac.push(route.method);
          continue;
        }

        const params = {};
        route.tenThamSo.forEach((ten, i) => {
          params[ten] = decodeURIComponent(match[i + 1]);
        });

        return {
          loai: 'khop',
          handler: route.handler,
          params,
          query: Object.fromEntries(u.searchParams),
        };
      }

      // Khớp path nhưng sai method → 405 (kèm header Allow), không phải 404
      if (methodKhac.length > 0) {
        return { loai: 'sai-method', choPhep: methodKhac };
      }
      return { loai: 'khong-thay' };
    },
  };
}
