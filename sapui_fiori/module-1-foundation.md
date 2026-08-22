# MODULE 1 — Nền tảng SAPUI5 (Buổi 1 → 5)

> **JD coverage:** "Strong knowledge of JavaScript, XML views, MVC patterns, and SAPUI5 controls"

---

# BUỔI 1 — Kiến trúc SAP Fiori & SAPUI5, Hello World "bằng tay"

## 1.1. Phân biệt các khái niệm (câu hỏi phỏng vấn số 1)

| Khái niệm | Bản chất | Nói gì khi phỏng vấn |
|---|---|---|
| **SAP Fiori** | *Design system / UX strategy* — tập hợp guideline, không phải công nghệ | "Fiori is the UX paradigm; it defines the design language, floorplans and interaction patterns." |
| **SAPUI5** | *JavaScript framework* của SAP để hiện thực hóa Fiori | "SAPUI5 is the framework — MVC, data binding, control library." |
| **OpenUI5** | Bản open-source của SAPUI5 (thiếu vài lib như `sap.suite.*`, charts) | |
| **Fiori Elements** | App sinh tự động từ **annotation** metadata, ít code JS | "Metadata-driven, low-code; use when the floorplan fits standard patterns." |
| **Freestyle UI5** | Tự viết view + controller hoàn toàn | "Full control, used when UX deviates from standard floorplans." |
| **Fiori Launchpad (FLP)** | Shell chứa tile, quản lý role/catalog, single entry point | |
| **SAP Gateway** | Lớp trên ABAP, expose business data ra **OData** | |
| **SAP BTP** | Nền tảng cloud để host app, destination, connectivity | |

### 5 nguyên tắc thiết kế Fiori (phải thuộc lòng)
1. **Role-based** — app phục vụ 1 vai trò cụ thể, không phải 1 module.
2. **Adaptive** — chạy mọi thiết bị, mọi kênh.
3. **Simple** — 1 app = 1 use case, tối đa 3 màn hình.
4. **Coherent** — nhất quán về ngôn ngữ thiết kế (JD: *"Ensure UI consistency"*).
5. **Delightful** — trải nghiệm dễ chịu.

### 3 kiểu app Fiori
| Loại | Đặc điểm | Backend |
|---|---|---|
| Transactional | Tạo/sửa/xóa business object | OData + Gateway (ABAP) |
| Analytical | KPI, drill-down | HANA / CDS Analytical Query |
| Fact Sheet | Xem 360° 1 object + navigation | Search (Enterprise Search) |

## 1.2. Kiến trúc runtime của một app UI5

```
Browser
 └── index.html  (bootstrap sap-ui-core.js)
      └── ComponentContainer
           └── Component.js  (UIComponent)
                ├── manifest.json      ← "app descriptor": models, routing, dataSources, dependencies
                ├── Models (JSON / OData / Resource / Device)
                ├── Router  → Targets → Views
                └── rootView (App.view.xml)
                     └── sap.m.App / sap.f.FlexibleColumnLayout
                          └── Pages (View + Controller)
                               └── Controls  ── binding ──> Model ── HTTP ──> OData Service
                                                                              └── SAP Gateway
                                                                                   └── ABAP / CDS / DB
```

**Nhớ luồng này.** Phỏng vấn hay hỏi: *"What happens when a Fiori app starts?"*

Trả lời chuẩn:
> 1. FLP (or index.html) loads the UI5 bootstrap and the core library.
> 2. `ComponentSupport` instantiates the `Component`.
> 3. `Component.init()` calls `UIComponent.prototype.init`, which reads `manifest.json`.
> 4. Models declared in `sap.ui5/models` are instantiated (OData model metadata load starts here, asynchronously).
> 5. The `rootView` is created, then `initRouter()` runs and the router matches the current hash.
> 6. The matched target's view+controller are created; `onInit` fires; bindings resolve and trigger OData requests.

## 1.3. Bootstrap — giải thích từng attribute

```html
<script id="sap-ui-bootstrap"
    src="resources/sap-ui-core.js"
    data-sap-ui-theme="sap_horizon"
    data-sap-ui-libs="sap.m,sap.ui.core,sap.f"
    data-sap-ui-compat-version="edge"
    data-sap-ui-async="true"
    data-sap-ui-resource-roots='{"com.bd.myapp": "./"}'
    data-sap-ui-frame-options="trusted"
    data-sap-ui-on-init="module:sap/ui/core/ComponentSupport">
</script>
```

| Attribute | Ý nghĩa | Lỗi thường gặp |
|---|---|---|
| `data-sap-ui-async="true"` | Load module bất đồng bộ — **BẮT BUỘC** cho performance | Để `false` → app chậm, SAP báo deprecated |
| `data-sap-ui-libs` | Preload library bundle | Khai thiếu → 404 lẻ tẻ, load chậm |
| `data-sap-ui-resource-roots` | Map namespace → thư mục | Sai → `Component.js` 404 |
| `data-sap-ui-theme` | `sap_horizon` (mới), `sap_fiori_3` (cũ) | Theme cũ bị reject khi review UI consistency |
| `data-sap-ui-compat-version="edge"` | Dùng behavior mới nhất | |

> **Theme hiện hành (2024+):** `sap_horizon`, `sap_horizon_dark`, `sap_horizon_hcb`, `sap_horizon_hcw`.

## 1.4. Lab 1 — App đầu tiên viết tay 100% (không dùng generator)

Cấu trúc:
```
s01-hello-ui5/
├── package.json
├── ui5.yaml
└── webapp/
    ├── index.html
    ├── Component.js
    ├── manifest.json
    ├── view/App.view.xml
    ├── controller/App.controller.js
    └── i18n/i18n.properties
```

**`webapp/index.html`**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BD Hello UI5</title>
    <script id="sap-ui-bootstrap"
        src="resources/sap-ui-core.js"
        data-sap-ui-theme="sap_horizon"
        data-sap-ui-libs="sap.m"
        data-sap-ui-compat-version="edge"
        data-sap-ui-async="true"
        data-sap-ui-resource-roots='{"com.bd.hello": "./"}'
        data-sap-ui-on-init="module:sap/ui/core/ComponentSupport">
    </script>
</head>
<body class="sapUiBody" id="content">
    <div data-sap-ui-component
         data-name="com.bd.hello"
         data-id="container"
         data-settings='{"id": "hello"}'
         data-height="100%">
    </div>
