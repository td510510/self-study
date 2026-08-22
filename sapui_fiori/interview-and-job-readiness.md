# Phụ lục A — Chuẩn bị phỏng vấn & làm việc thực tế

> Mục tiêu: học viên vào phỏng vấn vị trí **Senior SAP Fiori/UI5 Consultant** và trả lời được mọi câu hỏi bám theo JD.

---

## A.1. Bản đồ JD → Câu trả lời chuẩn bị sẵn

### "Senior-level hands-on experience in SAP Fiori / SAPUI5 development"

**Cách trả lời (dùng cấu trúc STAR):**
> "In my most recent work I built two applications end to end. The first was a
> freestyle UI5 app for shop-floor quality inspection — a worklist plus an object
> page with an editable characteristics table. The second was a Fiori Elements
> List Report for the approval flow, extended with a custom reject action through
> the Flexible Programming Model. I owned the whole lifecycle: OData contract
> design with the ABAP colleague, development, QUnit and OPA5 tests, performance
> tuning, and deployment to BTP Cloud Foundry through an MTA."

**Chuẩn bị sẵn:** 3 câu chuyện dự án, mỗi câu có Situation → Task → Action → Result, và **Result phải có con số**.

---

### "Strong knowledge of JavaScript, XML views, MVC patterns, and SAPUI5 controls"

Câu hỏi có thể gặp và đáp án ngắn gọn:

**Q: Explain the SAPUI5 MVC pattern.**
> View declares the UI in XML and binds to the model; the controller handles
> events and orchestrates; the model holds data and notifies bindings on change.
> Business logic doesn't live in the view, and the controller doesn't touch DOM
> directly. Shared logic goes into a BaseController or a separate service module.

**Q: What are the controller lifecycle hooks?**
> `onInit` once before rendering, `onBeforeRendering` and `onAfterRendering` on
> every render cycle, `onExit` on destroy. I use `onInit` for models and route
> handlers, `onAfterRendering` only for third-party integrations with a guard flag,
> and `onExit` for cleanup — dialogs, intervals, event bus subscriptions —
> otherwise you leak memory.

**Q: Difference between `this.byId()` and `sap.ui.getCore().byId()`?**
> `this.byId()` resolves the view-prefixed ID and is scoped to the view.
> `getCore().byId()` needs the full global ID including the component and view
> prefix, and breaks as soon as the view is embedded somewhere else. I always use
> `this.byId()`.

**Q: What is `sap.ui.define` and why not just use script tags?**
> It's UI5's AMD module definition. It loads dependencies asynchronously, which
> keeps the main thread free, and it's what makes `Component-preload` bundling
> possible. Synchronous loading via `jQuery.sap.require` is deprecated.

**Q: Property vs aggregation vs element binding?**
> Property binding binds one control property to one model path. Aggregation
> binding binds a list of children, creating a context per entry. Element binding
> sets a binding context on a control so all relative bindings underneath resolve
> against it — that's how object pages work.

**Q: Expression binding vs formatter — when do you use which?**
> Expression binding for a one-line condition that isn't reused. A formatter when
> the logic is longer, reused, or needs unit tests — and formatters are what I
> can actually cover in QUnit.

**Q: How do you choose between `sap.m.Table` and `sap.ui.table.Table`?**
> Default is the responsive `sap.m.Table` with growing, because Fiori requires
> responsiveness. I switch to the grid table only for large desktop-only datasets,
> because it virtualizes rows — but it isn't responsive.

---

### "Experience consuming and troubleshooting OData services"

**Q: Walk me through debugging a failing OData call.**
> Open DevTools, find the request, note the status code and read the Gateway error
> payload — the useful message is usually in `error.innererror.errordetails`, not
> in `error.message`. If it's a `$batch`, I read the multipart body to find which
> sub-request failed. Then I reproduce the same URL in `/IWFND/GW_CLIENT`. If it
> fails there too, it's a backend issue and I collect the `/IWFND/ERROR_LOG` entry
> and the timestamp for the ABAP colleague. If it works there, the problem is on
> my side or in between — CSRF token, destination, a wrong `createKey`, or an
> invalid filter.

**Q: `submitChanges` returned success but nothing was saved. Why?**
> Because with `$batch`, `submitChanges` calls the success handler even when
> individual requests inside the batch failed. You have to walk
> `__batchResponses` and `__changeResponses` and check each status code. That's a
> bug I've had to fix in inherited code more than once.

**Q: What causes a 403 CSRF error?**
> Either the token wasn't fetched before the first write — solved with
> `earlyTokenRequest: true` — or the session expired, in which case I call
> `refreshSecurityToken()` and retry once. On BTP it can also be the destination
> not forwarding the token.

