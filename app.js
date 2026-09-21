/* =====================================================================
   HỆ THỐNG ĐẠI SỨ VĂN HÓA ĐỌC - app.js
   Trường Tiểu học Lê Thị Hồng Gấm (Xã Krông Nô)
   ---------------------------------------------------------------------
   Cấu trúc file:
   1. Cấu hình điểm & danh hiệu (dễ chỉnh sửa mốc điểm)
   2. Hàm tiện ích chung
   3. Lớp lưu trữ dữ liệu (Store):
      - FirebaseStore : dùng Firebase Auth + Firestore (dữ liệu online)
      - LocalStore    : chế độ thử nghiệm bằng localStorage (1 máy)
      → Cả hai có CÙNG bộ hàm, nên phần giao diện không cần biết
        dữ liệu đang lưu ở đâu.
   4. Xử lý đăng nhập / đăng ký / đăng xuất
   5. Điều hướng giữa các trang (SPA)
   6. Vẽ giao diện từng trang (trang chủ, nhật ký, thư viện, video,
      bảng điểm, quản trị)
   7. Khởi động ứng dụng
===================================================================== */

"use strict";

/* =====================================================================
   1. CẤU HÌNH ĐIỂM & DANH HIỆU
   → Muốn đổi mốc điểm/danh hiệu, chỉ cần sửa ở đây.
===================================================================== */

// Mỗi lần ghi nhật ký 1 cuốn sách được cộng bao nhiêu điểm
const DIEM_MOI_CUON_SACH = 10;

// Danh sách danh hiệu, xếp theo mốc điểm TĂNG DẦN
const DANH_HIEU = [
  { diemToiThieu: 0,  icon: "🌱", ten: "Người đọc mới" },
  { diemToiThieu: 20, icon: "📘", ten: "Người truyền cảm hứng" },
  { diemToiThieu: 50, icon: "🌟", ten: "Đại sứ văn hóa đọc" },
];

// Tài khoản admin DEMO - CHỈ dùng ở chế độ thử nghiệm (chưa có Firebase).
// Khi đã dùng Firebase, tài khoản admin được tạo trong Firestore
// với role = "admin" (xem hướng dẫn trong HUONG-DAN.md).
const ADMIN_DEMO = { username: "admin", password: "admin@123" };

/** Trả về danh hiệu tương ứng với số điểm */
function xetDanhHieu(diem) {
  let kq = DANH_HIEU[0];
  for (const moc of DANH_HIEU) {
    if (diem >= moc.diemToiThieu) kq = moc;
  }
  return kq;
}

/** Tính % tiến trình tới danh hiệu tiếp theo */
function tinhTienTrinh(diem) {
  const mocSau = DANH_HIEU.find(m => m.diemToiThieu > diem);
  if (!mocSau) {
    return { phanTram: 100, moTa: "🎉 Em đã đạt danh hiệu cao nhất! Hãy tiếp tục đọc sách nhé!" };
  }
  const mocTruoc = [...DANH_HIEU].reverse().find(m => m.diemToiThieu <= diem);
  const phanTram = Math.round(
    ((diem - mocTruoc.diemToiThieu) / (mocSau.diemToiThieu - mocTruoc.diemToiThieu)) * 100
  );
  return {
    phanTram,
    moTa: `Em có ${diem} điểm. Còn ${mocSau.diemToiThieu - diem} điểm nữa để đạt ${mocSau.icon} ${mocSau.ten}!`,
  };
}

/* =====================================================================
   2. HÀM TIỆN ÍCH CHUNG
===================================================================== */

/** Chọn nhanh phần tử theo CSS selector */
function $(chon) { return document.querySelector(chon); }