</body>
</html>
```

**`webapp/Component.js`**
```js
sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], function (UIComponent, JSONModel, Device) {
    "use strict";

    return UIComponent.extend("com.bd.hello.Component", {

        metadata: {
            manifest: "json"          // đọc cấu hình từ manifest.json
        },

        init: function () {
            // GỌI CHA TRƯỚC — nếu quên, models/routing trong manifest sẽ không được tạo
            UIComponent.prototype.init.apply(this, arguments);

            // Device model: dùng để làm responsive logic trong view
            this.setModel(new JSONModel(Device), "device");

            // Model dữ liệu cục bộ
            this.setModel(new JSONModel({
                greeting: "Hello",
                recipient: { name: "BD IT Product Team" }
            }));
        }
    });
});
```

**`webapp/manifest.json`**
```json
{
  "_version": "1.60.0",
  "sap.app": {
    "id": "com.bd.hello",
    "type": "application",
    "title": "{{appTitle}}",
    "description": "{{appDescription}}",
    "applicationVersion": { "version": "1.0.0" }
  },
  "sap.ui": {
    "technology": "UI5",
    "deviceTypes": { "desktop": true, "tablet": true, "phone": true }
  },
  "sap.ui5": {
    "rootView": {
      "viewName": "com.bd.hello.view.App",
      "type": "XML",
      "id": "app",
      "async": true
    },
    "dependencies": {
      "minUI5Version": "1.120.0",
      "libs": { "sap.m": {}, "sap.ui.core": {} }
    },
    "models": {
      "i18n": {
        "type": "sap.ui.model.resource.ResourceModel",
        "settings": { "bundleName": "com.bd.hello.i18n.i18n" }
      }
    },
    "contentDensities": { "compact": true, "cozy": true }
  }
}
```

**`webapp/view/App.view.xml`**
```xml
<mvc:View
    controllerName="com.bd.hello.controller.App"
    xmlns="sap.m"
    xmlns:mvc="sap.ui.core.mvc"
    displayBlock="true">

    <App id="app">
        <pages>
            <Page id="page" title="{i18n>appTitle}">
                <content>
                    <VBox class="sapUiMediumMargin">
                        <Text id="greetingText"
                              text="{/greeting}, {/recipient/name}!" />
                        <Input id="nameInput"
                               value="{/recipient/name}"
                               width="300px"
                               placeholder="{i18n>namePlaceholder}" />
                        <Button id="sayHelloBtn"
                                text="{i18n>sayHelloButton}"
                                type="Emphasized"
                                press=".onSayHello"
                                class="sapUiTinyMarginTop" />
                    </VBox>
                </content>
            </Page>
        </pages>
    </App>
</mvc:View>
```

**`webapp/controller/App.controller.js`**
```js
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("com.bd.hello.controller.App", {

        onInit: function () {
            // controller khởi tạo — chưa render ra DOM
        },

        onSayHello: function () {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sName   = this.getView().getModel().getProperty("/recipient/name");
            MessageToast.show(oBundle.getText("helloMsg", [sName]));
        }
    });
});
```

**`webapp/i18n/i18n.properties`**
```properties
appTitle=BD Hello UI5
appDescription=First hand-written UI5 application
namePlaceholder=Enter your name
sayHelloButton=Say Hello
helloMsg=Hello {0}, welcome to SAPUI5!
```

**`ui5.yaml`**
```yaml
specVersion: "3.0"
metadata:
  name: com.bd.hello
type: application
framework:
  name: SAPUI5
  version: "1.120.0"
  libraries:
    - name: sap.m
    - name: sap.ui.core
    - name: themelib_sap_horizon
```

Chạy: `ui5 serve --open index.html`

## 1.5. Bài tập buổi 1
1. Thêm `sap.m.Switch` để đổi theme giữa `sap_horizon` và `sap_horizon_dark` (gợi ý: `sap.ui.core.Theming.setTheme()`).
2. Thêm `ObjectStatus` hiển thị số ký tự của tên, tự đổi màu: <5 ký tự = `Warning`, ngược lại `Success`.
3. Viết ra sơ đồ khởi tạo app (mục 1.2) từ trí nhớ.

---

# BUỔI 2 — JavaScript & ES6+ cho UI5 Developer

> JD: *"Strong knowledge of JavaScript"*. Đây là buổi phân biệt junior với senior. **Không được bỏ qua.**

## 2.1. AMD & `sap.ui.define` — hệ thống module của UI5

UI5 dùng **AMD (Asynchronous Module Definition)**, không phải ES modules (trừ khi dùng TypeScript build).

```js
sap.ui.define([
    "sap/ui/core/mvc/Controller",   // → tham số thứ 1
    "sap/ui/model/json/JSONModel",  // → tham số thứ 2
    "sap/m/MessageBox"              // → tham số thứ 3
], function (Controller, JSONModel, MessageBox) {
    "use strict";
    return Controller.extend("...", { /* ... */ });
});
```

**Quy tắc sống còn:** *thứ tự dependency phải khớp thứ tự tham số*. Thêm/xóa 1 dependency mà quên sửa tham số → lỗi `undefined is not a constructor`, rất khó nhìn ra.

### `sap.ui.require` — load động (runtime)
```js
// Dùng khi chỉ cần module trong 1 nhánh code hiếm gặp → giảm bundle size
onOpenRareDialog: function () {
    sap.ui.require(["sap/m/MessageBox"], function (MessageBox) {
        MessageBox.warning("Loaded on demand");
    });
}
```

### ❌ Cấm dùng (deprecated, sẽ bị reject khi code review)
```js
jQuery.sap.require("sap.m.MessageBox");   // sync load — chặn UI thread
sap.ui.getCore().byId("...")              // ưu tiên this.byId()
new sap.m.Button()                        // global access — dùng sap.ui.define
```

## 2.2. `this` — nguồn gốc 50% bug của junior

```js
onInit: function () {
    var that = this;                       // cách cũ

    // ❌ SAI: this bên trong function thường không phải controller
    this.getView().getModel().attachRequestCompleted(function () {
        this.byId("table").setBusy(false); // this = model, không phải controller!
    });

    // ✅ Cách 1: arrow function (giữ this từ scope ngoài)
    this.getView().getModel().attachRequestCompleted(() => {
        this.byId("table").setBusy(false);
    });

    // ✅ Cách 2: bind
    this.getView().getModel().attachRequestCompleted(this._onLoaded.bind(this));

    // ✅ Cách 3: closure variable
    this.getView().getModel().attachRequestCompleted(function () {
        that.byId("table").setBusy(false);
    });
}
```

> UI5 1.120 hỗ trợ đầy đủ ES6+ trên mọi browser được support. Dùng arrow function thoải mái — **trừ khi** phải support IE11 (hệ thống on-premise cũ) thì phải transpile bằng `ui5-tooling-transpile`.

## 2.3. Promise & async/await — xương sống của mọi thao tác OData

```js
// Promise hóa OData read — pattern chuẩn dùng lại toàn khóa
_read: function (sPath, mParameters) {
    return new Promise((resolve, reject) => {
        this.getView().getModel().read(sPath, Object.assign({}, mParameters, {
            success: resolve,
            error:   reject
        }));
    });
},

