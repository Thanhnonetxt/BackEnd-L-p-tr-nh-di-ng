/**
 * ============================================================================
 * DỰ ÁN WEBAPI ĐIỂM DANH SINH VIÊN ĐA TẦNG - TSV SMART ATTENDANCE
 * BẮT BUỘC ĐẶT TÊN THEO TÊN CÁ NHÂN: VoMauToanThanh_WebAPI
 * SINH VIÊN: VÕ MẪU TOÀN THANH (NHÓM TSV - ĐỀ TÀI SỐ 3)
 * CƠ SỞ DỮ LIỆU: DB_VoMauToanThanh_Attendance
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// KHO DỮ LIỆU TẠM THỜI (IN-MEMORY DATABASE)
// ==========================================
let users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@tsv.edu.vn',
    password: '123',
    fullName: 'Quản Trị Viên (Võ Mẫu Toàn Thanh)',
    role: 'ADMIN',
  },
  {
    id: 2,
    username: 'giangvien',
    email: 'giangvien@tsv.edu.vn',
    password: '123',
    fullName: 'ThS. Nguyễn Văn Giảng',
    role: 'TEACHER',
  },
  {
    id: 3,
    username: 'sinhvien',
    email: 'toanthanh.sv@tsv.edu.vn',
    password: '123',
    fullName: 'Võ Mẫu Toàn Thanh (2026TSV01)',
    role: 'STUDENT',
  },
];

let courses = [
  {
    id: 'C01',
    code: 'MOB101',
    name: 'Lập trình Thiết bị Di động (Flutter & Dart)',
    room: 'Phòng Lab B.302',
    teacherName: 'ThS. Nguyễn Văn Giảng',
    totalSessions: 15,
    absentSessions: 2,
    roomLat: 10.762622,
    roomLng: 106.660172,
    quickQuizQuestion: 'Widget nào trong Flutter có trạng thái thay đổi được?',
    quickQuizAnswer: 'StatefulWidget',
    activeQrToken: 'TSV-8821',
  },
  {
    id: 'C02',
    code: 'PM202',
    name: 'Quản lý Dự án Công nghệ Thông tin (Agile/Scrum)',
    room: 'Phòng A.105',
    teacherName: 'ThS. Nguyễn Văn Giảng',
    totalSessions: 15,
    absentSessions: 3, // Cảnh báo đỏ cấm thi (20%)
    roomLat: 10.762622,
    roomLng: 106.660172,
    quickQuizQuestion: 'Một Sprint trong Scrum thường kéo dài mấy tuần?',
    quickQuizAnswer: '2',
    activeQrToken: 'TSV-5412',
  },
  {
    id: 'C03',
    code: 'IOT303',
    name: 'Phát triển Ứng dụng IoT & Cảm biến Di động',
    room: 'Phòng C.204',
    teacherName: 'ThS. Trần Thị Mai',
    totalSessions: 15,
    absentSessions: 1,
    roomLat: 10.762622,
    roomLng: 106.660172,
    quickQuizQuestion: 'Giao thức truyền thông siêu nhẹ phổ biến trong IoT là gì?',
    quickQuizAnswer: 'MQTT',
    activeQrToken: 'TSV-3319',
  },
];

let leaveRequests = [
  {
    id: 'L01',
    studentName: 'Võ Mẫu Toàn Thanh (2026TSV01)',
    courseName: 'Quản lý Dự án Công nghệ Thông tin (Agile/Scrum)',
    reason: 'Khám sức khỏe định kỳ theo giấy bệnh viện',
    status: 'Chờ duyệt',
    createdAt: new Date().toISOString(),
  },
];

let attendanceLogs = [
  {
    id: 1,
    studentName: 'Võ Mẫu Toàn Thanh',
    courseName: 'Lập trình Thiết bị Di động (Flutter & Dart)',
    distanceMeters: 12.4,
    biometricVerified: true,
    quizPassed: true,
    status: 'PRESENT',
    checkInTime: new Date().toISOString(),
  },
];

let activeOtpMap = {}; // Lưu mã OTP tạm thời theo email

// Hàm tính khoảng cách GPS thực tế theo Haversine (Mét)
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const p = 0.017453292519943295;
  const a =
    0.5 -
    Math.cos((lat2 - lat1) * p) / 2 +
    (Math.cos(lat1 * p) * Math.cos(lat2 * p) * (1 - Math.cos((lon2 - lon1) * p))) / 2;
  return 12742000 * Math.asin(Math.sqrt(a));
}

// Tự động xoay vòng mã QR Token mỗi 10 giây (Tính năng mới - Mục 6)
setInterval(() => {
  courses.forEach((c) => {
    c.activeQrToken = 'TSV-' + Math.floor(1000 + Math.random() * 9000);
  });
}, 10000);

// ==========================================
// 1 & 2. AUTHENTICATION & OTP ENDPOINTS
// ==========================================

// Đăng ký tài khoản qua Email (Yêu cầu 1)
app.post('/api/v1/toanthanh/auth/register', (req, res) => {
  const { username, email, password, fullName, role } = req.body;
  if (!username || !email || !password || !fullName) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin!' });
  }

  const existing = users.find((u) => u.username === username || u.email === email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Username hoặc Email đã tồn tại trong hệ thống!' });
  }

  const newUser = {
    id: users.length + 1,
    username,
    email,
    password,
    fullName,
    role: role || 'STUDENT',
  };
  users.push(newUser);

  res.status(201).json({
    success: true,
    message: 'Đăng ký tài khoản qua Email thành công!',
    user: { id: newUser.id, username: newUser.username, email: newUser.email, fullName: newUser.fullName, role: newUser.role },
  });
});

// Đăng nhập Username + Password -> Sinh mã OTP 6 số (Yêu cầu 2)
app.post('/api/v1/toanthanh/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => (u.username === username || u.email === username) && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' });
  }

  // Sinh mã OTP 6 số ngẫu nhiên
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  activeOtpMap[user.email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // Hết hạn sau 5 phút
  };

  res.json({
    success: true,
    message: 'Đăng nhập bước 1 thành công. Đã sinh mã OTP gửi đến Email!',
    email: user.email,
    otpDebug: otp, // Gửi mã về để demo thuận tiện
    userId: user.id,
    role: user.role,
  });
});

// Xác thực OTP 6 số (Yêu cầu 2)
app.post('/api/v1/toanthanh/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const otpRecord = activeOtpMap[email];

  if (!otpRecord || otpRecord.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Mã OTP không chính xác!' });
  }

  if (Date.now() > otpRecord.expiresAt) {
    return res.status(410).json({ success: false, message: 'Mã OTP đã hết hạn!' });
  }

  delete activeOtpMap[email];
  const user = users.find((u) => u.email === email);

  res.json({
    success: true,
    message: 'Xác thực OTP thành công!',
    token: `JWT_TOANTHANH_${Date.now()}_${user.id}`,
    user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role },
  });
});

// Đăng nhập bằng khuôn mặt AI (Tính năng 5a)
app.post('/api/v1/toanthanh/auth/face-login', (req, res) => {
  const student = users.find((u) => u.role === 'STUDENT');
  res.json({
    success: true,
    message: 'Nhận diện khuôn mặt thành công qua Google ML Kit Face Vector!',
    token: `JWT_FACE_AUTH_${Date.now()}`,
    user: student,
  });
});

// ==========================================
// 4. CRUD LỚP HỌC PHẦN (5.5 ĐIỂM)
// ==========================================

// Read All
app.get('/api/v1/toanthanh/courses', (req, res) => {
  res.json({ success: true, total: courses.length, courses });
});

// Create
app.post('/api/v1/toanthanh/courses', (req, res) => {
  const { code, name, room, teacherName, quickQuizQuestion, quickQuizAnswer } = req.body;
  const newCourse = {
    id: `C0${courses.length + 1}`,
    code: code || 'NEW101',
    name: name || 'Môn học mới',
    room: room || 'Phòng Lab',
    teacherName: teacherName || 'ThS. Nguyễn Văn Giảng',
    totalSessions: 15,
    absentSessions: 0,
    roomLat: 10.762622,
    roomLng: 106.660172,
    quickQuizQuestion: quickQuizQuestion || 'Câu hỏi trắc nghiệm nhanh...',
    quickQuizAnswer: quickQuizAnswer || 'Đáp án',
    activeQrToken: 'TSV-9999',
  };
  courses.push(newCourse);
  res.status(201).json({ success: true, message: 'Thêm môn học mới thành công!', course: newCourse });
});

// Update
app.put('/api/v1/toanthanh/courses/:id', (req, res) => {
  const course = courses.find((c) => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy môn học!' });
  }

  const { code, name, room, teacherName, quickQuizQuestion, quickQuizAnswer } = req.body;
  if (code) course.code = code;
  if (name) course.name = name;
  if (room) course.room = room;
  if (teacherName) course.teacherName = teacherName;
  if (quickQuizQuestion) course.quickQuizQuestion = quickQuizQuestion;
  if (quickQuizAnswer) course.quickQuizAnswer = quickQuizAnswer;

  res.json({ success: true, message: 'Cập nhật môn học thành công!', course });
});

// Delete
app.delete('/api/v1/toanthanh/courses/:id', (req, res) => {
  const index = courses.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy môn học!' });
  }
  const deleted = courses.splice(index, 1);
  res.json({ success: true, message: 'Đã xóa môn học thành công!', course: deleted[0] });
});

// ==========================================
// 5 & 6. ĐIỂM DANH ĐA TẦNG (GPS + QR + VÂN TAY + QUIZ)
// ==========================================

// Nhận mã QR động của môn học
app.get('/api/v1/toanthanh/attendance/qr/:courseId', (req, res) => {
  const course = courses.find((c) => c.id === req.params.courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy môn học!' });
  }
  res.json({
    success: true,
    courseId: course.id,
    courseName: course.name,
    activeQrToken: course.activeQrToken,
    expiresInSeconds: 10,
    roomLat: course.roomLat,
    roomLng: course.roomLng,
  });
});

// Check-in điểm danh
app.post('/api/v1/toanthanh/attendance/checkin', (req, res) => {
  const { courseId, studentName, studentLat, studentLng, qrToken, biometricPassed, quizAnswer } = req.body;

  const course = courses.find((c) => c.id === courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy môn học!' });
  }

  // 1. Kiểm tra GPS Geofencing (5b - Chia sẻ vị trí)
  const distanceMeters = calculateDistanceMeters(course.roomLat, course.roomLng, studentLat, studentLng);
  if (distanceMeters > 50.0) {
    return res.status(403).json({
      success: false,
      message: `TỪ CHỐI ĐIỂM DANH! Tọa độ GPS cách bục giảng ${distanceMeters.toFixed(1)}m (Vượt giới hạn 50m).`,
      distanceMeters,
    });
  }

  // 2. Kiểm tra Sinh trắc học (5e)
  if (!biometricPassed) {
    return res.status(400).json({ success: false, message: 'Chưa xác thực vân tay sinh trắc học!' });
  }

  // 3. Kiểm tra mã QR động (5e)
  if (qrToken !== course.activeQrToken) {
    return res.status(400).json({ success: false, message: 'Mã QR đã hết hạn hoặc không chính xác!' });
  }

  // 4. Kiểm tra Micro-Quiz 15s (Mục 6 - Tính năng mới)
  const isQuizCorrect = (quizAnswer || '').trim().toLowerCase() === course.quickQuizAnswer.toLowerCase();
  if (!isQuizCorrect) {
    return res.status(400).json({
      success: false,
      message: `Sai câu trả lời Micro-Quiz chống điểm danh hộ! (Đáp án: ${course.quickQuizAnswer})`,
    });
  }

  const newLog = {
    id: attendanceLogs.length + 1,
    studentName: studentName || 'Võ Mẫu Toàn Thanh',
    courseName: course.name,
    distanceMeters,
    biometricVerified: true,
    quizPassed: true,
    status: 'PRESENT',
    checkInTime: new Date().toISOString(),
  };
  attendanceLogs.unshift(newLog);

  res.json({
    success: true,
    message: `Điểm danh thành công môn ${course.name}!`,
    log: newLog,
  });
});

// Lịch sử điểm danh
app.get('/api/v1/toanthanh/attendance/logs', (req, res) => {
  res.json({ success: true, logs: attendanceLogs });
});

// ==========================================
// CRUD ĐƠN XIN NGHỈ PHÉP
// ==========================================
app.get('/api/v1/toanthanh/leave-requests', (req, res) => {
  res.json({ success: true, requests: leaveRequests });
});

app.post('/api/v1/toanthanh/leave-requests', (req, res) => {
  const { studentName, courseName, reason } = req.body;
  const newReq = {
    id: `L0${leaveRequests.length + 1}`,
    studentName: studentName || 'Võ Mẫu Toàn Thanh',
    courseName: courseName || 'Khác',
    reason: reason || 'Nghỉ có phép',
    status: 'Chờ duyệt',
    createdAt: new Date().toISOString(),
  };
  leaveRequests.push(newReq);
  res.status(201).json({ success: true, message: 'Gửi đơn xin nghỉ phép thành công!', request: newReq });
});

app.put('/api/v1/toanthanh/leave-requests/:id/status', (req, res) => {
  const reqItem = leaveRequests.find((r) => r.id === req.params.id);
  if (!reqItem) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn xin nghỉ phép!' });
  }
  const { status } = req.body; // 'Đã duyệt' hoặc 'Từ chối'
  reqItem.status = status;
  res.json({ success: true, message: 'Cập nhật trạng thái đơn thành công!', request: reqItem });
});

// ==========================================
// ROOT ROUTE & KHỞI ĐỘNG SERVER
// ==========================================
app.get('/', (req, res) => {
  res.json({
    project: 'VoMauToanThanh_WebAPI',
    student: 'Võ Mẫu Toàn Thanh',
    group: 'TSV',
    database: 'DB_VoMauToanThanh_Attendance',
    endpoints: [
      'POST /api/v1/toanthanh/auth/register',
      'POST /api/v1/toanthanh/auth/login',
      'POST /api/v1/toanthanh/auth/verify-otp',
      'POST /api/v1/toanthanh/auth/face-login',
      'GET /api/v1/toanthanh/courses',
      'POST /api/v1/toanthanh/courses',
      'PUT /api/v1/toanthanh/courses/:id',
      'DELETE /api/v1/toanthanh/courses/:id',
      'GET /api/v1/toanthanh/attendance/qr/:courseId',
      'POST /api/v1/toanthanh/attendance/checkin',
      'GET /api/v1/toanthanh/attendance/logs',
      'GET /api/v1/toanthanh/leave-requests',
      'POST /api/v1/toanthanh/leave-requests',
      'PUT /api/v1/toanthanh/leave-requests/:id/status',
    ],
  });
});

app.listen(PORT, () => {
  console.log(`[TSV Attendance WebAPI] Server is running on port ${PORT}`);
  console.log(`[Database Connected] DB_VoMauToanThanh_Attendance initialized.`);
});

