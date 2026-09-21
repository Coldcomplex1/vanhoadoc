/* =====================================================================
   CẤU HÌNH FIREBASE - firebase-config.js
   ---------------------------------------------------------------------
   ⚠️ ĐÂY LÀ NƠI DUY NHẤT BẠN CẦN SỬA ĐỂ KẾT NỐI FIREBASE.

   Cách lấy thông tin cấu hình (xem hướng dẫn chi tiết trong HUONG-DAN.md):
   1. Vào https://console.firebase.google.com → tạo dự án mới.
   2. Bấm biểu tượng Web (</>) để "Thêm ứng dụng web".
   3. Firebase sẽ hiện ra đoạn firebaseConfig → copy các giá trị
      và DÁN THAY THẾ các dòng "THAY_..." bên dưới.

   👉 Khi CHƯA thay (vẫn còn chữ "THAY_"), website tự chạy ở
   CHẾ ĐỘ THỬ NGHIỆM: dữ liệu lưu bằng localStorage trên máy hiện tại,
   đăng nhập admin demo bằng tài khoản admin / admin@123.
===================================================================== */

const firebaseConfig = {
  apiKey:            "THAY_API_KEY",
  authDomain:        "THAY_AUTH_DOMAIN",
  projectId:         "THAY_PROJECT_ID",
  storageBucket:     "THAY_STORAGE_BUCKET",
  messagingSenderId: "THAY_MESSAGING_SENDER_ID",
  appId:             "THAY_APP_ID"
};

/* ---------------------------------------------------------------------
   Đuôi email "ảo" cho tài khoản học sinh.
   Firebase Authentication yêu cầu đăng nhập bằng email, nhưng học sinh
   tiểu học chỉ cần nhớ TÊN ĐĂNG NHẬP. Hệ thống sẽ tự ghép:
       tên đăng nhập + đuôi dưới đây → email dùng nội bộ.
   Ví dụ: "an.nguyen" → "an.nguyen@lethihonggam-krongno.edu.vn"
   (Email này KHÔNG cần tồn tại thật.)
   ⚠️ Sau khi đã có học sinh đăng ký, KHÔNG đổi giá trị này nữa,
   nếu đổi thì các tài khoản cũ sẽ không đăng nhập được.
--------------------------------------------------------------------- */
const EMAIL_DOMAIN = "lethihonggam-krongno.edu.vn";

/* ---------------------------------------------------------------------
   Tự phát hiện đã cấu hình Firebase hay chưa:
   - Đã cấu hình  → dùng Firebase (dữ liệu đồng bộ internet).
   - Chưa cấu hình → chạy chế độ thử nghiệm bằng localStorage.
--------------------------------------------------------------------- */
// Đã điền cấu hình thật chưa? (hết chữ "THAY_" là đã điền)
const FIREBASE_CONFIG_FILLED =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("THAY_");

// Dùng được Firebase khi: đã điền cấu hình VÀ thư viện Firebase tải thành công.
// (Nếu đã điền cấu hình mà thư viện không tải được - ví dụ mất mạng -
// app.js sẽ báo lỗi rõ ràng chứ không âm thầm chạy chế độ thử nghiệm.)
const FIREBASE_ENABLED =
  typeof firebase !== "undefined" && FIREBASE_CONFIG_FILLED;

if (FIREBASE_ENABLED) {
  firebase.initializeApp(firebaseConfig);
}
