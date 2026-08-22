# Buổi 0 — Chuẩn bị môi trường (Self-study, ~2 giờ)

Mục tiêu: máy học viên chạy được lệnh `ui5 serve` và mở được một app UI5 trên `localhost:8080` trước buổi 1.

---

## 0.1. Cài đặt bắt buộc

### Node.js (LTS ≥ 20)
```bash
node -v      # >= v20.x
npm -v       # >= 10.x
```
Tải: https://nodejs.org/

### UI5 CLI (UI5 Tooling)
```bash
npm install --global @ui5/cli
ui5 --version
```

### Yeoman + generator SAP Fiori (dùng từ buổi 3 trở đi)
```bash
npm install --global yo @sap/generator-fiori
yo @sap/fiori          # kiểm tra chạy được
```

### Cloud Foundry CLI (dùng ở Module 4)
Windows: `choco install cloudfoundry-cli` hoặc tải MSI từ
https://github.com/cloudfoundry/cli/releases

```bash
cf --version
cf install-plugin multiapps      # để deploy MTA
```

### MBT — Cloud MTA Build Tool
```bash
npm install --global mbt
mbt --version
```

---

## 0.2. IDE

Có 2 lựa chọn, khóa học dùng **cả hai** (JD nhắc tới BAS/Web IDE):

### A. VS Code (dùng chính, offline)
Extension bắt buộc:
| Extension | Publisher | Dùng để |
|---|---|---|
| SAP Fiori tools - Extension Pack | SAP SE | Guided dev, Annotation editor, App preview |
| XML Toolkit | SAP SE | Format XML view |
| ESLint | Microsoft | Code quality (JD: "code quality") |
| Prettier | Prettier | Format |
| REST Client hoặc Thunder Client | — | Gọi thử OData |

Cài nhanh:
```bash
code --install-extension SAPSE.sap-ux-fiori-tools-extension-pack
code --install-extension SAPOSS.xml-toolkit
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
```

### B. SAP Business Application Studio (BAS) — trên cloud
1. Đăng ký **SAP BTP Trial**: https://www.sap.com/products/technology-platform/trial.html
   (chọn region `US East (VA) - AWS` hoặc `Singapore` cho nhanh)
2. Vào BTP Cockpit → Subscriptions → **Business Application Studio** → Subscribe.
3. Gán role collection `Business_Application_Studio_Developer` cho user của bạn.
4. Tạo Dev Space kiểu **SAP Fiori** (bật thêm extension "SAP HANA Tools" nếu học CAP).

> Lưu ý: BTP Trial hết hạn sau 90 ngày nhưng gia hạn được. Dev space tự stop sau 1 giờ idle.

---

## 0.3. Hệ thống backend để thực hành

Khóa học dùng 3 nguồn dữ liệu, không cần cài SAP thật:

### 1. Northwind OData V2 (public, không cần login)
```
https://services.odata.org/V2/Northwind/Northwind.svc/
$metadata:  https://services.odata.org/V2/Northwind/Northwind.svc/$metadata
```
Dùng cho Module 1–2 và Project 1.

### 2. SAP ES5 Gateway Demo System (miễn phí, cần đăng ký)
Đăng ký: https://developers.sap.com/tutorials/gateway-demo-signup.html

Sau khi có user (`P00xxxxxxx`):
```
Base URL: https://sapes5.sapdevcenter.com/sap/opu/odata/
Service:  IWBEP/GWSAMPLE_BASIC/       ← Sales Order, Business Partner, Product
Service:  sap/EPM_REF_APPS_PROD_MAN_SRV/
Gateway UI:  https://sapes5.sapdevcenter.com/sap/bc/ui5_ui5/
```
Dùng cho Module 2–4 và Project 2. **Đây là hệ thống có SAP Gateway thật** → học được `$batch`, CSRF token, ETag, annotation.

### 3. Mock server (offline)
Khi mất mạng / ES5 sập, dùng UI5 Mock Server (dạy ở Buổi 6).

---

## 0.4. Kiểm tra môi trường — "Hello UI5" trong 5 phút

```bash
mkdir hello-ui5 && cd hello-ui5
npm init -y
npm install --save-dev @ui5/cli
npx ui5 init
```

Tạo `webapp/index.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Hello UI5</title>
    <script
        id="sap-ui-bootstrap"
        src="https://sapui5.hana.ondemand.com/resources/sap-ui-core.js"
        data-sap-ui-theme="sap_horizon"
        data-sap-ui-libs="sap.m"
        data-sap-ui-compat-version="edge"
        data-sap-ui-async="true"
        data-sap-ui-on-init="module:sap/ui/core/ComponentSupport">
    </script>
</head>
<body class="sapUiBody">
    <div id="content"></div>
    <script>
        sap.ui.getCore().attachInit(function () {
            new sap.m.Text({ text: "Hello UI5 — môi trường OK!" })
                .placeAt("content");
        });
    </script>
</body>
</html>
```

Cập nhật `ui5.yaml`:
```yaml
specVersion: "3.0"
metadata:
  name: hello-ui5
type: application
framework:
  name: SAPUI5
  version: "1.120.0"
  libraries:
    - name: sap.m
    - name: sap.ui.core
    - name: themelib_sap_horizon
```

Chạy:
```bash
npx ui5 serve --open index.html
```

✅ Thấy dòng chữ "Hello UI5 — môi trường OK!" là xong buổi 0.

---

## 0.5. Bài tập trước buổi 1

1. Mở `$metadata` của Northwind trong trình duyệt, **đếm xem có bao nhiêu EntitySet**, viết ra 5 cái quan trọng nhất.
2. Đăng ký xong ES5, login được vào `https://sapes5.sapdevcenter.com/sap/opu/odata/IWBEP/GWSAMPLE_BASIC/$metadata`.
3. Ôn lại JavaScript: `Promise`, `async/await`, `arrow function`, `destructuring`, `class`, `module`.
   Nếu chưa vững → xem trước phần **Buổi 2**, đây là phần JD nhấn mạnh "Strong knowledge of JavaScript".