**Q: What is an ETag and how do you handle a 412?**
> The ETag is the version of the entity. UI5 sends it back as `If-Match` on
> updates. A 412 means someone else changed the record. I never force-overwrite —
> I tell the user, refresh the binding to get the new ETag and let them redo the
> change on current data.

**Q: How do you filter across an association?**
> With `new Filter("ToSupplier/CompanyName", FilterOperator.Contains, sValue)`,
> but only if the backend supports it. I always check `sap:filterable` in
> `$metadata` first — filtering on a property marked `filterable="false"` gives a
> 400, and that's a very common defect.

**Q: V2 vs V4 — what actually changes for you as a developer?**
> V2 caches data in the model, so `getProperty("/Path")` works. V4 has no model
> cache — data lives in bindings, you go through contexts and
> `requestProperty`/`requestObject`. Creation moves from `oModel.create()` to
> `oListBinding.create()`, and submitting moves from `submitChanges()` to
> `submitBatch(groupId)`. V4 also supports nested `$expand` with filters, and with
> RAP you get draft handling for free.

---

### "Good understanding of SAP Gateway and integration with SAP backend systems"

**Q: How is an OData service built in SAP?**
> Three ways: SEGW with a DPC_EXT class for V2, a CDS view with `@OData.publish`,
> or RAP with a behavior definition and service binding for V4. New development
> on S/4 goes to RAP.

**Q: A list takes 30 seconds to load. Where do you look?**
> First I check with `sap-statistics=true` whether the time is in the Gateway,
> the backend, or the frontend. Very often the backend's
> `GET_ENTITYSET` ignores `$filter`, `$top` and `$skip` — it selects everything and
> lets Gateway paginate in memory. That's a backend fix, and I raise it with the
> exact request and timing evidence rather than just saying "it's slow".

**Q: You changed a field in the backend but the app doesn't see it.**
> Metadata cache. Run `/IWFND/CACHE_CLEANUP` and `/IWBEP/CACHE_CLEANUP`, then hard
> refresh the browser. If the app has a `localUri` metadata file for mocking, that
> also needs updating.

---

### "Ability to analyze business requirements and propose practical technical solutions"

**Q: The business asks for X. How do you approach it?**
> I don't estimate before I understand three things: where the data comes from and
> who owns it, where the business rules should live, and what the non-functional
> constraints are — volume, devices, offline, authorization. Then I propose an
> approach with the trade-offs stated explicitly. For example, if someone says
> "it must work on tablets", I ask whether they mean responsive or genuinely
> offline, because those differ by roughly a factor of three in effort.

**Q: When would you use Fiori Elements vs freestyle?**
> (dùng câu trả lời ở Module 4, mục 16.1)

---

### "Debugging, performance tuning, and quality assurance"

Chuẩn bị **1 câu chuyện tối ưu có số liệu** (dùng case study Module 5, mục 21.3).

**Q: How do you test a Fiori app?**
> Three layers. ESLint and type checking on every commit. QUnit for formatters,
> helpers and controller logic with sinon stubs — I target 70% statement coverage.
> OPA5 journeys against a mock server for the main business flows, which run in
> CI without needing a live backend. The mock server matters: tests that depend on
> a real Gateway are flaky and can't run in a pipeline.

---

### "Ability to work independently and collaborate with cross-functional/global teams"

Chuẩn bị ví dụ cụ thể về:
- Một lần bạn tự quyết định kỹ thuật khi không có ai để hỏi
- Một lần bạn phối hợp với ABAPer / functional consultant để giải quyết vấn đề
- Cách bạn xử lý khi múi giờ lệch nhau (viết tài liệu rõ để người khác đọc là hiểu)

---

## A.2. 40 câu hỏi kỹ thuật hay gặp (tự trả lời trước khi xem gợi ý)

### SAPUI5 Core
1. Vòng đời khởi tạo của một app UI5 từ index.html tới khi hiện dữ liệu?
2. `manifest.json` chứa gì? Tại sao gọi là "app descriptor"?
3. `Component.js` làm gì? Vì sao phải gọi `UIComponent.prototype.init.apply(this, arguments)`?
4. Sự khác biệt giữa `rootView` và `routing`?
5. `sap.ui.require` vs `sap.ui.define`?
6. Content density là gì, tại sao dialog hay bị sai?
7. Fragment khác View chỗ nào? Vì sao fragment gây duplicate ID?
8. Làm sao tránh memory leak trong UI5?
9. `busyIndicatorDelay` để làm gì?
10. Custom control cần những gì tối thiểu?

