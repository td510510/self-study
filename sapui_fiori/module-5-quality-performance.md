# MODULE 5 — Debugging, Performance, Quality Assurance (Buổi 20 → 22)

> **JD coverage (Must-have):**
> • "Perform coding, unit testing, debugging, performance optimization, and defect fixing"
> • "Experience with debugging, performance tuning, and quality assurance for Fiori applications"
> • "Ensure UI consistency, code quality, documentation, and compliance with SAP development standards"

---

# BUỔI 20 — Debugging chuyên sâu

## 20.1. Bộ công cụ đầy đủ

| Công cụ | Mở bằng | Dùng để |
|---|---|---|
| **UI5 Diagnostics** | `Ctrl+Shift+Alt+S` | Control tree, binding, model, version, module loaded |
| **UI5 Inspector** | Chrome extension | Xem/sửa property, binding path, model realtime |
| **Chrome DevTools** | `F12` | Network, Sources, Console, Performance, Memory |
| **`sap-ui-debug=true`** | URL param | Load source không minify |
| **`sap-statistics=true`** | URL param | Tách thời gian Gateway vs Backend vs Frontend |
| **`/IWFND/ERROR_LOG`** | SAP GUI | Log lỗi backend |
| **FESR** (Frontend Sub-Record) | tự động khi bật statistics | Đo end-to-end response time |

## 20.2. Debug JavaScript trong Sources

```js
// Cách 1: debugger statement — dừng ngay tại dòng này
onSave: function () {
    debugger;
    // ...
},

// Cách 2: conditional breakpoint (chuột phải trên số dòng trong DevTools)
//   Điều kiện: sProductId === "HT-1000"
//   → chỉ dừng khi gặp bản ghi cụ thể, tránh dừng 500 lần

// Cách 3: logpoint (không dừng, chỉ log)
//   "Add logpoint" → oContext.getPath()

// Cách 4: break on XHR (Sources → XHR/fetch Breakpoints)
//   URL contains: /ProductSet  → dừng ngay trước khi gọi request

// Cách 5: break on DOM change (Elements → chuột phải → Break on → attribute modifications)
```

**Tìm file nguồn khi app đã build (`Component-preload.js`):**
```
1. Thêm ?sap-ui-debug=true vào URL   → UI5 load file gốc thay vì preload
2. Hoặc ?sap-ui-xx-componentPreload=off
3. Ctrl+P trong DevTools → gõ "Detail.controller" → mở đúng file
```

## 20.3. Debug binding — nguyên nhân "màn hình trắng"

```js
// Trong Console, khi app đang chạy:

// 1. Lấy control theo ID (dùng UI5 Inspector click vào control để lấy ID)
const oTable = sap.ui.getCore().byId("container-com.bd.app---list--productTable");

// 2. Kiểm tra binding
const oBinding = oTable.getBinding("items");
console.log("Path:",    oBinding.getPath());
console.log("Length:",  oBinding.getLength());
console.log("Contexts:", oBinding.getCurrentContexts().map(c => c.getPath()));
console.log("Filters:", oBinding.aApplicationFilters, oBinding.aFilters);

// 3. Kiểm tra model
const oModel = oTable.getModel();
console.log("Metadata loaded:", !!oModel.getServiceMetadata());
console.log("Pending changes:", oModel.getPendingChanges());
console.log("Cached data:", oModel.oData);           // V2 only

// 4. Kiểm tra context của 1 dòng
const oCtx = oTable.getItems()[0].getBindingContext();
console.log(oCtx.getPath(), oCtx.getObject());
```

### Checklist "màn hình trắng, không lỗi"
```
1. Binding path đúng chưa?  (số nhiều/ít, /ProductSet vs /Products)
2. Model đã được set lên view/component chưa?  oView.getModel()
3. Model có tên không?  {view>/x} vs {/x}
4. Metadata load xong chưa?  oModel.metadataLoaded()
5. Request có được gửi không?  → Network tab
6. Request trả 200 nhưng results rỗng?  → filter sai / không có quyền xem dữ liệu
7. Aggregation đúng chưa?  items vs rows vs content
8. Control có visible=false do expression binding sai?
```

## 20.4. Bật log của UI5