onLoadData: async function () {
    const oView = this.getView();
    oView.setBusy(true);
    try {
        const oData = await this._read("/Products", {
            urlParameters: { "$top": 20, "$expand": "Category" }
        });
        oView.getModel("view").setProperty("/products", oData.results);
    } catch (oError) {
        // oError.responseText chứa payload lỗi từ Gateway
        this._handleODataError(oError);
    } finally {
        oView.setBusy(false);
    }
}
```

### Chạy song song — tối ưu hiệu năng (JD: "performance tuning")
```js
// ❌ Tuần tự: 3 request × 300ms = 900ms
const a = await this._read("/Products");
const b = await this._read("/Categories");
const c = await this._read("/Suppliers");

// ✅ Song song: ~300ms
const [a, b, c] = await Promise.all([
    this._read("/Products"),
    this._read("/Categories"),
    this._read("/Suppliers")
]);

// ✅ Không muốn 1 lỗi làm hỏng tất cả:
const aResults = await Promise.allSettled([...]);
```

## 2.4. ES6+ syntax dùng hằng ngày trong UI5

```js
// Destructuring — rất hay dùng với event
onSelectionChange: function (oEvent) {
    const { listItem } = oEvent.getParameters();
    const { ProductID, ProductName } = listItem.getBindingContext().getObject();
}

// Spread — clone object trước khi sửa (tránh mutate model trực tiếp)
const oDraft = { ...oOriginal, Quantity: 10 };

// Template literal — build path
const sPath = `/Products(${iId})/Supplier`;

// Optional chaining & nullish coalescing (UI5 1.116+ OK)
const sCity = oData?.Supplier?.City ?? "N/A";

// Array methods thay vì for-loop
const aActive = aItems
    .filter(o => o.Status === "A")
    .map(o => ({ id: o.ID, label: `${o.Name} (${o.Code})` }))
    .sort((a, b) => a.label.localeCompare(b.label));

const iTotal = aItems.reduce((sum, o) => sum + o.Amount, 0);

// Class + static (dùng cho utility)
class Formatter {
    static currency(fValue, sCode) {
        if (fValue === undefined || fValue === null) { return ""; }
        return new Intl.NumberFormat("en-US", {
            style: "currency", currency: sCode || "USD"
        }).format(fValue);
    }
}
```

## 2.5. Debounce / throttle — bắt buộc cho live search
```js
// utils/debounce.js
sap.ui.define([], function () {
    "use strict";
    return function debounce(fn, iWait) {
        let iTimer;
        return function (...args) {
            clearTimeout(iTimer);
            iTimer = setTimeout(() => fn.apply(this, args), iWait);
        };
    };
});
```
```js
onInit: function () {
    // 1 request sau khi user ngừng gõ 400ms — thay vì 1 request/ký tự
    this.onLiveSearch = debounce(this._doSearch.bind(this), 400);
}
```

## 2.6. Lab 2 — Viết `ODataHelper` tái sử dụng

Tạo `webapp/utils/ODataHelper.js` bọc `read / create / update / remove` thành Promise + xử lý lỗi thống nhất.

```js
sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox"
], function (BaseObject, MessageBox) {
    "use strict";

    return BaseObject.extend("com.bd.utils.ODataHelper", {

        constructor: function (oModel) {
            this._oModel = oModel;
        },

        read: function (sPath, mParams) {
            return new Promise((resolve, reject) => {
                this._oModel.read(sPath, { ...mParams, success: resolve, error: reject });
            });
        },

        create: function (sPath, oPayload, mParams) {
            return new Promise((resolve, reject) => {
                this._oModel.create(sPath, oPayload, { ...mParams, success: resolve, error: reject });
            });
        },

        update: function (sPath, oPayload, mParams) {
            return new Promise((resolve, reject) => {
                this._oModel.update(sPath, oPayload, { ...mParams, success: resolve, error: reject });
            });
        },

        remove: function (sPath, mParams) {
            return new Promise((resolve, reject) => {
                this._oModel.remove(sPath, { ...mParams, success: resolve, error: reject });
            });
        },

        /**
         * Parse Gateway error payload → human readable message.
         * Gateway trả lỗi ở nhiều format khác nhau tùy version → phải cover hết.
         */
        parseError: function (oError) {
            let sMessage = oError.message || "Unknown error";
            try {
                const oBody = JSON.parse(oError.responseText);
                const oErr  = oBody.error;
                sMessage = oErr.message.value || oErr.message;
                // Gateway gom nhiều message con vào innererror
                const aDetails = oErr.innererror?.errordetails || [];
                if (aDetails.length) {
                    sMessage += "\n\n" + aDetails.map(d => `• ${d.message}`).join("\n");
                }
            } catch (e) {
                // responseText có thể là XML (Atom) hoặc HTML (dump ABAP)
                const oMatch = /<message[^>]*>([^<]+)<\/message>/.exec(oError.responseText || "");
                if (oMatch) { sMessage = oMatch[1]; }
            }
            return sMessage;
        },

        showError: function (oError) {
            MessageBox.error(this.parseError(oError));
        }
    });
});
```

## 2.7. Bài tập buổi 2
1. Viết hàm `retry(fnPromise, iTimes, iDelay)` — thử lại request khi lỗi mạng.
2. So sánh output của 3 đoạn code dùng `var` / `let` trong vòng lặp `setTimeout`.
3. Refactor Lab 1 sang dùng arrow function + async/await.

---

# BUỔI 3 — MVC, XML Views, Controller Lifecycle

## 3.1. MVC trong UI5

```
     ┌──────────────┐        binding        ┌──────────────┐
     │     View     │ <───────────────────> │    Model     │
     │  (.view.xml) │                       │ JSON/OData/  │
     └──────┬───────┘                       │ Resource     │
            │ events                        └──────────────┘
            ▼
     ┌──────────────┐
     │  Controller  │  ── điều phối, gọi service, xử lý logic
     │   (.js)      │
     └──────────────┘
