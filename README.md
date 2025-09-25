# Scholarship Eligibility Checker App

Ứng dụng kiểm tra điều kiện học bổng, frontend bằng Vite/React và backend bằng Convex.

Repo này đã loại bỏ hoàn toàn các form/step/question hardcode. Toàn bộ dữ liệu form được quản trị từ Admin UI và lưu trong Convex, Wizard phía client render động theo Active Form.

## Pipeline Dữ Liệu (Mới)

- Admin UI (FormBuilder, FormPreview, AdminDashboard)
- Convex DB (bảng `formSets`, `formSteps`, `formQuestions` và API trong `convex/forms.ts`)
- Wizard động (BrandedDynamicWizard) trên client đọc Active Form qua `api.forms.getActiveForm`

Nguyên tắc hiển thị:
- Không render label/placeholder fallback trong mã nguồn. Field/option chỉ xuất hiện nếu có label từ DB (`ui.labelText`) hoặc có bản dịch cho `labelKey` (qua i18n). Nếu thiếu, field/option/step sẽ không hiển thị.
- Không còn bất kỳ chuỗi tiếng Anh/nhãn/placeholder hardcode trong Wizard.

## Cấu Trúc Dự Án

- Frontend: thư mục `src`, build bằng [Vite](https://vitejs.dev/)
- Backend: thư mục `convex`
- Admin UI: các trang trong `src/components/pages` (FormBuilder, FormPreview, AdminDashboard)
- Wizard động: `src/components/pages/BrandedDynamicWizard.tsx`, dùng trong `src/components/pages/EligibilityChecker.tsx`

Chạy dev: `npm run dev` (song song frontend + Convex)
Build: `npm run build`
Test: `npm test`

## Quản Trị Form (Convex)

- Lấy Active Form: `api.forms.getActiveForm`
- Tạo/Publish Form Set: `api.forms.createFormSet`, `api.forms.publishFormSet`
- Bước (Step): `api.forms.createStep`, `api.forms.updateStep`, `api.forms.deleteStep`, `api.forms.reorderSteps`
- Câu hỏi (Question): `api.forms.createQuestion`, `api.forms.updateQuestion`, `api.forms.deleteQuestion`, `api.forms.reorderQuestions`

Sau khi publish một Form Set, Wizard động sẽ tự động đọc và render theo Form đó.

## Ghi Chú

- Thư mục phụ `chef-sanhocbong/` đã được xóa để làm sạch repo.
- Các test loader rules tĩnh đã được dọn để phù hợp với pipeline mới (không còn phụ thuộc JSON rules phía client cho UI).

Tham khảo thêm trong `docs/ADDING_SCHOLARSHIP.md` nếu cần quy trình làm việc với rules/eligibility ở phía Convex.