```js
sap.ui.require(["sap/base/Log"], function (Log) {
    Log.setLevel(Log.Level.DEBUG);           // ALL, DEBUG, INFO, WARNING, ERROR, FATAL, NONE
    Log.setLevel(Log.Level.DEBUG, "sap.ui.model.odata.v2.ODataModel");  // theo component
});
```

Hoặc qua URL: `?sap-ui-logLevel=DEBUG`

Trong code của mình:
```js
sap.ui.define(["sap/base/Log"], function (Log) {
    "use strict";
    // ✅ dùng Log, KHÔNG dùng console.log (ESLint sẽ chặn)
    Log.info("Product loaded", sProductId, "com.bd.app.controller.Detail");
    Log.error("Failed to save", oError, "com.bd.app.controller.Detail");
});
```

## 20.5. Debug memory leak

```
DevTools → Memory → Heap snapshot
1. Chụp snapshot lúc app vừa mở
2. Mở/đóng dialog 20 lần
3. Chụp snapshot thứ 2
4. Chọn "Comparison" → sắp xếp theo "Delta"
5. Nếu số Dialog / ManagedObject tăng dần → leak
```

**Nguyên nhân leak phổ biến trong UI5:**
| Nguyên nhân | Fix |
|---|---|
| Fragment tạo mới mỗi lần, không destroy | Cache promise + `addDependent()` |
| `attachEvent` mà không `detachEvent` trong `onExit` | Detach trong `onExit` |
| `setInterval` không `clearInterval` | Clear trong `onExit` |
| EventBus subscribe không unsubscribe | `getEventBus().unsubscribe()` |
| Giữ tham chiếu tới control đã destroy | Set `null` trong `onExit` |

```js
onInit: function () {
    this._oEventBus = this.getOwnerComponent().getEventBus();
    this._oEventBus.subscribe("app", "refresh", this._onRefresh, this);
    this._iPolling = setInterval(this._poll.bind(this), 30000);
},

onExit: function () {
    this._oEventBus.unsubscribe("app", "refresh", this._onRefresh, this);
    clearInterval(this._iPolling);
    if (this._oDialog) { this._oDialog.destroy(); this._oDialog = null; }
}
```

## 20.6. Lab 20 — Debug 5 case thật

| Case | Mô tả | Kỹ năng rèn |
|---|---|---|
| 1 | App trắng sau khi deploy, local chạy OK | Cache buster, path tuyệt đối vs tương đối |
| 2 | Dialog mở lần 2 lỗi "duplicate id" | Fragment lifecycle |
| 3 | Save thành công nhưng bảng không cập nhật | `refreshAfterChange`, binding refresh |
| 4 | Bộ nhớ tăng dần, app đơ sau 30 phút | Heap snapshot, leak |
| 5 | Lỗi chỉ xuất hiện trên FLP, không xuất hiện local | Content density, shell header, intent params |

---

# BUỔI 21 — Performance Tuning

> Đây là chủ đề JD nêu **rõ ràng**. Cần có con số cụ thể để nói khi phỏng vấn.

## 21.1. Đo trước, tối ưu sau

### Công cụ đo
```
1. Chrome DevTools → Performance → Record → reload app
   • Đo: FCP (First Contentful Paint), LCP, TTI (Time To Interactive)
2. Network tab → Disable cache → reload
   • Đo: số request, tổng KB, thời gian request chậm nhất
3. ?sap-statistics=true  → tách Gateway/Backend/Frontend time
4. sap.ui.performance.Measurement  → đo đoạn code cụ thể
```

```js
sap.ui.require(["sap/ui/performance/Measurement"], function (Measurement) {
    Measurement.setActive(true);
    Measurement.start("bd.loadProducts", "Load product list");
    // ... code
    Measurement.end("bd.loadProducts");
    console.table(Measurement.getAllMeasurements());
});
```

### Bảng mục tiêu (dùng làm SLA trong dự án)
| Chỉ số | Mục tiêu |
|---|---|
| App start (cold, cached UI5) | < 3s |
| App start (warm) | < 1.5s |
| Navigation list → detail | < 1s |
| Số HTTP request khi start | < 15 |
| Payload OData mỗi request | < 200 KB |
| TTI | < 4s |

## 21.2. 15 kỹ thuật tối ưu (xếp theo tác động)

### ⭐⭐⭐ Tác động lớn nhất

**1. `Component-preload.js` — gộp request**
```bash
ui5 build --clean-dest
```
Từ ~80 request → 1 request. **Đây là tối ưu số 1.**