```

**Nguyên tắc senior:**
- View **không chứa logic nghiệp vụ** — chỉ binding và khai báo control.
- Controller **không thao tác DOM trực tiếp** — thao tác qua control API.
- Logic tái sử dụng → tách ra `BaseController` / `utils` / `services`, không copy-paste giữa các controller.

## 3.2. 4 loại View (chỉ nên dùng XML)

| Loại | Khi nào dùng |
|---|---|
| **XML View** | ✅ Mặc định, chuẩn SAP, tooling hỗ trợ tốt nhất |
| JS View | ❌ Deprecated từ 1.108 |
| JSON View | ❌ Deprecated |
| HTML View | ❌ Deprecated |
| **Typed View** (JS/TS class) | Dùng khi làm TypeScript (Buổi 15) |

## 3.3. Anatomy của XML View

```xml
<mvc:View
    controllerName="com.bd.app.controller.Worklist"
    xmlns="sap.m"                          <!-- default namespace -->
    xmlns:mvc="sap.ui.core.mvc"
    xmlns:f="sap.f"
    xmlns:core="sap.ui.core"
    xmlns:l="sap.ui.layout"
    xmlns:form="sap.ui.layout.form"
    xmlns:t="sap.ui.table"
    displayBlock="true"
    height="100%">

    <Page id="worklistPage" title="{i18n>worklistTitle}" showNavButton="false">
        <headerContent>
            <Button icon="sap-icon://refresh" press=".onRefresh"/>
        </headerContent>
        <subHeader>
            <Toolbar>
                <SearchField width="100%" search=".onSearch"/>
            </Toolbar>
        </subHeader>
        <content>
            <!-- nội dung chính -->
        </content>
        <footer>
            <OverflowToolbar>
                <ToolbarSpacer/>
                <Button text="{i18n>save}" type="Emphasized" press=".onSave"/>
                <Button text="{i18n>cancel}" press=".onCancel"/>
            </OverflowToolbar>
        </footer>
    </Page>
</mvc:View>
```

**Lưu ý cú pháp:**
- `press=".onSave"` — dấu chấm đầu = gọi method trong controller (cách chuẩn, an toàn).
- `press="onSave"` — không có chấm = tìm global function (nguy hiểm, cấm dùng).
- Aggregation mặc định có thể bỏ tag: `<Page><Text/></Page>` ≡ `<Page><content><Text/></content></Page>`.

## 3.4. Controller Lifecycle — 4 hook (câu hỏi phỏng vấn kinh điển)

```js
sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
    "use strict";
    return Controller.extend("com.bd.app.controller.Worklist", {

        /**
         * 1. onInit — chạy MỘT LẦN sau khi view được khởi tạo, TRƯỚC khi render.
         *    Dùng để: tạo model cục bộ, attach route matched, khởi tạo biến.
         *    KHÔNG dùng để: đọc kích thước DOM (chưa có DOM).
         */
        onInit: function () {
            this.getView().setModel(new JSONModel({ busy: false, count: 0 }), "view");
            this.getOwnerComponent().getRouter()
                .getRoute("worklist").attachPatternMatched(this._onRouteMatched, this);
        },

        /**
         * 2. onBeforeRendering — chạy MỖI LẦN trước khi render (kể cả re-render).
         *    Dùng để: detach event handler của DOM cũ, chuẩn bị dữ liệu hiển thị.
         */
        onBeforeRendering: function () {},

        /**
         * 3. onAfterRendering — chạy MỖI LẦN sau khi DOM đã có.
         *    Dùng để: tích hợp thư viện bên thứ 3 (chart, map), đo kích thước, focus.
         *    CẢNH BÁO: chạy nhiều lần → phải guard, tránh attach trùng listener.
         */
        onAfterRendering: function () {
            if (!this._bChartRendered) {
                this._renderThirdPartyChart();
                this._bChartRendered = true;
            }
        },

        /**
         * 4. onExit — chạy khi view bị destroy.
         *    Dùng để: destroy fragment/dialog tạo bằng tay, detach event bus,
         *             clearInterval — nếu quên sẽ MEMORY LEAK.
         */
        onExit: function () {
            if (this._oDialog) { this._oDialog.destroy(); this._oDialog = null; }
            if (this._iTimer)  { clearInterval(this._iTimer); }
        }
    });
});
```

### Thứ tự thực tế khi mở app
```
Component.init()
  → manifest models created
  → rootView created
  → Router.initialize()
  → Target view created → Controller.onInit()
  → routePatternMatched  → bind data
  → onBeforeRendering()
  → DOM rendered
  → onAfterRendering()
