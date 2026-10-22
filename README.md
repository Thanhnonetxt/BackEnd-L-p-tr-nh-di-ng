# BACKEND WEBAPI - HỆ THỐNG ĐIỂM DANH SINH VIÊN ĐA TẦNG (TSV SMART ATTENDANCE)

> **MÃ SỐ DỰ ÁN WEBAPI:** `VoMauToanThanh_WebAPI`  
> **CƠ SỞ DỮ LIỆU:** `DB_VoMauToanThanh_Attendance`  
> **SINH VIÊN THỰC HIỆN:** VÕ MẪU TOÀN THANH  
> **NHÓM THỰC HIỆN:** TSV  
> **ĐỀ TÀI SỐ 3:** ĐIỂM DANH SINH VIÊN ĐA TẦNG (QR ĐỘNG, GPS GEO-FENCING, KHUÔN MẶT, VÂN TAY)  

---

## 1. Giới thiệu tổng quan

Đây là phần dịch vụ máy chủ (Backend WebAPI) phục vụ cho ứng dụng di động Flutter `vo_mau_toan_thanh_attendance`. API cung cấp đầy đủ các chức năng xác thực người dùng, phân quyền 3 roles (Admin, Giảng viên, Sinh viên), phát mã QR động xoay vòng 10 giây, xác thực vị trí GPS Geofencing (bán kính 50m), điểm danh sinh trắc học và hệ thống Micro-Quiz chống gian lận.

## 2. Công nghệ sử dụng

- **Node.js & Express.js**
- **CORS** (Hỗ trợ gọi chéo từ ứng dụng Flutter Web, Android, iOS)
- **Database:** SQL Server (`DB_VoMauToanThanh_Attendance.sql`) & In-Memory Data Fallback.

## 3. Hướng dẫn cài đặt & Chạy ứng dụng

### Bước 1: Cài đặt thư viện dependencies
```bash
npm install
```

### Bước 2: Chạy Server
- **Chế độ thông thường:**
```bash
npm start
```
- **Chế độ phát triển (Tự động reload khi sửa code):**
```bash
npm run dev
```

Server sẽ lắng nghe tại: `http://localhost:5000` (hoặc `http://<IP_LAN>:5000`).

---

## 4. Danh sách các API chính

### Xác thực & Người dùng (Auth & Users)
- `POST /api/auth/register`: Đăng ký tài khoản (hỗ trợ email `@tsv.edu.vn`).
- `POST /api/auth/login`: Đăng nhập bằng username + password (tự sinh mã OTP 6 số).
- `POST /api/auth/verify-otp`: Xác thực mã OTP 6 số.
- `GET /api/users`: Lấy danh sách toàn bộ người dùng (Role Admin).

### Lớp học phần & Phiên điểm danh (Courses & Sessions)
- `GET /api/courses`: Lấy danh sách môn học.
- `POST /api/courses`: Thêm mới học phần (Role Admin).
- `PUT /api/courses/:id`: Cập nhật thông tin học phần / Micro-Quiz.
- `DELETE /api/courses/:id`: Xóa học phần.
- `POST /api/sessions/start`: Giảng viên mở phiên điểm danh với QR động 10s.

### Điểm danh & Nghỉ phép (Attendance & Leaves)
- `POST /api/attendance/check-in`: Sinh viên gửi dữ liệu điểm danh (QR Token + GPS + Face/Biometric + Quiz).
- `GET /api/attendance/logs`: Xem lịch sử điểm danh.
- `POST /api/leaves`: Sinh viên nộp đơn xin nghỉ phép.
- `PUT /api/leaves/:id`: Giảng viên duyệt / từ chối đơn nghỉ phép.