**2. Async everywhere**
```json
"sap.ui5": {
  "rootView": { "async": true },
  "routing": { "config": { "async": true } }
}
```
```html
data-sap-ui-async="true"
```
Sync loading chặn main thread → app "đơ" khi load.

**3. `$select` — chỉ lấy field cần dùng**
```xml
<!-- ❌ Lấy toàn bộ 40 field -->
<Table items="{/ProductSet}">

<!-- ✅ Lấy 5 field -->
<Table items="{
    path: '/ProductSet',
    parameters: { select: 'ProductID,Name,Price,CurrencyCode,CategoryName' }
}">
```
Payload có thể giảm **70–80%**.

**4. Không `$expand` bừa bãi**
```
❌ $expand=ToSupplier,ToCategory,ToReviews,ToImages,ToStock   ← 1 request nhưng 2MB
✅ $expand=ToSupplier  + lazy load phần còn lại khi user mở tab
```

**5. Paging thật sự**
```xml
<Table growing="true" growingThreshold="20" growingScrollToLoad="true">
```
Kết hợp `defaultOperationMode: "Server"` → backend trả 20 dòng, không phải 5000.

### ⭐⭐ Tác động trung bình

**6. `preload: true` cho model** — metadata request khởi động sớm, song song với view loading.

**7. Bỏ value list annotation nếu không dùng F4**
```json
"settings": { "metadataUrlParams": { "sap-value-list": "none" } }
```
Metadata của service lớn có thể từ 3MB xuống 400KB.

**8. `useBatch: true`** — gom request, giảm round-trip (mặc định đã bật với V2).

**9. Lazy load view/fragment không dùng ngay**
```js
// ❌ Load tất cả dependency ở đầu file
// ✅ Chỉ load khi thực sự cần
onOpenRareDialog: function () {
    sap.ui.require(["sap/m/MessageBox"], (MessageBox) => MessageBox.show("..."));
}
```

**10. `busyIndicatorDelay`** — không phải tối ưu tốc độ thật nhưng cải thiện **cảm nhận**:
```xml
<Table busyIndicatorDelay="0"/>    <!-- hiện ngay khi loading -->
<Page busyIndicatorDelay="1000"/>  <!-- không nhấp nháy với request nhanh -->
```

**11. `libs` khai báo đủ trong manifest** — UI5 preload cả library thay vì tải lẻ từng module.
```json
"dependencies": { "libs": { "sap.m": {}, "sap.f": {}, "sap.ui.core": {} } }
```

**12. Tắt `refreshAfterChange`** khi không cần:
```json
"settings": { "refreshAfterChange": false }
```
Mặc định `true` → mỗi lần save, UI5 refresh mọi binding → nhiều request thừa.

### ⭐ Tinh chỉnh

**13. Cache buster** — cho phép cache vĩnh viễn file tĩnh:
```html
<script src="resources/sap-ui-core.js" data-sap-ui-appCacheBuster="./"></script>
```

**14. `sap.ui.table.Table` cho dataset lớn** — virtual scrolling, chỉ render dòng nhìn thấy.

**15. Formatter thay vì binding lồng nhau phức tạp** — expression binding parse mỗi lần render.

## 21.3. Case study — tối ưu từ 8.2s xuống 2.4s

Bối cảnh: app List Report có 5.000 sản phẩm, on-premise Gateway.

| Bước | Thay đổi | Trước | Sau |
|---|---|---|---|
| Baseline | — | 8.2s / 84 requests / 4.1 MB | |
| 1 | `ui5 build` → Component-preload | 8.2s | 5.6s (18 req) |
| 2 | `$select` 6 field thay vì 42 | 5.6s | 4.3s (1.2 MB) |
| 3 | Bỏ `$expand` 3 navigation không dùng | 4.3s | 3.6s |
| 4 | `growing=20` + `operationMode: Server` | 3.6s | 3.0s (280 KB) |
| 5 | `sap-value-list: none` | 3.0s | 2.7s |
| 6 | `preload: true` + `async: true` | 2.7s | 2.4s |
| 7 | (backend) ABAPer honour `$filter` trong DPC_EXT | Gateway 1.8s → 0.4s | |