```

## 3.5. BaseController — pattern bắt buộc trong dự án thật

Mọi controller trong dự án phải kế thừa `BaseController`, không kế thừa `Controller` trực tiếp.

**`webapp/controller/BaseController.js`**
```js
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, UIComponent, History, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("com.bd.app.controller.BaseController", {

        /* ---------- Shortcuts ---------- */
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        setModel: function (oModel, sName) {
            this.getView().setModel(oModel, sName);
            return this;
        },

        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        getText: function (sKey, aArgs) {
            return this.getResourceBundle().getText(sKey, aArgs);
        },

        /* ---------- Navigation ---------- */
        navTo: function (sRoute, oParams, bReplace) {
            this.getRouter().navTo(sRoute, oParams, bReplace);
        },

        onNavBack: function () {
            const sPrevHash = History.getInstance().getPreviousHash();
            if (sPrevHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        /* ---------- UX helpers ---------- */
        toast: function (sKey, aArgs) {
            MessageToast.show(this.getText(sKey, aArgs));
        },

        confirm: function (sKey) {
            return new Promise((resolve) => {
                MessageBox.confirm(this.getText(sKey), {
                    onClose: (sAction) => resolve(sAction === MessageBox.Action.OK)
                });
            });
        },

        /* ---------- Fragment cache (tránh tạo lại dialog nhiều lần) ---------- */
        loadFragment: function (sName) {
            this._mFragments = this._mFragments || {};
            if (!this._mFragments[sName]) {
                this._mFragments[sName] = this.loadFragmentBase({ name: sName });
            }
            return this._mFragments[sName];
        },

        loadFragmentBase: function (mOptions) {
            // dùng API Controller.loadFragment (1.93+): tự add dependent + owner component
            return Controller.prototype.loadFragment.call(this, mOptions);
        },

        onExit: function () {
            // destroy các fragment đã cache
            Object.values(this._mFragments || {}).forEach(p =>
                p.then && p.then(o => o.destroy && o.destroy()));
        }
    });
});
```

Dùng:
```js
sap.ui.define(["./BaseController"], function (BaseController) {
    "use strict";
    return BaseController.extend("com.bd.app.controller.Worklist", {
        onInit: function () {
            this.toast("appLoaded");
        }
    });
});
```

## 3.6. Bài tập buổi 3
1. Tạo app 2 view (`Worklist`, `Detail`) dùng `BaseController`, nút back hoạt động đúng.
2. Log ra console 4 lifecycle hook, thao tác để `onAfterRendering` chạy 3 lần, giải thích tại sao.
3. Giải thích sự khác biệt `this.byId()` và `sap.ui.getCore().byId()` (gợi ý: view prefix ID).

---

# BUỔI 4 — SAPUI5 Controls Library

> JD: *"Strong knowledge of ... SAPUI5 controls"*. Buổi này là buổi "cày" — biết control nào dùng lúc nào.

## 4.1. Bản đồ thư viện

| Library | Nội dung | Khi nào dùng |
|---|---|---|
| `sap.m` | Control chính, responsive | 90% trường hợp |
| `sap.ui.core` | Icon, HTML, Fragment, custom data | |
| `sap.f` | FlexibleColumnLayout, DynamicPage, Card, GridList | App master-detail hiện đại |
| `sap.ui.layout` | Grid, Form, Splitter, VerticalLayout | Layout phức tạp |
| `sap.ui.table` | `Table`, `TreeTable`, `AnalyticalTable` — desktop only, scroll ảo | Bảng > 1000 dòng, desktop |
| `sap.uxap` | ObjectPageLayout | Trang chi tiết chuẩn Fiori |
| `sap.suite.ui.commons` | ProcessFlow, Timeline, NetworkGraph | Chỉ có ở SAPUI5 (không có OpenUI5) |
| `sap.viz` / `sap.chart` | Biểu đồ | Analytical app |
| `sap.ui.comp` | SmartTable, SmartFilterBar, SmartField | App metadata-driven |

## 4.2. Chọn Table — quyết định kiến trúc quan trọng

| Control | Rows | Responsive | Virtual scroll | Ghi chú |
|---|---|---|---|---|
| `sap.m.List` | < 200 | ✅ | ❌ | List đơn giản |
| `sap.m.Table` (Responsive Table) | < 1000 | ✅ | ❌ (dùng growing) | **Mặc định của Fiori** |
| `sap.ui.table.Table` (Grid Table) | > 1000 | ❌ desktop | ✅ | Nhiều cột, freeze column |
| `sap.ui.table.TreeTable` | phân cấp | ❌ | ✅ | BOM, org structure |
| `sap.ui.table.AnalyticalTable` | aggregation | ❌ | ✅ | Cần OData analytical annotation |
| `sap.ui.comp.smarttable.SmartTable` | tùy | ✅/❌ | tùy | Tự sinh cột từ metadata |

**Câu trả lời phỏng vấn:**
> "I default to the responsive `sap.m.Table` with `growing` and `growingThreshold`, because Fiori guidelines require responsiveness. I switch to `sap.ui.table.Table` only when the dataset is large and the app is desktop-only, since it virtualizes rows."

## 4.3. Lab 4 — Catalog dùng bộ control chuẩn

**`view/Catalog.view.xml`**
```xml
<mvc:View controllerName="com.bd.catalog.controller.Catalog"
    xmlns="sap.m"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns:f="sap.f"
    xmlns:core="sap.ui.core"
    xmlns:l="sap.ui.layout">

    <f:DynamicPage id="page" headerExpanded="true" toggleHeaderOnTitleClick="true">

        <f:title>
            <f:DynamicPageTitle>
                <f:heading>
                    <Title text="{i18n>catalogTitle}"/>
                </f:heading>
                <f:expandedContent>
                    <Label text="{view>/count} products"/>
                </f:expandedContent>
                <f:actions>
                    <Button text="{i18n>create}" type="Emphasized" icon="sap-icon://add" press=".onCreate"/>
                    <Button icon="sap-icon://action-settings" press=".onOpenSettings"/>
                </f:actions>
            </f:DynamicPageTitle>
        </f:title>

        <f:header>
            <f:DynamicPageHeader pinnable="true">
                <l:HorizontalLayout allowWrapping="true">
                    <SearchField id="search" width="20rem" liveChange=".onLiveSearch"
                                 placeholder="{i18n>searchPlaceholder}"/>
                    <ComboBox id="categoryFilter" width="15rem"
                              items="{ path: '/Categories', sorter: { path: 'CategoryName' } }"
                              selectionChange=".onFilterChange"
                              placeholder="{i18n>allCategories}">
                        <core:Item key="{CategoryID}" text="{CategoryName}"/>
                    </ComboBox>
                    <SegmentedButton id="viewMode" selectedKey="table" selectionChange=".onViewModeChange">
                        <items>
                            <SegmentedButtonItem key="table" icon="sap-icon://table-view"/>
                            <SegmentedButtonItem key="grid"  icon="sap-icon://grid"/>
                        </items>
                    </SegmentedButton>
                </l:HorizontalLayout>
            </f:DynamicPageHeader>
        </f:header>

        <f:content>
            <Table id="productTable"
                   items="{
                       path: '/Products',
                       parameters: { expand: 'Category,Supplier' },
                       sorter: { path: 'ProductName' }
                   }"
                   mode="MultiSelect"
                   growing="true"
                   growingThreshold="20"
                   growingScrollToLoad="true"
                   sticky="ColumnHeaders,HeaderToolbar"
                   busyIndicatorDelay="0"
                   selectionChange=".onSelectionChange">

                <headerToolbar>
                    <OverflowToolbar>
                        <Title text="{i18n>products} ({= ${view>/count}})" level="H2"/>
                        <ToolbarSpacer/>
                        <Button text="{i18n>deleteSelected}" type="Reject"
                                enabled="{= ${view>/selectedCount} > 0 }"
                                press=".onDeleteSelected"/>
                        <Button icon="sap-icon://excel-attachment" tooltip="{i18n>export}" press=".onExport"/>
                        <Button icon="sap-icon://sort" press=".onOpenSortDialog"/>
                        <Button icon="sap-icon://filter" press=".onOpenFilterDialog"/>
                    </OverflowToolbar>
                </headerToolbar>

                <columns>
                    <Column width="6rem"><Text text="{i18n>colId}"/></Column>
                    <Column minScreenWidth="Tablet" demandPopin="true">
                        <Text text="{i18n>colName}"/>
                    </Column>
                    <Column minScreenWidth="Tablet" demandPopin="true" popinDisplay="Inline">
                        <Text text="{i18n>colCategory}"/>
                    </Column>
                    <Column hAlign="End" minScreenWidth="Desktop" demandPopin="true">
                        <Text text="{i18n>colPrice}"/>
                    </Column>
                    <Column hAlign="Center"><Text text="{i18n>colStatus}"/></Column>
                </columns>

                <items>
                    <ColumnListItem type="Navigation" press=".onItemPress">
                        <cells>
                            <ObjectIdentifier title="{ProductID}"/>
                            <ObjectIdentifier title="{ProductName}" text="{Supplier/CompanyName}"/>
                            <Text text="{Category/CategoryName}"/>
                            <ObjectNumber
                                number="{
                                    path: 'UnitPrice',
                                    type: 'sap.ui.model.type.Currency',
                                    formatOptions: { showMeasure: false }
                                }"
                                unit="USD"/>
                            <ObjectStatus
                                text="{= ${UnitsInStock} > 0 ? ${i18n>inStock} : ${i18n>outOfStock} }"
                                state="{= ${UnitsInStock} > 20 ? 'Success' : (${UnitsInStock} > 0 ? 'Warning' : 'Error') }"
                                icon="{= ${UnitsInStock} > 0 ? 'sap-icon://accept' : 'sap-icon://decline' }"/>
                        </cells>
                    </ColumnListItem>
                </items>

                <noData>
                    <IllustratedMessage
                        illustrationType="sapIllus-NoSearchResults"
                        title="{i18n>noDataTitle}"
                        description="{i18n>noDataDesc}"/>
                </noData>
            </Table>
        </f:content>
    </f:DynamicPage>