### Data Binding
11. 4 loại binding? Ví dụ mỗi loại.
12. OneWay / TwoWay / OneTime — mặc định của JSONModel và ODataModel là gì?
13. Absolute vs relative binding path?
14. Named model dùng khi nào?
15. `FilterType.Application` vs `FilterType.Control`?
16. Làm sao group dữ liệu trong bảng?
17. Type + constraints làm gì? Message hiện ra thế nào?

### OData
18. `$metadata` chứa gì? Kể 5 phần.
19. `sap:filterable="false"` gây hậu quả gì?
20. Viết URL lấy 10 sản phẩm giá > 100, sort theo tên, kèm supplier.
21. `$batch` hoạt động thế nào? changeSet là gì?
22. Deep insert là gì, backend cần gì?
23. CSRF token flow?
24. ETag / 412 xử lý thế nào?
25. `createKey` vs nối chuỗi?
26. `defaultCountMode` các giá trị và khác biệt?
27. Function import khác CRUD chỗ nào?
28. V2 vs V4 — 5 khác biệt lớn nhất?

### Gateway / Backend
29. Kể 5 t-code Gateway và dùng để làm gì.
30. App chậm — làm sao chứng minh lỗi ở backend?
31. Metadata cache clear thế nào?
32. Fiori Elements đọc annotation từ đâu?

### Fiori Elements / FLP / BTP
33. Semantic Object / Action / Intent / Target Mapping?
34. `crossNavigation` trong manifest dùng làm gì?
35. Fiori Elements V2 vs V4 khác gì?
36. Flexible Programming Model cho phép mở rộng những gì?
37. `xs-app.json` làm gì? `authenticationType` các giá trị?
38. Destination property nào bắt buộc cho approuter?

### Quality
39. QUnit vs OPA5 — test gì ở mỗi tầng?
40. Kể 5 kỹ thuật tối ưu hiệu năng và tác động của chúng.

---

## A.3. Câu hỏi bạn nên hỏi nhà tuyển dụng

Hỏi tốt = thể hiện tư duy senior.

**Về kỹ thuật:**
- What UI5 version and OData version are the existing applications on?
- Is the landscape on-premise, BTP, or hybrid? Is there a Cloud Connector in place?
- Are the applications freestyle, Fiori Elements, or a mix? What drove that choice?
- Do you have a CI/CD pipeline for the Fiori apps, or is deployment manual?
- What's the current test coverage situation?

**Về cách làm việc (JD nhấn mạnh global team):**
- How is work split between the Fiori team and the ABAP team? Who owns the OData contract?
- What timezones does the team span, and how do you handle handovers?
- Is this greenfield product development or maintaining an existing product?
  *(JD nói "product development or long-term application maintenance" → câu này rất đúng trọng tâm)*

**Về vai trò:**
- The JD mentions providing technical guidance — is there a mentoring component,
  or is it more about being the escalation point for issues?
- What does success look like in the first six months?

---

## A.4. Tiếng Anh cho SAP Fiori Consultant

### Từ vựng bắt buộc dùng đúng

| Tiếng Việt hay nói | Tiếng Anh đúng trong ngữ cảnh SAP |
|---|---|
| Màn hình | screen / view / page (không dùng "monitor") |
| Bảng dữ liệu | table / list |
| Lỗi | issue, defect, bug, error |
| Sửa lỗi | fix a defect / resolve an issue |
| Kiểm thử | testing (unit test, integration test, regression test) |
| Triển khai | deploy / deployment |
| Yêu cầu | requirement |
| Phân tích yêu cầu | requirement analysis / gathering |
| Đặc tả kỹ thuật | technical design document (TDD) / functional spec (FS) |
| Chuyển giao | handover |
| Rà soát code | code review |
| Môi trường | environment (DEV / QAS / PRD) |
| Chuyển đổi | transport (ABAP) |
| Tối ưu | optimize / tune |
| Vướng mắc | blocker / impediment |
| Ước lượng công sức | effort estimate (man-days) |

### 10 câu dùng hằng ngày trong standup / meeting

```
"Yesterday I finished the object page bindings; today I'm working on the
 error handling for the batch submit. No blockers."

"I'm blocked on the OData service — the $expand returns null. I've raised it
 with the ABAP team and logged it as DEF-0051."

"Could you clarify what should happen when the user cancels midway? The current
 requirement doesn't cover that case."

"That's technically possible, but it would mean X. I'd suggest Y instead
 because Z. Happy to go either way once you've decided."

"Let me reproduce it on my side first and get back to you with the exact request."

"I'd estimate about three days for the development, plus one day for testing.
 That assumes the service is already available."

"I've pushed the fix to the feature branch — could you review when you get a chance?"

"To confirm my understanding: you want the approval to be possible only after
 all mandatory characteristics are filled. Is that right?"

"I'd rather not put that rule in the UI. If it lives in the backend it stays
 consistent no matter which channel updates the data."

"Let's take this offline — I'll set up a 30-minute call with the ABAP colleague."
```