/** Chống chèn mã HTML độc hại khi hiển thị dữ liệu người dùng nhập */
function esc(chuoi) {
  return String(chuoi ?? "").replace(/[&<>"']/g, ky => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ky]));
}

/** Hiện hộp thông báo nhỏ ở cuối màn hình */
let toastHenGio = null;
function toast(noiDung, laLoi = false) {
  const hop = $("#toast");
  hop.textContent = noiDung;
  hop.classList.toggle("error", laLoi);
  hop.classList.add("show");
  clearTimeout(toastHenGio);
  toastHenGio = setTimeout(() => hop.classList.remove("show"), 3500);
}

/** Đổi mốc thời gian (ms hoặc Timestamp của Firestore) → số ms */
function thoiGianMs(gt) {
  if (gt == null) return null;
  if (typeof gt === "number") return gt;
  if (typeof gt.toDate === "function") return gt.toDate().getTime();
  if (typeof gt.seconds === "number") return gt.seconds * 1000;
  return null;
}

/** Định dạng ngày giờ kiểu Việt Nam: 05/07/2026 14:30 */
function dinhDangNgay(ms) {
  if (!ms) return "Chưa có";
  return new Date(ms).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** Ghép tên đăng nhập thành email nội bộ cho Firebase Auth */
function taoEmail(username) {
  return `${username}@${EMAIL_DOMAIN}`;
}

/** Kiểm tra tên đăng nhập hợp lệ (chữ thường, số, dấu . _ - ở giữa).
    Không cho dấu ở đầu/cuối hoặc 2 dấu liền nhau, vì tên này sẽ được
    ghép thành email nội bộ cho Firebase - email sai định dạng sẽ bị từ chối. */
function kiemTraUsername(username) {
  return username.length >= 3 && username.length <= 20
    && /^[a-z0-9]+([._-][a-z0-9]+)*$/.test(username);
}

/** Tạo link ảnh QR tự động từ link sách (dùng API miễn phí qrserver.com) */
function taoQRTuLink(link) {
  return "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(link);
}

/** Lấy mã video (ID 11 ký tự) từ link YouTube đủ các dạng */
function layYouTubeID(link) {
  if (!link) return null;
  const cacMau = [
    /youtube\.com\/watch\?.*v=([\w-]{11})/,   // youtube.com/watch?v=XXX
    /youtu\.be\/([\w-]{11})/,                 // youtu.be/XXX
    /youtube\.com\/embed\/([\w-]{11})/,       // youtube.com/embed/XXX
    /youtube\.com\/shorts\/([\w-]{11})/,      // youtube.com/shorts/XXX
    /youtube\.com\/live\/([\w-]{11})/,        // youtube.com/live/XXX
  ];
  for (const mau of cacMau) {
    const kq = String(link).match(mau);
    if (kq) return kq[1];
  }
  return null;
}

/** Đọc/ghi JSON trong localStorage (dùng cho chế độ thử nghiệm) */
function docJSON(khoa, macDinh) {
  try { return JSON.parse(localStorage.getItem(khoa)) ?? macDinh; }
  catch { return macDinh; }
}
function ghiJSON(khoa, giaTri) {
  localStorage.setItem(khoa, JSON.stringify(giaTri));
}

/* =====================================================================
   3. LỚP LƯU TRỮ DỮ LIỆU (STORE)
===================================================================== */

// Kết nối Firebase (chỉ khi đã cấu hình trong firebase-config.js)
const fbAuth = FIREBASE_ENABLED ? firebase.auth() : null;
const fbDB   = FIREBASE_ENABLED ? firebase.firestore() : null;

/* ------------------------------------------------------------------
   3a. FIREBASE STORE - dữ liệu online, đồng bộ mọi thiết bị
------------------------------------------------------------------- */
const FirebaseStore = {

  /** Chuẩn hóa hồ sơ đọc từ Firestore về dạng dùng trong giao diện */
  _chuanHoaHoSo(uid, duLieu) {
    return {
      uid,
      username: duLieu.username || "",
      displayName: duLieu.displayName || duLieu.username || "Học sinh",
      role: duLieu.role === "admin" ? "admin" : "student",
      score: duLieu.score || 0,
      bookCount: duLieu.bookCount || 0,
      updatedAt: thoiGianMs(duLieu.updatedAt),
    };
  },

  /** Lấy hồ sơ người dùng; nếu chưa có (tạo tay trong console) thì tạo mới */
  async layHoSo(user) {
    const ref = fbDB.collection("users").doc(user.uid);
    const snap = await ref.get();
    if (snap.exists) return this._chuanHoaHoSo(user.uid, snap.data());

    // Tài khoản có trong Authentication nhưng chưa có hồ sơ Firestore
    const username = (user.email || "").split("@")[0];
    await ref.set({
      username,
      displayName: username,
      role: "student",
      score: 0,
      bookCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { uid: user.uid, username, displayName: username, role: "student", score: 0, bookCount: 0, updatedAt: Date.now() };
  },

  /** Đăng ký tài khoản học sinh mới */
  async register({ username, displayName, password }) {
    const cred = await fbAuth.createUserWithEmailAndPassword(taoEmail(username), password);
    await fbDB.collection("users").doc(cred.user.uid).set({
      username,
      displayName,
      role: "student", // học sinh; muốn có admin xem hướng dẫn HUONG-DAN.md
      score: 0,
      bookCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return { uid: cred.user.uid, username, displayName, role: "student", score: 0, bookCount: 0, updatedAt: Date.now() };
  },

  /** Đăng nhập bằng tên đăng nhập + mật khẩu */
  async login({ username, password }) {
    const cred = await fbAuth.signInWithEmailAndPassword(taoEmail(username), password);
    return this.layHoSo(cred.user);
  },

  async logout() { await fbAuth.signOut(); },

  /** Thêm 1 bài nhật ký đọc sách + cộng điểm (ghi chung 1 lượt cho an toàn) */
  async addJournalEntry(hoSo, { bookName, feeling }) {
    const userRef = fbDB.collection("users").doc(hoSo.uid);
    const entryRef = userRef.collection("journal").doc();
    const batch = fbDB.batch();
    batch.set(entryRef, {
      bookName,
      feeling,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    batch.set(userRef, {
      score: firebase.firestore.FieldValue.increment(DIEM_MOI_CUON_SACH),
      bookCount: firebase.firestore.FieldValue.increment(1),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    await batch.commit();
    return {
      score: (hoSo.score || 0) + DIEM_MOI_CUON_SACH,
      bookCount: (hoSo.bookCount || 0) + 1,
      updatedAt: Date.now(),
    };
  },

  /** Lấy danh sách nhật ký của 1 học sinh (mới nhất trước).
      Sắp xếp phía trình duyệt thay vì orderBy để tài liệu lỡ thiếu
      trường createdAt (thêm tay trong console) vẫn hiển thị. */
  async getJournal(hoSo) {
    const snap = await fbDB.collection("users").doc(hoSo.uid)
      .collection("journal").get();
    return snap.docs.map(d => ({
      id: d.id,
      bookName: d.data().bookName || "",
      feeling: d.data().feeling || "",
      createdAt: thoiGianMs(d.data().createdAt),
    })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  /** Thư viện số */
  async getLibrary() {
    const snap = await fbDB.collection("library").get();
    return snap.docs.map(d => ({ id: d.id, title: d.data().title, link: d.data().link, qr: d.data().qr || "", createdAt: thoiGianMs(d.data().createdAt) }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },
  async addLibraryBook({ title, link, qr }) {
    await fbDB.collection("library").add({
      title, link, qr: qr || "",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  },
  async deleteLibraryBook(id) {
    await fbDB.collection("library").doc(id).delete();
  },

  /** Video giới thiệu sách */
  async getVideos() {
    const snap = await fbDB.collection("videos").get();
    return snap.docs.map(d => ({ id: d.id, title: d.data().title, youtubeId: d.data().youtubeId, createdAt: thoiGianMs(d.data().createdAt) }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },
  async addVideo({ title, youtubeId }) {
    await fbDB.collection("videos").add({
      title, youtubeId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  },
  async deleteVideo(id) {
    await fbDB.collection("videos").doc(id).delete();
  },

  /** Danh sách toàn bộ học sinh (dùng cho bảng vàng + bảng thống kê) */
  async getAllStudents() {
    const snap = await fbDB.collection("users").where("role", "==", "student").get();
    return snap.docs.map(d => this._chuanHoaHoSo(d.id, d.data()));
  },
};

/* ------------------------------------------------------------------
   3b. LOCAL STORE - chế độ thử nghiệm (localStorage, chỉ lưu 1 máy)
   Dữ liệu lưu dạng JSON có cấu trúc (không lưu HTML như bản cũ).
------------------------------------------------------------------- */
const LocalStore = {

  _layUsers() { return docJSON("vhd_users", {}); },
  _ghiUsers(users) { ghiJSON("vhd_users", users); },

  _hoSoTuUser(u) {
    return {
      uid: u.username,
      username: u.username,
      displayName: u.displayName || u.username,
      role: u.role === "admin" ? "admin" : "student",
      score: u.score || 0,
      bookCount: u.bookCount || 0,
      updatedAt: u.updatedAt || null,
    };
  },

  async register({ username, displayName, password }) {
    const users = this._layUsers();
    if (users[username] || username === ADMIN_DEMO.username) {
      const loi = new Error("Tên đăng nhập đã tồn tại, em hãy chọn tên khác nhé.");
      loi.code = "auth/email-already-in-use";
      throw loi;
    }
    users[username] = {
      username, displayName, password,
      role: "student", score: 0, bookCount: 0,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    this._ghiUsers(users);
  },

  async login({ username, password }) {
    const users = this._layUsers();

    // Tài khoản admin demo (chỉ có ở chế độ thử nghiệm)
    if (username === ADMIN_DEMO.username && password === ADMIN_DEMO.password) {
      if (!users[username]) {
        users[username] = {
          username, displayName: "Quản trị viên", password,
          role: "admin", score: 0, bookCount: 0,
          createdAt: Date.now(), updatedAt: Date.now(),
        };
        this._ghiUsers(users);
      }
      localStorage.setItem("vhd_session", username);
      return this._hoSoTuUser(users[username]);
    }

    const u = users[username];
    if (!u || u.password !== password) {
      throw new Error("Sai tên đăng nhập hoặc mật khẩu.");
    }
    localStorage.setItem("vhd_session", username);
    return this._hoSoTuUser(u);
  },

  async logout() { localStorage.removeItem("vhd_session"); },

  /** Khôi phục phiên đăng nhập khi mở lại trang */
  async getCurrentProfile() {
    const username = localStorage.getItem("vhd_session");
    if (!username) return null;
    const u = this._layUsers()[username];
    return u ? this._hoSoTuUser(u) : null;
  },

  async addJournalEntry(hoSo, { bookName, feeling }) {
    const khoa = "vhd_journal_" + hoSo.username;
    const ds = docJSON(khoa, []);
    ds.unshift({
      id: "nk" + Date.now(),
      bookName, feeling,
      createdAt: Date.now(),
    });
    ghiJSON(khoa, ds);

    const users = this._layUsers();
    const u = users[hoSo.username];
    if (u) {
      u.score = (u.score || 0) + DIEM_MOI_CUON_SACH;
      u.bookCount = (u.bookCount || 0) + 1;
      u.updatedAt = Date.now();
      this._ghiUsers(users);
      return { score: u.score, bookCount: u.bookCount, updatedAt: u.updatedAt };
    }
    return {
      score: (hoSo.score || 0) + DIEM_MOI_CUON_SACH,
      bookCount: (hoSo.bookCount || 0) + 1,
      updatedAt: Date.now(),
    };
  },

  async getJournal(hoSo) {
    return docJSON("vhd_journal_" + hoSo.username, []);
  },

  async getLibrary() { return docJSON("vhd_library", []); },
  async addLibraryBook({ title, link, qr }) {
    const ds = docJSON("vhd_library", []);
    ds.unshift({ id: "s" + Date.now(), title, link, qr: qr || "", createdAt: Date.now() });
    ghiJSON("vhd_library", ds);
  },
  async deleteLibraryBook(id) {
    ghiJSON("vhd_library", docJSON("vhd_library", []).filter(s => s.id !== id));
  },

  async getVideos() { return docJSON("vhd_videos", []); },
  async addVideo({ title, youtubeId }) {
    const ds = docJSON("vhd_videos", []);
    ds.unshift({ id: "v" + Date.now(), title, youtubeId, createdAt: Date.now() });
    ghiJSON("vhd_videos", ds);
  },
  async deleteVideo(id) {
    ghiJSON("vhd_videos", docJSON("vhd_videos", []).filter(v => v.id !== id));
  },

  async getAllStudents() {
    return Object.values(this._layUsers())
      .filter(u => u.role !== "admin")
      .map(u => this._hoSoTuUser(u));
  },
};

// Chọn nơi lưu dữ liệu: có Firebase thì dùng Firebase, chưa có thì localStorage
const Store = FIREBASE_ENABLED ? FirebaseStore : LocalStore;

/* =====================================================================
   4. ĐĂNG NHẬP / ĐĂNG KÝ / ĐĂNG XUẤT
===================================================================== */

let nguoiDung = null;          // hồ sơ người đang đăng nhập
let boQuaAuthListener = false; // true khi form đang tự xử lý (tránh chạy 2 lần)

/** Dịch lỗi Firebase sang tiếng Việt dễ hiểu */
function dichLoi(err) {
  const bang = {
    "auth/email-already-in-use": "Tên đăng nhập đã tồn tại, em hãy chọn tên khác nhé.",
    "auth/invalid-email": "Tên đăng nhập không hợp lệ (chỉ dùng chữ thường, số, dấu chấm).",
    "auth/user-not-found": "Không tìm thấy tài khoản. Em kiểm tra lại tên đăng nhập nhé.",
    "auth/wrong-password": "Sai mật khẩu. Em thử lại nhé.",
    "auth/invalid-credential": "Sai tên đăng nhập hoặc mật khẩu.",
    "auth/invalid-login-credentials": "Sai tên đăng nhập hoặc mật khẩu.",
    "auth/weak-password": "Mật khẩu quá ngắn, cần ít nhất 6 ký tự.",
    "auth/too-many-requests": "Nhập sai quá nhiều lần, em chờ vài phút rồi thử lại nhé.",
    "auth/network-request-failed": "Lỗi kết nối mạng. Em kiểm tra internet rồi thử lại.",
    "auth/operation-not-allowed": "Hệ thống chưa bật đăng nhập Email/Password trong Firebase (xem HUONG-DAN.md).",
    "auth/user-disabled": "Tài khoản này đã bị khóa. Em hãy báo với thầy cô nhé.",
    // Lỗi Firestore
    "permission-denied": "Em không có quyền làm thao tác này.",
    "unavailable": "Máy chủ đang bận hoặc mất mạng. Em thử lại sau nhé.",
    "deadline-exceeded": "Kết nối quá chậm. Em thử lại sau nhé.",
  };
  return bang[err?.code] || err?.message || "Có lỗi xảy ra, em thử lại nhé.";
}

/** Hiện thông báo trong form (đỏ = lỗi, xanh = thành công) */
function baoForm(idPhanTu, noiDung, laLoi = true) {
  const p = $(idPhanTu);
  p.textContent = noiDung;
  p.className = "form-message " + (laLoi ? "error" : "success");
}

/** Chuyển qua lại giữa 2 tab Đăng nhập / Đăng ký */
function chonTab(tab) {
  const laDangNhap = tab === "login";
  $("#tabLogin").classList.toggle("active", laDangNhap);
  $("#tabRegister").classList.toggle("active", !laDangNhap);
  $("#tabLogin").setAttribute("aria-selected", laDangNhap);
  $("#tabRegister").setAttribute("aria-selected", !laDangNhap);
  $("#loginForm").hidden = !laDangNhap;
  $("#registerForm").hidden = laDangNhap;
  baoForm("#loginMessage", "");
  baoForm("#registerMessage", "");
}

/** Xử lý bấm nút Đăng nhập */
async function xuLyDangNhap(e) {
  e.preventDefault();
  const username = $("#loginUsername").value.trim().toLowerCase();
  const password = $("#loginPassword").value;
  if (!username || !password) {
    baoForm("#loginMessage", "Em hãy nhập đủ tên đăng nhập và mật khẩu.");
    return;
  }

  const nut = $("#loginForm button[type=submit]");
  nut.disabled = true;
  boQuaAuthListener = true;
  try {
    const hoSo = await Store.login({ username, password });
    vaoUngDung(hoSo);
    toast(`Chào mừng ${hoSo.displayName}! 👋`);
  } catch (err) {
    // Nếu đã đăng nhập Firebase thành công nhưng đọc hồ sơ bị lỗi mạng,
    // thoát hẳn ra để lần bấm sau đăng nhập lại từ đầu (tránh kẹt phiên)
    if (FIREBASE_ENABLED && fbAuth.currentUser) {
      try { await fbAuth.signOut(); } catch (e) { console.error(e); }
    }
    baoForm("#loginMessage", dichLoi(err));
  } finally {
    nut.disabled = false;
    boQuaAuthListener = false;
  }
}

/** Xử lý bấm nút Đăng ký */
async function xuLyDangKy(e) {
  e.preventDefault();
  const displayName = $("#regName").value.trim();
  const username = $("#regUsername").value.trim().toLowerCase();
  const password = $("#regPassword").value;

  if (!displayName || displayName.length < 2) {
    baoForm("#registerMessage", "Em hãy nhập họ và tên đầy đủ.");
    return;
  }
  if (!kiemTraUsername(username)) {
    baoForm("#registerMessage", "Tên đăng nhập từ 3-20 ký tự: chữ thường không dấu, số, dấu chấm. Ví dụ: an.nguyen");
    return;
  }
  if (password.length < 6) {
    baoForm("#registerMessage", "Mật khẩu cần ít nhất 6 ký tự.");
    return;
  }

  const nut = $("#registerForm button[type=submit]");
  nut.disabled = true;
  boQuaAuthListener = true;
  try {
    if (FIREBASE_ENABLED) {
      // Firebase: tạo tài khoản xong là đăng nhập luôn
      const hoSo = await Store.register({ username, displayName, password });
      vaoUngDung(hoSo);
    } else {
      await Store.register({ username, displayName, password });
      const hoSo = await Store.login({ username, password });
      vaoUngDung(hoSo);
    }
    toast(`Đăng ký thành công! Chào mừng ${displayName} 🎉`);
  } catch (err) {
    baoForm("#registerMessage", dichLoi(err));
  } finally {
    nut.disabled = false;
    boQuaAuthListener = false;
  }
}

/** Đăng xuất */
async function xuLyDangXuat() {
  try { await Store.logout(); } catch (err) { console.error(err); }
  hienManHinhDangNhap();
}

/** Vào ứng dụng chính sau khi đã có hồ sơ người dùng */
function vaoUngDung(hoSo) {
  nguoiDung = hoSo;
  const laAdmin = hoSo.role === "admin";

  $("#authScreen").hidden = true;
  $("#appScreen").hidden = false;
  $("#navAdmin").hidden = !laAdmin;
  $("#demoBar").hidden = FIREBASE_ENABLED;
  $("#userChip").textContent = (laAdmin ? "👑 " : "🧒 ") + (hoSo.displayName || hoSo.username);

  // Học sinh vào Trang chủ, admin vào thẳng khu quản trị
  chuyenTrang(laAdmin ? "admin" : "home");
}

/** Quay về màn hình đăng nhập */
function hienManHinhDangNhap() {
  nguoiDung = null;
  $("#appScreen").hidden = true;
  $("#authScreen").hidden = false;
  $("#loginPassword").value = "";
  baoForm("#loginMessage", "");
  chonTab("login");
}

/* =====================================================================
   5. ĐIỀU HƯỚNG GIỮA CÁC TRANG
===================================================================== */

const DS_TRANG = ["home", "journal", "library", "videos", "scores", "admin"];

function chuyenTrang(ten) {
  if (!DS_TRANG.includes(ten)) ten = "home";
  // Chặn học sinh mở trang quản trị
  if (ten === "admin" && nguoiDung?.role !== "admin") ten = "home";

  DS_TRANG.forEach(t => { $("#page-" + t).hidden = (t !== ten); });

  document.querySelectorAll(".nav-link").forEach(a => {
    a.classList.toggle("active", a.dataset.page === ten);
  });

  // Đóng menu điện thoại sau khi chọn
  $("#mainNav").classList.remove("open");
  $("#btnMenu").setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0 });

  // Tải dữ liệu cho trang vừa mở
  if (ten === "home") veTrangChu();
  if (ten === "journal") taiNhatKy();
  if (ten === "library") taiThuVien();
  if (ten === "videos") taiVideo();
  if (ten === "scores") taiBangDiem();
  if (ten === "admin") taiThongKe();
}

/* =====================================================================
   6. VẼ GIAO DIỆN TỪNG TRANG
===================================================================== */

/* ---------- 6a. TRANG CHỦ ---------- */
function veTrangChu() {
  if (!nguoiDung) return;
  const dh = xetDanhHieu(nguoiDung.score);
  $("#homeName").textContent = nguoiDung.displayName;
  $("#statBooks").textContent = nguoiDung.bookCount;
  $("#statScore").textContent = nguoiDung.score;
  $("#statBadge").textContent = `${dh.icon} ${dh.ten}`;

  const tt = tinhTienTrinh(nguoiDung.score);
  $("#progressFill").style.width = tt.phanTram + "%";
  $("#progressText").textContent = tt.moTa;
}

/* ---------- 6b. NHẬT KÝ ĐỌC SÁCH ---------- */
async function taiNhatKy() {
  const hop = $("#journalList");
  hop.innerHTML = '<p class="muted">⏳ Đang tải...</p>';
  try {
    const ds = await Store.getJournal(nguoiDung);
    hop.innerHTML = "";
    $("#journalEmpty").hidden = ds.length > 0;
    ds.forEach(bai => {
      const the = document.createElement("article");
      the.className = "journal-item card";
      the.innerHTML = `
        <div class="j-icon">📕</div>
        <div>
          <h4>${esc(bai.bookName)}</h4>
          <p>${esc(bai.feeling) || "<i>(Chưa ghi cảm nhận)</i>"}</p>
          <span class="j-date">🕒 ${dinhDangNgay(bai.createdAt)}</span>
        </div>`;
      hop.appendChild(the);
    });
  } catch (err) {
    hop.innerHTML = "";
    toast("Không tải được nhật ký: " + dichLoi(err), true);
  }
}

async function themNhatKy() {
  const bookName = $("#journalBook").value.trim();
  const feeling = $("#journalFeeling").value.trim();
  if (!bookName) {
    toast("Em chưa nhập tên sách.", true);
    return;
  }

  const nut = $("#btnAddJournal");
  nut.disabled = true;
  try {
    const danhHieuTruoc = xetDanhHieu(nguoiDung.score);
    const kq = await Store.addJournalEntry(nguoiDung, { bookName, feeling });

    // Cập nhật điểm mới vào hồ sơ đang dùng
    nguoiDung.score = kq.score;
    nguoiDung.bookCount = kq.bookCount;
    nguoiDung.updatedAt = kq.updatedAt;

    $("#journalBook").value = "";
    $("#journalFeeling").value = "";
    await taiNhatKy();

    const danhHieuSau = xetDanhHieu(nguoiDung.score);
    if (danhHieuSau.ten !== danhHieuTruoc.ten) {
      toast(`🎉 +${DIEM_MOI_CUON_SACH} điểm! Em đạt danh hiệu mới: ${danhHieuSau.icon} ${danhHieuSau.ten}!`);
    } else {
      toast(`🎉 +${DIEM_MOI_CUON_SACH} điểm! Em đang có ${nguoiDung.score} điểm.`);
    }
  } catch (err) {
    toast("Không lưu được nhật ký: " + dichLoi(err), true);
  } finally {
    nut.disabled = false;
  }
}

/* ---------- 6c. THƯ VIỆN SỐ ---------- */
async function taiThuVien() {
  const luoi = $("#libraryList");
  luoi.innerHTML = '<p class="muted">⏳ Đang tải...</p>';
  try {
    const ds = await Store.getLibrary();
    luoi.innerHTML = "";
    $("#libraryEmpty").hidden = ds.length > 0;
    ds.forEach(sach => luoi.appendChild(taoTheSach(sach)));
  } catch (err) {
    luoi.innerHTML = "";
    toast("Không tải được thư viện: " + dichLoi(err), true);
  }
}

/** Tạo 1 thẻ sách trong thư viện (tên + nút đọc + ảnh QR) */
function taoTheSach(sach) {
  const the = document.createElement("article");
  the.className = "book-card card";

  // Ảnh QR: dùng ảnh admin nhập; nếu bỏ trống → tự tạo QR từ link sách
  const qrChinh = (sach.qr || "").trim() || taoQRTuLink(sach.link);
  const qrDuPhong = taoQRTuLink(sach.link);

  the.innerHTML = `
    <div class="book-cover">📖</div>
    <div class="book-body">
      <h3 class="book-title">${esc(sach.title)}</h3>
      <a class="btn btn-primary btn-block" href="${esc(sach.link)}" target="_blank" rel="noopener">📖 Đọc sách</a>
      <div class="qr-box">
        <img class="qr-img" src="${esc(qrChinh)}" alt="Mã QR sách ${esc(sach.title)}" loading="lazy">
        <p class="qr-note">📱 Quét QR để đọc</p>
      </div>
    </div>`;

  // Nếu ảnh QR admin nhập bị hỏng/sai đường dẫn → tự thay bằng QR tạo từ link
  const anh = the.querySelector(".qr-img");
  anh.addEventListener("error", () => {
    if (anh.src !== qrDuPhong) {
      anh.src = qrDuPhong;
    } else {
      anh.closest(".qr-box").innerHTML =
        '<p class="qr-note">⚠️ Không tải được ảnh QR</p>';
    }
  });

  // Admin có thêm nút xóa sách
  if (nguoiDung?.role === "admin") {
    const nutXoa = document.createElement("button");
    nutXoa.type = "button";
    nutXoa.className = "btn btn-danger-soft btn-sm";
    nutXoa.textContent = "🗑️ Xóa sách";
    nutXoa.addEventListener("click", async () => {
      if (!confirm(`Xóa sách "${sach.title}" khỏi thư viện?`)) return;
      try {
        await Store.deleteLibraryBook(sach.id);
        toast("Đã xóa sách khỏi thư viện.");
        taiThuVien();
      } catch (err) {
        toast("Không xóa được: " + dichLoi(err), true);
      }
    });
    the.querySelector(".book-body").appendChild(nutXoa);
  }
  return the;
}

/** Admin thêm sách vào thư viện */
async function themSachThuVien() {
  const title = $("#libTitle").value.trim();
  const link = $("#libLink").value.trim();
  const qr = $("#libQR").value.trim();

  if (!title || !link) {
    toast("Cần nhập đủ tên sách và link sách.", true);
    return;
  }
  if (!/^https?:\/\//i.test(link)) {
    toast("Link sách phải bắt đầu bằng http:// hoặc https://", true);
    return;
  }

  const nut = $("#btnAddLibBook");
  nut.disabled = true;
  try {
    await Store.addLibraryBook({ title, link, qr });
    $("#libTitle").value = "";
    $("#libLink").value = "";
    $("#libQR").value = "";
    toast(`Đã thêm sách "${title}" vào thư viện ✅`);
  } catch (err) {
    toast("Không thêm được sách: " + dichLoi(err), true);
  } finally {
    nut.disabled = false;
  }
}

/* ---------- 6d. VIDEO GIỚI THIỆU SÁCH ---------- */
async function taiVideo() {
  const luoi = $("#videoList");
  luoi.innerHTML = '<p class="muted">⏳ Đang tải...</p>';
  try {
    const ds = await Store.getVideos();
    luoi.innerHTML = "";
    $("#videoEmpty").hidden = ds.length > 0;
    ds.forEach(video => {
      const the = document.createElement("article");
      the.className = "video-card card";
      the.innerHTML = `
        <div class="video-frame">
          <iframe src="https://www.youtube.com/embed/${esc(video.youtubeId)}"
                  title="${esc(video.title)}"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen></iframe>
        </div>
        <h3>${esc(video.title)}</h3>`;

      if (nguoiDung?.role === "admin") {
        const hanhDong = document.createElement("div");
        hanhDong.className = "card-actions";
        const nutXoa = document.createElement("button");
        nutXoa.type = "button";
        nutXoa.className = "btn btn-danger-soft btn-sm";
        nutXoa.textContent = "🗑️ Xóa video";
        nutXoa.addEventListener("click", async () => {
          if (!confirm(`Xóa video "${video.title}"?`)) return;
          try {
            await Store.deleteVideo(video.id);
            toast("Đã xóa video.");
            taiVideo();
          } catch (err) {
            toast("Không xóa được: " + dichLoi(err), true);
          }
        });
        hanhDong.appendChild(nutXoa);
        the.appendChild(hanhDong);
      }
      luoi.appendChild(the);
    });
  } catch (err) {
    luoi.innerHTML = "";
    toast("Không tải được video: " + dichLoi(err), true);
  }
}

/** Admin thêm video YouTube (tự chuyển link thường → link nhúng) */
async function themVideo() {
  const title = $("#videoTitle").value.trim();
  const link = $("#videoLink").value.trim();

  if (!title || !link) {
    toast("Cần nhập đủ tên video và link YouTube.", true);
    return;
  }

  const youtubeId = layYouTubeID(link);
  if (!youtubeId) {
    toast("Link YouTube không hợp lệ. Hãy dán link dạng https://www.youtube.com/watch?v=... hoặc https://youtu.be/...", true);
    return;
  }

  const nut = $("#btnAddVideo");
  nut.disabled = true;
  try {
    await Store.addVideo({ title, youtubeId });
    $("#videoTitle").value = "";
    $("#videoLink").value = "";
    toast(`Đã đăng video "${title}" 🎬`);
  } catch (err) {
    toast("Không đăng được video: " + dichLoi(err), true);
  } finally {
    nut.disabled = false;
  }
}

/* ---------- 6e. BẢNG ĐIỂM (học sinh xem) ---------- */
async function taiBangDiem() {
  // Điểm và danh hiệu của bản thân
  const dh = xetDanhHieu(nguoiDung.score);
  $("#myScore").textContent = nguoiDung.score;
  $("#myBadge").textContent = `${dh.icon} ${dh.ten}`;
  const tt = tinhTienTrinh(nguoiDung.score);
  $("#scoreProgressFill").style.width = tt.phanTram + "%";
  $("#scoreProgressText").textContent = tt.moTa;

  // Các mốc danh hiệu (tự sinh từ cấu hình DANH_HIEU)
  const ul = $("#badgeLevels");
  ul.innerHTML = "";
  DANH_HIEU.forEach(moc => {
    const li = document.createElement("li");
    if (nguoiDung.score >= moc.diemToiThieu) li.classList.add("reached");
    li.innerHTML = `<span>${moc.icon} ${esc(moc.ten)}</span>
                    <span class="lv-point">từ ${moc.diemToiThieu} điểm</span>`;
    ul.appendChild(li);
  });

  // Bảng vàng: xếp hạng học sinh theo điểm
  const thanBang = $("#leaderboardBody");
  thanBang.innerHTML = '<tr><td colspan="5" class="muted">⏳ Đang tải...</td></tr>';
  try {
    const ds = (await Store.getAllStudents())
      .sort((a, b) => (b.score - a.score) || (b.bookCount - a.bookCount))
      .slice(0, 20);
    thanBang.innerHTML = "";
    $("#leaderboardEmpty").hidden = ds.length > 0;
    const huyChuong = ["🥇", "🥈", "🥉"];
    ds.forEach((hs, i) => {
      const dhHs = xetDanhHieu(hs.score);
      const tr = document.createElement("tr");
      if (hs.username === nguoiDung.username) tr.classList.add("me-row");
      tr.innerHTML = `
        <td class="rank-medal">${huyChuong[i] || (i + 1)}</td>
        <td><b>${esc(hs.displayName)}</b></td>
        <td>${hs.bookCount}</td>
        <td class="num">${hs.score}</td>
        <td>${dhHs.icon} ${esc(dhHs.ten)}</td>`;
      thanBang.appendChild(tr);
    });
  } catch (err) {
    thanBang.innerHTML = "";
    toast("Không tải được bảng vàng: " + dichLoi(err), true);
  }
}

/* ---------- 6f. BẢNG THỐNG KÊ HỌC SINH (admin) ---------- */
let dsThongKe = [];        // dữ liệu học sinh đã tải về
let sapXepTheoDiem = false; // đang bật sắp xếp điểm cao → thấp?

async function taiThongKe() {
  const than = $("#statsBody");
  than.innerHTML = '<tr><td colspan="7" class="muted">⏳ Đang tải...</td></tr>';
  try {
    dsThongKe = await Store.getAllStudents();
    veBangThongKe();
  } catch (err) {
    than.innerHTML = "";
    toast("Không tải được thống kê: " + dichLoi(err), true);
  }
}

/** Lọc theo ô tìm kiếm + sắp xếp theo lựa chọn hiện tại */
function locVaSapXepThongKe() {
  const tuKhoa = $("#statsSearch").value.trim().toLowerCase();
  let ds = dsThongKe.filter(hs =>
    !tuKhoa ||
    (hs.displayName || "").toLowerCase().includes(tuKhoa) ||
    (hs.username || "").toLowerCase().includes(tuKhoa)
  );
  if (sapXepTheoDiem) {
    ds = [...ds].sort((a, b) => (b.score - a.score) || (b.bookCount - a.bookCount));
  } else {
    ds = [...ds].sort((a, b) => (a.displayName || a.username).localeCompare(b.displayName || b.username, "vi"));
  }
  return ds;
}

function veBangThongKe() {
  const than = $("#statsBody");
  const ds = locVaSapXepThongKe();
  than.innerHTML = "";
  $("#statsEmpty").hidden = ds.length > 0;

  ds.forEach((hs, i) => {
    const dh = xetDanhHieu(hs.score);
    const daGhi = (hs.bookCount || 0) > 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${esc(hs.username)}</td>
      <td><b>${esc(hs.displayName)}</b></td>
      <td>${daGhi ? `<span class="num">${hs.bookCount}</span>` : '<span class="no-journal">Chưa ghi nhật ký</span>'}</td>
      <td class="num">${hs.score}</td>
      <td>${dh.icon} ${esc(dh.ten)}</td>
      <td>${dinhDangNgay(hs.updatedAt)}</td>`;
    than.appendChild(tr);
  });
}

/** Bật/tắt sắp xếp theo điểm cao → thấp */
function doiSapXepDiem() {
  sapXepTheoDiem = !sapXepTheoDiem;
  $("#btnSortScore").textContent = sapXepTheoDiem
    ? "🔤 Sắp xếp theo tên A → Z"
    : "⬇️ Sắp xếp điểm cao → thấp";
  veBangThongKe();
}

/** Xuất bảng thống kê ra file CSV (mở được bằng Excel, có tiếng Việt) */
function xuatCSV() {
  const ds = locVaSapXepThongKe();
  if (!ds.length) {
    toast("Không có dữ liệu để xuất.", true);
    return;
  }

  const dong = [
    ["STT", "Tên đăng nhập", "Họ và tên", "Số sách đã đọc", "Tổng điểm", "Danh hiệu", "Cập nhật gần nhất"],
    ...ds.map((hs, i) => {
      const dh = xetDanhHieu(hs.score);
      return [i + 1, hs.username, hs.displayName, hs.bookCount, hs.score, `${dh.icon} ${dh.ten}`, dinhDangNgay(hs.updatedAt)];
    }),
  ];

  // Ký tự BOM (\uFEFF) ở đầu file giúp Excel hiển thị đúng tiếng Việt
  const noiDung = "\uFEFF" + dong
    .map(hang => hang.map(o => `"${String(o ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const blob = new Blob([noiDung], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "thong-ke-hoc-sinh-" + new Date().toISOString().slice(0, 10) + ".csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
  toast("Đã xuất file thống kê 📥");
}

/* =====================================================================
   7. KHỞI ĐỘNG ỨNG DỤNG
===================================================================== */

function ganSuKien() {
  // Tab đăng nhập / đăng ký
  $("#tabLogin").addEventListener("click", () => chonTab("login"));
  $("#tabRegister").addEventListener("click", () => chonTab("register"));

  // Form
  $("#loginForm").addEventListener("submit", xuLyDangNhap);
  $("#registerForm").addEventListener("submit", xuLyDangKy);
  $("#btnLogout").addEventListener("click", xuLyDangXuat);

  // Menu điện thoại (nút ☰)
  $("#btnMenu").addEventListener("click", () => {
    const dangMo = $("#mainNav").classList.toggle("open");
    $("#btnMenu").setAttribute("aria-expanded", dangMo ? "true" : "false");
  });

  // Mọi phần tử có data-page đều dùng để chuyển trang
  document.addEventListener("click", e => {
    const muc = e.target.closest("[data-page]");
    if (!muc) return;
    e.preventDefault();
    chuyenTrang(muc.dataset.page);
  });

  // Nhật ký (dùng form để bấm Enter trong ô nhập cũng lưu được)
  $("#journalForm").addEventListener("submit", e => { e.preventDefault(); themNhatKy(); });

  // Quản trị
  $("#libBookForm").addEventListener("submit", e => { e.preventDefault(); themSachThuVien(); });
  $("#videoForm").addEventListener("submit", e => { e.preventDefault(); themVideo(); });
  $("#statsSearch").addEventListener("input", veBangThongKe);
  $("#btnSortScore").addEventListener("click", doiSapXepDiem);
  $("#btnExportCSV").addEventListener("click", xuatCSV);
  $("#btnReloadStats").addEventListener("click", taiThongKe);
}

async function khoiDong() {
  ganSuKien();

  // Hiện số điểm cộng mỗi cuốn sách (lấy từ cấu hình)
  $("#homePointRule").textContent = DIEM_MOI_CUON_SACH;
  const nhanDiem = document.querySelector(".pt-tag");
  if (nhanDiem) nhanDiem.textContent = `+${DIEM_MOI_CUON_SACH} điểm`;

  // Đã điền cấu hình Firebase nhưng thư viện Firebase không tải được
  // (mất mạng, bị chặn...) → báo lỗi rõ ràng, KHÔNG âm thầm rơi về chế độ
  // thử nghiệm (tránh dữ liệu bị tách làm hai nơi)
  if (typeof FIREBASE_CONFIG_FILLED !== "undefined" && FIREBASE_CONFIG_FILLED && !FIREBASE_ENABLED) {
    const ghiChu = $("#demoModeNote");
    ghiChu.hidden = false;
    ghiChu.classList.add("error");
    ghiChu.innerHTML = "❌ Không tải được thư viện Firebase.<br>Hãy kiểm tra kết nối internet rồi tải lại trang.";
    $("#loginForm button[type=submit]").disabled = true;
    $("#registerForm button[type=submit]").disabled = true;
    hienManHinhDangNhap();
    return;
  }

  if (FIREBASE_ENABLED) {
    // Firebase tự nhớ phiên đăng nhập giữa các lần mở trang
    fbAuth.onAuthStateChanged(async user => {
      if (boQuaAuthListener) return; // form đang tự xử lý rồi
      if (!user) {
        hienManHinhDangNhap();
        return;
      }
      if (nguoiDung && nguoiDung.uid === user.uid) return; // đã vào rồi
      try {
        const hoSo = await FirebaseStore.layHoSo(user);
        vaoUngDung(hoSo);
      } catch (err) {
        console.error(err);
        toast("Không tải được hồ sơ: " + dichLoi(err), true);
      }
    });
  } else {
    // Chế độ thử nghiệm: báo cho người dùng biết
    $("#demoModeNote").hidden = false;
    const hoSo = await LocalStore.getCurrentProfile();
    if (hoSo) vaoUngDung(hoSo);
    else hienManHinhDangNhap();
  }
}

document.addEventListener("DOMContentLoaded", khoiDong);