</mvc:View>
```

**Điểm quan trọng cần giải thích cho học viên:**
- `demandPopin` + `minScreenWidth`: cột tự gộp xuống dòng khi màn hình nhỏ → **responsive design** (JD nice-to-have).
- `growing` + `growingScrollToLoad`: chỉ load 20 dòng đầu → **performance**.
- `sticky`: header dính khi scroll → UX.
- `IllustratedMessage`: chuẩn Fiori cho trạng thái rỗng, thay cho text trơn.
- Expression binding `{= ... }` trong `state`: tránh phải viết formatter cho logic đơn giản.

## 4.4. Bảng tra control theo tình huống

| Cần gì | Dùng control |
|---|---|
| Nhập text | `Input`, `TextArea`, `MaskInput` |
| Chọn 1 từ danh sách ngắn | `Select` |
| Chọn 1 + gõ tìm | `ComboBox` |
| Chọn nhiều | `MultiComboBox` |
| Chọn từ danh sách lớn + filter phức tạp | `Input` + `ValueHelpDialog` (F4) |
| Nhập nhiều token | `MultiInput` |
| Ngày | `DatePicker`, `DateRangeSelection`, `DateTimePicker` |
| Số tiền | `Input` + type `sap.ui.model.type.Currency` |
| Hiển thị KPI | `NumericContent`, `GenericTile` |
| Trạng thái | `ObjectStatus` (có màu), `ObjectMarker` |
| Ảnh/avatar | `Avatar` (thay cho `Image` deprecated trong context này) |
| Thông báo tạm | `MessageToast` |
| Thông báo cần xác nhận | `MessageBox` |
| Danh sách lỗi validation | `MessagePopover` + `sap.ui.core.message.MessageManager` |
| Trang chi tiết | `sap.uxap.ObjectPageLayout` |
| Master-detail 3 cột | `sap.f.FlexibleColumnLayout` |
| Wizard nhiều bước | `sap.m.Wizard` |
| Upload file | `sap.m.upload.UploadSet` |

## 4.5. Bài tập buổi 4
1. Thêm `ViewSettingsDialog` cho sort/filter/group.
2. Chuyển bảng sang `sap.f.GridList` khi bấm nút "grid".
3. Thêm `MessageStrip` cảnh báo khi có sản phẩm `Discontinued = true`.

---

# BUỔI 5 — Data Binding toàn tập

> Đây là **linh hồn của UI5**. Nắm chắc buổi này là qua được 70% câu hỏi kỹ thuật khi phỏng vấn.

## 5.1. Bốn loại binding

| Loại | Cú pháp | Ví dụ |
|---|---|---|
| **Property Binding** | `{path}` | `<Text text="{ProductName}"/>` |
| **Aggregation Binding** | `items="{/Products}"` | list binding |
| **Element (Context) Binding** | `binding="{/Products(1)}"` | gán context cho cả 1 nhánh view |
| **Expression Binding** | `{= expression }` | `{= ${Price} > 100 ? 'Error' : 'Success' }` |

## 5.2. Binding mode

```js
sap.ui.model.BindingMode.OneWay    // Model → View  (mặc định của ODataModel)
sap.ui.model.BindingMode.TwoWay    // Model ↔ View  (mặc định của JSONModel)
sap.ui.model.BindingMode.OneTime   // đọc 1 lần
```

```js
// Set mặc định cho cả model
oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
```
```xml
<!-- Ép mode cho 1 binding -->
<Input value="{ path: 'Name', mode: 'OneWay' }"/>
```

> **Bẫy phỏng vấn:** *"Why doesn't my OData input save the value?"*
> → Vì `ODataModel` V2 mặc định `TwoWay` **nhưng** chỉ ghi vào pending changes; cần `submitChanges()`. Còn nếu model bị set `OneWay` thì user gõ mà model không đổi.

## 5.3. Absolute vs Relative path — nguồn lỗi lớn nhất

```xml
<!-- ABSOLUTE: bắt đầu bằng / — luôn trỏ vào root của model -->
<Text text="{/Products/0/ProductName}"/>