**Cách kể lại khi phỏng vấn:**
> "On one product app the initial load was 8.2 seconds. I profiled it with DevTools and `sap-statistics`, which showed 84 requests and 4 MB of payload, plus 1.8 seconds spent in the Gateway. Bundling with `Component-preload` cut the request count to 18. Adding `$select` and removing three unused `$expand`s took the payload from 4 MB to 280 KB. Enabling server-side paging and disabling value-list metadata brought it to 2.7 seconds. The last second came from the backend: the DPC implementation ignored `$filter`, so I raised it with the ABAP colleague and we fixed it in the data provider. Final number was 2.4 seconds — a 70% improvement."

## 21.4. Bài tập buổi 21
1. Đo app Project 2 trước/sau tối ưu, lập bảng như mục 21.3.
2. Chứng minh bằng screenshot Network tab.
3. Viết đoạn tường thuật 1 phút bằng tiếng Anh về kết quả tối ưu.

---

# BUỔI 22 — Unit Test (QUnit), Integration Test (OPA5), Code Quality

## 22.1. Kim tự tháp test cho ứng dụng Fiori

```
        /\        OPA5 (Integration / Journey)    — ít, chậm, giá trị cao
       /  \       ~10-20 journeys
      /----\
     /      \     QUnit (Unit)                    — nhiều, nhanh
    /        \    ~80-150 tests: formatter, helper, controller logic
   /----------\
  ESLint + Type checking                          — chạy mỗi commit
```

## 22.2. Cấu trúc thư mục test chuẩn

```
webapp/test/
├── testsuite.qunit.html
├── testsuite.qunit.js
├── unit/
│   ├── unitTests.qunit.html
│   ├── unitTests.qunit.js
│   ├── model/
│   │   ├── formatter.qunit.js
│   │   └── ODataHelper.qunit.js
│   └── controller/
│       └── List.controller.qunit.js
└── integration/
    ├── opaTests.qunit.html
    ├── opaTests.qunit.js
    ├── AllJourneys.js
    ├── pages/
    │   ├── List.js
    │   ├── Detail.js
    │   └── App.js
    └── journeys/
        ├── NavigationJourney.js
        ├── FilterJourney.js
        └── CreateJourney.js
```

## 22.3. QUnit — test formatter

**`test/unit/model/formatter.qunit.js`**
```js
/*global QUnit*/
sap.ui.define([
    "com/bd/app/model/formatter",
    "sap/ui/core/library"
], function (formatter, coreLibrary) {
    "use strict";

    const ValueState = coreLibrary.ValueState;

    QUnit.module("formatter - stockState");

    QUnit.test("Should return Error for zero or negative stock", function (assert) {
        assert.strictEqual(formatter.stockState(0),  ValueState.Error, "zero → Error");
        assert.strictEqual(formatter.stockState(-5), ValueState.Error, "negative → Error");
    });

    QUnit.test("Should return Warning for low stock", function (assert) {
        assert.strictEqual(formatter.stockState(1),  ValueState.Warning);
        assert.strictEqual(formatter.stockState(19), ValueState.Warning);
    });

    QUnit.test("Should return Success for healthy stock", function (assert) {
        assert.strictEqual(formatter.stockState(20),   ValueState.Success);
        assert.strictEqual(formatter.stockState(1000), ValueState.Success);
    });

    QUnit.test("Should handle null and undefined gracefully", function (assert) {
        assert.strictEqual(formatter.stockState(null),      ValueState.None);
        assert.strictEqual(formatter.stockState(undefined), ValueState.None);
    });

    QUnit.module("formatter - currency");

    QUnit.test("Should format amount with currency", function (assert) {
        const sResult = formatter.currency(1234.5, "EUR");
        assert.ok(sResult.indexOf("1,234.50") > -1, "amount formatted: " + sResult);
    });

    QUnit.test("Should return empty string for null amount", function (assert) {
        assert.strictEqual(formatter.currency(null, "EUR"), "");
    });

    QUnit.module("formatter - fullName");

    QUnit.test("Should join non-empty parts", function (assert) {
        assert.strictEqual(formatter.fullName("John", "Doe", "Dr."), "Dr. John Doe");
        assert.strictEqual(formatter.fullName("John", "Doe", ""),    "John Doe");
        assert.strictEqual(formatter.fullName("", "", ""),           "");
    });
});
```

## 22.4. QUnit — test controller với sinon

