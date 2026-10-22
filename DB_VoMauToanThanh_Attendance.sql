-- ============================================================================
-- TRƯỜNG ĐẠI HỌC - BÀI TẬP LỚN LẬP TRÌNH THIẾT BỊ DI ĐỘNG (FLUTTER & DART)
-- ĐỀ TÀI SỐ 3: HỆ THỐNG ĐIỂM DANH SINH VIÊN ĐA TẦNG (TSV SMART ATTENDANCE)
-- SINH VIÊN THỰC HIỆN: VÕ MẪU TOÀN THANH (NHÓM TSV)
-- TÊN CƠ SỞ DỮ LIỆU BẮT BUỘC THEO TÊN CÁ NHÂN: DB_VoMauToanThanh_Attendance
-- ============================================================================

CREATE DATABASE IF NOT EXISTS DB_VoMauToanThanh_Attendance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE DB_VoMauToanThanh_Attendance;

-- 1. Bảng Tài khoản Người dùng (Admin, Giảng viên / Nhân viên, Sinh viên)
CREATE TABLE IF NOT EXISTS Users (
    UserId INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Role VARCHAR(20) NOT NULL, -- 'ADMIN', 'TEACHER', 'STUDENT'
    FaceIdToken VARCHAR(255) NULL,
    OtpCode VARCHAR(6) NULL,
    OtpExpiry DATETIME NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Lớp học phần (CRUD Mục 4 - 5.5 Điểm)
CREATE TABLE IF NOT EXISTS ClassCourses (
    CourseId INT PRIMARY KEY AUTO_INCREMENT,
    CourseCode VARCHAR(20) NOT NULL,
    CourseName NVARCHAR(150) NOT NULL,
    RoomName NVARCHAR(50) NOT NULL,
    TeacherId INT NOT NULL,
    TotalSessions INT DEFAULT 15,
    RoomLat DOUBLE DEFAULT 10.762622,
    RoomLng DOUBLE DEFAULT 106.660172,
    QuickQuizQuestion NVARCHAR(255) DEFAULT 'Widget nào trong Flutter có trạng thái thay đổi được?',
    QuickQuizAnswer NVARCHAR(100) DEFAULT 'StatefulWidget',
    FOREIGN KEY (TeacherId) REFERENCES Users(UserId) ON DELETE CASCADE
);

-- 3. Bảng Phiên điểm danh thời gian thực (QR động 10s + GPS Geofencing + Micro-Quiz)
CREATE TABLE IF NOT EXISTS AttendanceSessions (
    SessionId INT PRIMARY KEY AUTO_INCREMENT,
    CourseId INT NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    TeacherLat DOUBLE NOT NULL,
    TeacherLng DOUBLE NOT NULL,
    AllowedRadiusMeters DOUBLE DEFAULT 50.0,
    ActiveQrToken VARCHAR(50) NOT NULL,
    QuizQuestion NVARCHAR(255) NULL,
    QuizCorrectAnswer NVARCHAR(100) NULL,
    IsOpen BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (CourseId) REFERENCES ClassCourses(CourseId) ON DELETE CASCADE
);

-- 4. Bảng Kết quả Điểm danh của Sinh viên (Mục 5 & 6)
CREATE TABLE IF NOT EXISTS AttendanceLogs (
    LogId INT PRIMARY KEY AUTO_INCREMENT,
    SessionId INT NOT NULL,
    StudentId INT NOT NULL,
    CheckInTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    StudentLat DOUBLE NOT NULL,
    StudentLng DOUBLE NOT NULL,
    DistanceMeters DOUBLE NOT NULL,
    BiometricVerified BOOLEAN DEFAULT FALSE,
    QuizPassed BOOLEAN DEFAULT FALSE,
    Status VARCHAR(20) NOT NULL, -- 'PRESENT' (Có mặt), 'LATE' (Đi trễ), 'ABSENT' (Vắng)
    FOREIGN KEY (SessionId) REFERENCES AttendanceSessions(SessionId) ON DELETE CASCADE,
    FOREIGN KEY (StudentId) REFERENCES Users(UserId) ON DELETE CASCADE
);

-- 5. Bảng Đơn xin Nghỉ phép (CRUD Đơn từ Sinh viên & Giảng viên duyệt)
CREATE TABLE IF NOT EXISTS LeaveRequests (
    RequestId INT PRIMARY KEY AUTO_INCREMENT,
    StudentId INT NOT NULL,
    CourseId INT NOT NULL,
    Reason NVARCHAR(255) NOT NULL,
    Status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (StudentId) REFERENCES Users(UserId) ON DELETE CASCADE,
    FOREIGN KEY (CourseId) REFERENCES ClassCourses(CourseId) ON DELETE CASCADE
);

-- DỮ LIỆU KHỞI TẠO MẪU (SEED DATA CHO THUYẾT TRÌNH DEMO)
INSERT INTO Users (Username, Email, PasswordHash, FullName, Role) VALUES
('admin', 'admin@tsv.edu.vn', '123', 'Quản Trị Viên (Võ Mẫu Toàn Thanh)', 'ADMIN'),
('giangvien', 'giangvien@tsv.edu.vn', '123', 'ThS. Nguyễn Văn Giảng', 'TEACHER'),
('sinhvien', 'toanthanh.sv@tsv.edu.vn', '123', 'Võ Mẫu Toàn Thanh (2026TSV01)', 'STUDENT');

INSERT INTO ClassCourses (CourseCode, CourseName, RoomName, TeacherId, TotalSessions, RoomLat, RoomLng, QuickQuizQuestion, QuickQuizAnswer) VALUES
('MOB101', 'Lập trình Thiết bị Di động (Flutter & Dart)', 'Phòng Lab B.302', 2, 15, 10.762622, 106.660172, 'Widget nào trong Flutter có trạng thái thay đổi được?', 'StatefulWidget'),
('PM202', 'Quản lý Dự án Công nghệ Thông tin (Agile/Scrum)', 'Phòng A.105', 2, 15, 10.762622, 106.660172, 'Một Sprint trong Scrum thường kéo dài mấy tuần?', '2'),
('IOT303', 'Phát triển Ứng dụng IoT & Cảm biến Di động', 'Phòng C.204', 2, 15, 10.762622, 106.660172, 'Giao thức truyền thông siêu nhẹ phổ biến trong IoT là gì?', 'MQTT');

INSERT INTO LeaveRequests (StudentId, CourseId, Reason, Status) VALUES
(3, 2, 'Khám sức khỏe định kỳ có giấy bệnh viện', 'PENDING');