<!-- RELATIVE: không có / — phụ thuộc binding context của control cha -->
<List items="{/Products}">
    <StandardListItem title="{ProductName}"/>   <!-- relative → mỗi item 1 context -->
</List>

<!-- Element binding tạo context cho cả VBox -->
<VBox binding="{/Products(1)}">
    <Text text="{ProductName}"/>
    <Text text="{Category/CategoryName}"/>       <!-- navigate qua association -->
</VBox>
```

Debug context trong controller:
```js
const oCtx = oEvent.getSource().getBindingContext();       // model mặc định
const oCtxNamed = oEvent.getSource().getBindingContext("view"); // model có tên
console.log(oCtx.getPath());        // "/Products(1)"
console.log(oCtx.getObject());      // { ProductID: 1, ProductName: "Chai", ... }
console.log(oCtx.getProperty("ProductName"));
```

## 5.4. Named model

```js
this.setModel(oJson, "view");     // → binding: {view>/busy}
this.setModel(oOData, );          // model mặc định → binding: {/Products}
```
```xml
<Text text="{i18n>title}"/>            <!-- resource model -->
<Table visible="{device>/system/desktop}"/>  <!-- device model -->
<Text text="{view>/selectedCount}"/>
```

## 5.5. Formatter — khi expression binding không đủ

**`webapp/model/formatter.js`**
```js
sap.ui.define([
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/format/NumberFormat",
    "sap/ui/core/library"
], function (DateFormat, NumberFormat, coreLibrary) {
    "use strict";

    const ValueState = coreLibrary.ValueState;

    return {

        /**
         * Map stock level to a semantic state.
         * @param {number} iStock units in stock
         * @returns {sap.ui.core.ValueState}
         */
        stockState: function (iStock) {
            if (iStock === undefined || iStock === null) { return ValueState.None; }
            if (iStock <= 0)  { return ValueState.Error; }
            if (iStock < 20)  { return ValueState.Warning; }
            return ValueState.Success;
        },

        /**
         * Format a currency amount with the user's locale.
         */
        currency: function (fValue, sCurrency) {
            if (fValue == null) { return ""; }
            const oFmt = NumberFormat.getCurrencyInstance({ showMeasure: true });
            return oFmt.format(parseFloat(fValue), sCurrency || "USD");
        },

        /**
         * OData V2 Edm.DateTime → "15 Aug 2026"
         */
        mediumDate: function (oDate) {
            if (!oDate) { return ""; }
            return DateFormat.getDateInstance({ style: "medium" }).format(
                oDate instanceof Date ? oDate : new Date(oDate)
            );
        },

        /**
         * Multi-value formatter — nhận nhiều path.
         */
        fullName: function (sFirst, sLast, sTitle) {
            return [sTitle, sFirst, sLast].filter(Boolean).join(" ");
        }
    };
});
```

Khai báo trong controller:
```js
sap.ui.define(["./BaseController", "../model/formatter"], function (BaseController, formatter) {
    "use strict";
    return BaseController.extend("com.bd.app.controller.Catalog", {
        formatter: formatter,      // ← BẮT BUỘC để view gọi được
        onInit: function () {}
    });
});
```

Dùng trong view:
```xml
<!-- 1 tham số -->
<ObjectStatus state="{ path: 'UnitsInStock', formatter: '.formatter.stockState' }"
              text="{UnitsInStock}"/>

<!-- Nhiều tham số: dùng parts -->
<Text text="{
    parts: [ 'UnitPrice', 'Currency' ],
    formatter: '.formatter.currency'
}"/>

<Text text="{
    parts: [ 'FirstName', 'LastName', 'Title' ],
    formatter: '.formatter.fullName'
}"/>
```

## 5.6. Expression Binding — cú pháp đầy đủ

```xml
<!-- Toán tử: + - * / % === !== < > <= >= && || ! ?: -->
<Text text="{= ${Price} * ${Quantity} }"/>
<Button visible="{= ${view>/mode} === 'edit' &amp;&amp; ${view>/hasAuth} }"/>
<Text text="{= ${Stock} > 0 ? ${i18n>inStock} : ${i18n>outOfStock} }"/>

<!-- Gọi global function -->
<Text text="{= encodeURIComponent(${Name}) }"/>
<Text text="{= Math.round(${Amount}) }"/>

<!-- % là modulo, phải escape trong XML: &amp;&amp; cho &&, &lt; cho < -->
<Text text="{= ${Index} % 2 === 0 ? 'even' : 'odd' }"/>

<!-- odata.fillUriTemplate, odata.compare (dùng nhiều ở Fiori Elements annotations) -->
```

> **Khi nào dùng expression, khi nào dùng formatter?**
> Expression: logic 1 dòng, không tái sử dụng. Formatter: logic > 1 dòng, tái sử dụng, hoặc cần unit test (JD: "unit testing").

## 5.7. Type & Validation — nền tảng của form

```xml
<Input value="{
    path: 'UnitPrice',
    type: 'sap.ui.model.type.Float',
    constraints: { minimum: 0, maximum: 100000 },
    formatOptions: { minFractionDigits: 2, maxFractionDigits: 2 }
}"/>

<Input value="{
    path: 'Email',
    type: 'sap.ui.model.type.String',
    constraints: { search: '^[\\w.-]+@[\\w.-]+\\.\\w{2,}$' }
}"/>