```js
/*global QUnit, sinon*/
sap.ui.define([
    "com/bd/app/controller/List.controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/thirdparty/sinon",
    "sap/ui/thirdparty/sinon-qunit"
], function (ListController, JSONModel) {
    "use strict";

    QUnit.module("List Controller", {
        beforeEach: function () {
            this.oController = new ListController();

            // Stub các API của framework mà controller phụ thuộc
            this.oViewStub = {
                getModel: this.stub().returns(new JSONModel({ count: 0 })),
                setModel: this.stub(),
                setBusy:  this.stub(),
                byId:     this.stub()
            };
            this.stub(this.oController, "getView").returns(this.oViewStub);
        },
        afterEach: function () {
            this.oController.destroy();
        }
    });

    QUnit.test("onSearch should apply a Contains filter", function (assert) {
        // Arrange
        const oBindingStub = { filter: this.stub() };
        const oTableStub   = { getBinding: this.stub().returns(oBindingStub) };
        this.stub(this.oController, "byId").returns(oTableStub);

        const oEvent = {
            getParameter: this.stub().withArgs("query").returns("Laptop")
        };

        // Act
        this.oController.onSearch(oEvent);

        // Assert
        assert.ok(oBindingStub.filter.calledOnce, "filter was called once");
        const aFilters = oBindingStub.filter.firstCall.args[0];
        assert.strictEqual(aFilters.length, 1, "one filter applied");
    });

    QUnit.test("onSearch with empty query should clear filters", function (assert) {
        const oBindingStub = { filter: this.stub() };
        this.stub(this.oController, "byId").returns({ getBinding: () => oBindingStub });

        this.oController.onSearch({ getParameter: this.stub().returns("") });

        assert.deepEqual(oBindingStub.filter.firstCall.args[0], [], "filters cleared");
    });
});
```

## 22.5. OPA5 — Page Object

**`test/integration/pages/List.js`**
```js
sap.ui.define([
    "sap/ui/test/Opa5",
    "sap/ui/test/actions/Press",
    "sap/ui/test/actions/EnterText",
    "sap/ui/test/matchers/AggregationLengthEquals",
    "sap/ui/test/matchers/PropertyStrictEquals",
    "sap/ui/test/matchers/BindingPath"
], function (Opa5, Press, EnterText, AggregationLengthEquals, PropertyStrictEquals, BindingPath) {
    "use strict";

    const sViewName = "List";

    Opa5.createPageObjects({
        onTheListPage: {

            actions: {
                iSearchFor: function (sText) {
                    return this.waitFor({
                        id: "searchField",
                        viewName: sViewName,
                        actions: new EnterText({ text: sText }),
                        errorMessage: "Could not find the search field"
                    });
                },

                iPressOnTheFirstItem: function () {
                    return this.waitFor({
                        id: "productTable",
                        viewName: sViewName,
                        actions: function (oTable) {
                            new Press().executeOn(oTable.getItems()[0]);
                        },
                        errorMessage: "The table has no items"
                    });
                },

                iPressTheCreateButton: function () {
                    return this.waitFor({
                        id: "createButton",
                        viewName: sViewName,
                        actions: new Press(),
                        errorMessage: "Create button not found"
                    });
                }
            },

            assertions: {
                iShouldSeeTheTable: function () {
                    return this.waitFor({
                        id: "productTable",
                        viewName: sViewName,
                        success: function () {
                            Opa5.assert.ok(true, "The product table is visible");
                        },
                        errorMessage: "The product table was not found"
                    });
                },

                iShouldSeeItemCount: function (iCount) {
                    return this.waitFor({
                        id: "productTable",
                        viewName: sViewName,
                        matchers: new AggregationLengthEquals({ name: "items", length: iCount }),
                        success: function () {
                            Opa5.assert.ok(true, "The table has " + iCount + " items");
                        },
                        errorMessage: "The table does not have " + iCount + " items"
                    });
                },

                iShouldSeeEmptyState: function () {
                    return this.waitFor({
                        controlType: "sap.m.IllustratedMessage",
                        viewName: sViewName,
                        success: function () {
                            Opa5.assert.ok(true, "The empty state is shown");
                        },
                        errorMessage: "No empty state illustration found"
                    });
                }
            }
        }
    });
});
```

## 22.6. OPA5 — Journey