### Mẫu email báo cáo tiến độ hằng tuần

```
Subject: Weekly status — Quality Inspection app (CW 33)

Hi all,

DONE THIS WEEK
- Object page with editable characteristics table (US-03) — ready for review
- Batch error handling implemented and unit tested (DEF-0044 closed)
- Performance: list load reduced from 4.1s to 2.3s after adding $select
  and server-side paging

IN PROGRESS
- Attachment upload (US-05) — 70%, expected Wednesday
- OPA5 journeys for the recording flow — 2 of 4 done

BLOCKED / RISKS
- The RejectLot function import returns 501 on DEV. Raised with Minh (ABAP),
  tracked as DEF-0051. If it isn't available by Friday it will push US-06
  into next sprint.
- Still waiting on a decision about offline support. This is on the critical
  path for the architecture — please see my mail of 12 Aug.

NEXT WEEK
- Finish attachments and OPA5 coverage
- Start the approval app (Fiori Elements)

Best regards,
<Name>
```

---

## A.5. CV — cách viết phần SAP Fiori cho JD này

**❌ Cách viết yếu:**
```
- Developed SAP Fiori applications using SAPUI5
- Worked with OData services
- Fixed bugs
```

**✅ Cách viết mạnh (có số, có công nghệ, có kết quả):**
```
SAP Fiori / UI5 Developer — <Company>                          2023 – present

• Designed and delivered 6 SAPUI5 applications (4 freestyle, 2 Fiori Elements)
  for manufacturing and procurement processes, used by ~350 users across 3 sites.
• Owned the OData contract design together with the ABAP team for 4 Gateway
  services (SEGW, OData V2) and 2 RAP services (OData V4).
• Reduced the load time of the main product list from 8.2s to 2.4s (-70%) by
  bundling with Component-preload, introducing $select and server-side paging,
  and working with the ABAP team to honour $filter in the data provider.
• Built the test foundation for the team: QUnit + OPA5 with a mock server,
  raised coverage from 0% to 74%, integrated into the GitHub Actions pipeline.
• Deployed applications to SAP BTP Cloud Foundry via MTA and to on-premise
  Fiori Launchpad, including destination and XSUAA role configuration.
• Acted as the escalation point for OData issues, reducing average defect
  resolution time from 4 days to 1.5 days by introducing a standard triage
  procedure (DevTools → /IWFND/GW_CLIENT → error log).

Tech: SAPUI5 1.108–1.120, OData V2/V4, SAP Gateway, Fiori Elements, SAP BTP CF,
      SAP Business Application Studio, ABAP (read-level), QUnit, OPA5, TypeScript
```

---

## A.6. 30 ngày đầu tiên khi vào làm — checklist

```markdown
### Tuần 1 — Hiểu bối cảnh
- [ ] Lấy quyền truy cập: DEV/QAS system, BTP subaccount, Git repo, Jira
- [ ] Liệt kê mọi app Fiori hiện có: loại (FE/freestyle), UI5 version, OData version
- [ ] Vẽ sơ đồ landscape: FLP ở đâu, Gateway ở đâu, backend nào
- [ ] Xác định ai là: ABAP contact, functional contact, Basis contact
- [ ] Chạy được 1 app trên máy mình (local dev + proxy)

### Tuần 2 — Hiểu code
- [ ] Đọc README + TDD của app chính
- [ ] Đọc code 1 app từ đầu đến cuối, ghi lại pattern nhóm đang dùng
- [ ] Nhận 1 defect nhỏ và fix — mục tiêu là đi qua toàn bộ quy trình
      (branch → code → review → transport/deploy → test)
- [ ] Ghi lại mọi chỗ khác với chuẩn SAP mà bạn thấy, **chưa vội đề xuất sửa**

### Tuần 3 — Đóng góp
- [ ] Nhận 1 user story hoàn chỉnh
- [ ] Đề xuất 1 cải tiến nhỏ có dẫn chứng (vd. thêm ESLint, hoặc 1 tối ưu đo được)

### Tuần 4 — Định vị
- [ ] Trình bày với team: 3 quan sát + 3 đề xuất, có ưu tiên và effort ước lượng
- [ ] Thống nhất với manager về kỳ vọng 3 tháng tiếp theo
```