<DatePicker value="{
    path: 'DeliveryDate',
    type: 'sap.ui.model.type.Date',
    formatOptions: { style: 'medium' },
    constraints: { minimum: '2020-01-01' }
}"/>
```

Bật hiển thị lỗi tự động (UI5 1.118+ dùng `Messaging`):
```js
sap.ui.define([
    "./BaseController",
    "sap/ui/core/Messaging"
], function (BaseController, Messaging) {
    "use strict";
    return BaseController.extend("com.bd.app.controller.Detail", {
        onInit: function () {
            // gắn message model để control tự tô đỏ khi type validation fail
            this.setModel(Messaging.getMessageModel(), "message");
            Messaging.registerObject(this.getView(), true);
        },

        onSave: function () {
            const aMessages = Messaging.getMessageModel().getData();
            if (aMessages.some(m => m.type === "Error")) {
                this.toast("fixValidationErrors");
                return;
            }
            // ... submit
        }
    });
});
```
> Trên UI5 < 1.118 dùng `sap.ui.getCore().getMessageManager()` — API cũ nhưng vẫn gặp nhiều trong dự án legacy.

## 5.8. Sorter, Filter, Grouping trong controller

```js
sap.ui.define([
    "./BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter"
], function (BaseController, Filter, FilterOperator, Sorter) {
    "use strict";

    return BaseController.extend("com.bd.app.controller.Catalog", {

        onSearch: function (oEvent) {
            const sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
            const aFilters = [];

            if (sQuery) {
                // OR giữa 2 field
                aFilters.push(new Filter({
                    filters: [
                        new Filter("ProductName", FilterOperator.Contains, sQuery),
                        new Filter("Supplier/CompanyName", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }

            const sCat = this.byId("categoryFilter").getSelectedKey();
            if (sCat) {
                aFilters.push(new Filter("CategoryID", FilterOperator.EQ, parseInt(sCat, 10)));
            }

            // FilterType.Application vs Control:
            //  - Application: filter "nền" (từ FilterBar) — không bị ghi đè bởi control
            //  - Control:     filter của control (sort/filter dialog trên bảng)
            this.byId("productTable").getBinding("items")
                .filter(aFilters, sap.ui.model.FilterType.Application);
        },

        onSort: function (sPath, bDescending) {
            this.byId("productTable").getBinding("items")
                .sort(new Sorter(sPath, bDescending));
        },

        onGroup: function () {
            this.byId("productTable").getBinding("items").sort(
                new Sorter("Category/CategoryName", false, true)   // tham số 3 = group
            );
        },

        /** Cập nhật counter khi binding thay đổi */
        onInit: function () {
            const oBinding = this.byId("productTable").getBinding("items");
            // dataReceived: OData đã trả về; change: binding thay đổi (kể cả client-side)
            oBinding.attachChange(() => {
                this.getModel("view").setProperty("/count", oBinding.getLength());
            });
        }
    });
});
```

### Bảng FilterOperator
| Operator | OData `$filter` sinh ra |
|---|---|
| `EQ` `NE` `GT` `GE` `LT` `LE` | `eq ne gt ge lt le` |
| `BT` | `(x ge a and x le b)` |
| `Contains` | `substringof('x', Field)` (V2) / `contains(Field,'x')` (V4) |
| `StartsWith` | `startswith(Field,'x')` |
| `EndsWith` | `endswith(Field,'x')` |
| `NotContains`, `NotStartsWith` … | phủ định tương ứng |

## 5.9. PROJECT 1 — Product Catalog (nộp sau buổi 5)

**Yêu cầu nghiệp vụ (viết như 1 user story thật):**
> *As a product manager, I want to browse the product catalog, filter by category and stock status, and see product details, so that I can decide on replenishment.*

**Acceptance criteria:**
1. Danh sách sản phẩm từ Northwind OData V2, load 20 dòng/lần, scroll để load thêm.
2. Search theo tên sản phẩm và tên nhà cung cấp (server-side filter, có debounce 400ms).
3. Filter theo Category (dropdown) và Stock status (Available / Low / Out).
4. Sort theo Name / Price / Stock, có dialog `ViewSettingsDialog`.
5. Click 1 dòng → mở Detail (dùng element binding), hiển thị Supplier + Category (`$expand`).
6. Hiển thị `ObjectStatus` màu theo tồn kho, giá format theo currency.
7. Responsive: trên phone bảng phải popin đúng.
8. Có i18n đầy đủ (EN + VI), không hardcode chuỗi trong view.
9. Có `noData` bằng `IllustratedMessage`.
10. Busy indicator khi loading.

**Cấu trúc bàn giao:**
```
s05-project1-product-catalog/
├── ui5.yaml
├── package.json
└── webapp/
    ├── Component.js
    ├── manifest.json
    ├── index.html
    ├── controller/
    │   ├── BaseController.js
    │   ├── Catalog.controller.js
    │   └── Detail.controller.js
    ├── view/
    │   ├── App.view.xml
    │   ├── Catalog.view.xml
    │   └── Detail.view.xml
    ├── model/
    │   ├── formatter.js
    │   └── models.js
    └── i18n/
        ├── i18n.properties
        └── i18n_vi.properties
```

**Cấu hình proxy Northwind trong `ui5.yaml`** (tránh CORS):
```yaml
specVersion: "3.0"
metadata:
  name: com.bd.catalog
type: application
framework:
  name: SAPUI5
  version: "1.120.0"
  libraries:
    - name: sap.m
    - name: sap.f
    - name: sap.ui.core
    - name: sap.ui.layout
    - name: themelib_sap_horizon
server:
  customMiddleware:
    - name: fiori-tools-proxy
      afterMiddleware: compression
      configuration:
        ignoreCertError: true
        backend:
          - path: /V2
            url: https://services.odata.org
```

**`manifest.json` — phần dataSource + model:**
```json
"sap.app": {
  "dataSources": {
    "northwind": {
      "uri": "/V2/Northwind/Northwind.svc/",
      "type": "OData",
      "settings": {
        "odataVersion": "2.0",
        "localUri": "localService/metadata.xml"
      }
    }
  }
},
"sap.ui5": {
  "models": {
    "": {
      "dataSource": "northwind",
      "preload": true,
      "settings": {
        "defaultBindingMode": "TwoWay",
        "defaultCountMode": "Inline",
        "useBatch": true,
        "earlyTokenRequest": false
      }
    }
  }
}
```

**Rubric chấm điểm (100đ):**
| Tiêu chí | Điểm |
|---|---|
| Chạy đúng 10 acceptance criteria | 40 |
| Cấu trúc thư mục & BaseController đúng chuẩn | 15 |
| Server-side filter (không filter client) | 10 |
| i18n đầy đủ, không hardcode | 10 |
| Formatter tách file, có JSDoc | 10 |
| Responsive test được trên phone emulator | 10 |
| Code sạch, không `console.log` sót lại, ESLint pass | 5 |