**`test/integration/journeys/NavigationJourney.js`**
```js
/*global QUnit, opaTest*/
sap.ui.define([
    "sap/ui/test/opaQunit",
    "./pages/List",
    "./pages/Detail",
    "./pages/App"
], function () {
    "use strict";

    QUnit.module("Navigation Journey");

    opaTest("Should see the product list on startup", function (Given, When, Then) {
        // Arrange — khởi động app với mock server
        Given.iStartMyApp({
            delay: 0,
            hash: ""
        });

        // Assert
        Then.onTheListPage.iShouldSeeTheTable();
    });

    opaTest("Should navigate to the detail page when pressing an item", function (Given, When, Then) {
        When.onTheListPage.iPressOnTheFirstItem();

        Then.onTheDetailPage.iShouldSeeTheObjectPage()
                            .and.iShouldSeeTheProductName("Notebook Basic 15");
    });

    opaTest("Should go back to the list", function (Given, When, Then) {
        When.onTheDetailPage.iPressTheBackButton();

        Then.onTheListPage.iShouldSeeTheTable();

        // Cleanup — bắt buộc ở journey cuối
        Then.iTeardownMyApp();
    });
});
```

**`test/integration/journeys/FilterJourney.js`**
```js
/*global QUnit, opaTest*/
sap.ui.define(["sap/ui/test/opaQunit", "./pages/List"], function () {
    "use strict";

    QUnit.module("Filter Journey");

    opaTest("Should filter the list when searching", function (Given, When, Then) {
        Given.iStartMyApp({ delay: 0 });

        When.onTheListPage.iSearchFor("Notebook");

        Then.onTheListPage.iShouldSeeItemCount(2);
    });

    opaTest("Should show the empty state when nothing matches", function (Given, When, Then) {
        When.onTheListPage.iSearchFor("ZZZ_DOES_NOT_EXIST");

        Then.onTheListPage.iShouldSeeEmptyState();

        Then.iTeardownMyApp();
    });
});
```

**`test/integration/pages/App.js`** — startup helper
```js
sap.ui.define(["sap/ui/test/Opa5"], function (Opa5) {
    "use strict";

    Opa5.extendConfig({
        viewNamespace: "com.bd.app.view.",
        autoWait: true,               // tự chờ app hết busy — tránh flaky test
        timeout: 30,
        pollingInterval: 400,
        arrangements: new Opa5({
            iStartMyApp: function (oOptions) {
                oOptions = oOptions || {};
                return this.iStartMyUIComponent({
                    componentConfig: {
                        name: "com.bd.app",
                        async: true,
                        manifest: true
                    },
                    hash: oOptions.hash,
                    autoWait: true
                });
            }
        })
    });
});
```

## 22.7. Chạy test bằng Karma (cho CI)

```bash
npm install --save-dev karma karma-chrome-launcher karma-coverage \
    karma-ui5 @sapui5/types
```

**`karma.conf.js`**
```js
module.exports = function (config) {
    config.set({
        frameworks: ["ui5"],
        ui5: {
            url: "https://sapui5.hana.ondemand.com",
            configPath: "ui5.yaml",
            testpage: "webapp/test/testsuite.qunit.html"
        },
        browsers: ["ChromeHeadless"],
        singleRun: true,
        reporters: ["progress", "coverage"],
        preprocessors: {
            "webapp/{controller,model,control,utils}/**/*.js": ["coverage"]
        },
        coverageReporter: {
            includeAllSources: true,
            reporters: [
                { type: "html", dir: "coverage/" },
                { type: "text-summary" },
                { type: "lcovonly", dir: "coverage/", subdir: "." }
            ],
            check: {
                each: {
                    statements: 70,
                    branches: 60,
                    functions: 70,
                    lines: 70
                }
            }
        }
    });
};
```

```bash
npm run test         # chạy toàn bộ
npx karma start --browsers Chrome --no-single-run   # watch mode khi phát triển
```

## 22.8. Documentation standards (JD yêu cầu rõ)

### A. JSDoc trong code
```js
/**
 * Loads the product together with its supplier and updates the view model.
 *
 * @param {string} sProductId  Product key, e.g. "HT-1000"
 * @param {boolean} [bForceRefresh=false]  Bypass the model cache
 * @returns {Promise<object>}  Resolves with the product entity
 * @throws {Error} When the product does not exist
 * @since 1.2.0
 * @private
 */
_loadProduct: async function (sProductId, bForceRefresh) { /* ... */ }
```

### B. README của app (bắt buộc trong product development)
```markdown
# BD Product Manager

## Overview
Fiori freestyle application to maintain product master data for BD IT Product.

## Architecture
- SAPUI5 1.120 (freestyle, MVC)
- OData V2 service `ZBD_PRODUCT_SRV` on ES5 (Gateway hub)
- Deployed to SAP BTP Cloud Foundry via MTA

## Prerequisites
- Node.js >= 20
- Access to destination `ES5`

## Local development
    npm install
    npm start            # against the real backend (proxy)
    npm run start-mock   # against the mock server

## Testing
    npm run lint
    npm run test:unit    # QUnit,  coverage threshold 70%
    npm run test         # QUnit + OPA5

## Deployment
    mbt build
    cf deploy mta_archives/bd-product-mgr_1.0.0.mtar

## Service dependencies
| Service | Entity sets used | Owner |
|---|---|---|
| ZBD_PRODUCT_SRV | ProductSet, CategorySet, BusinessPartnerSet | ABAP team (contact: ...) |

## Known limitations
- Sorting by supplier name is not supported (see DEF-0042)
- Attachments are read-only in this release

## Changelog
See CHANGELOG.md
```

### C. Technical Design Document — template
```markdown
# TDD — <Feature name>

## 1. Business requirement
<Trích dẫn nguyên văn requirement từ functional team>

## 2. Solution overview
<Sơ đồ + 1 đoạn mô tả>

## 3. Frontend design
- Floorplan: List Report / Object Page
- Views & controllers
- Key controls and bindings

## 4. Backend design / OData contract
| Entity set | Operations | Key fields | Notes |
|---|---|---|---|
| ProductSet | R, U | ProductID | Update limited to Price and Description |

## 5. Non-functional
- Performance: list must load < 3s for 5,000 records
- Authorization: scope $XSAPPNAME.Maintain required for edit
- Languages: EN, VI

## 6. Open points / assumptions
## 7. Test plan
## 8. Effort estimate
```

## 22.9. SAP Development Standards — checklist compliance

```markdown
### Naming
- [ ] Namespace: com.<company>.<area>.<app>  (vd. com.bd.product.manager)
- [ ] Controller: PascalCase + ".controller.js"
- [ ] View: PascalCase + ".view.xml"
- [ ] Fragment: PascalCase + ".fragment.xml"
- [ ] Private method / property: prefix "_"
- [ ] Event handler: prefix "on"
- [ ] Biến: Hungarian notation SAP (s=string, i=int, f=float, b=boolean,
      o=object, a=array, m=map, fn=function, d=date, v=variant, p=promise)

### Code
- [ ] "use strict" ở mọi module
- [ ] sap.ui.define, không dùng global sap.m.*
- [ ] Không dùng API deprecated (kiểm tra console warning)
- [ ] Không console.log — dùng sap/base/Log
- [ ] Không hardcode URL, ID hệ thống, client
- [ ] Không hardcode text — dùng i18n
- [ ] Không nối chuỗi tạo OData path — dùng createKey
- [ ] Xử lý lỗi ở mọi lời gọi OData
- [ ] onExit dọn dẹp dialog / interval / event

### Security
- [ ] Không lưu credential trong code hoặc manifest
- [ ] Không dùng innerHTML với dữ liệu người dùng (XSS)
- [ ] Dùng sap/base/security/encodeXML khi cần render HTML
- [ ] Authorization check ở backend, FE chỉ ẩn/hiện UI (không phải cơ chế bảo mật)

### Testing
- [ ] Unit test coverage >= 70%
- [ ] OPA5 journey cho luồng nghiệp vụ chính
- [ ] Test chạy được trong CI, không phụ thuộc backend thật

### Documentation
- [ ] README có hướng dẫn chạy local
- [ ] JSDoc cho mọi public/private method quan trọng
- [ ] CHANGELOG cập nhật mỗi release
```

## 22.10. Bài tập buổi 22
1. Viết ≥ 20 QUnit test cho Project 2, đạt coverage ≥ 70%.
2. Viết 3 OPA5 journey: Navigation, Filter, Create.
3. Viết README + TDD cho Project 2 bằng tiếng Anh.
4. Chạy checklist compliance, sửa hết mục fail.
