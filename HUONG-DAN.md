# Hướng dẫn cài đặt & quản lý

**Hệ thống Đại sứ Văn hóa đọc — Trường Tiểu học Lê Thị Hồng Gấm (Xã Krông Nô)**

File này hướng dẫn **từng bước một** cách kết nối website với Firebase (để có tài khoản
học sinh + tài khoản admin) và cách đưa website lên internet bằng Vercel.

Bạn **không cần biết lập trình** để làm theo hướng dẫn này. Chỉ cần làm đúng thứ tự.

---

## Bảng theo dõi tiến độ

Làm xong bước nào thì đánh dấu `x` vào ô vuông.

- [ ] **Phần 1** — Tạo dự án Firebase mới
- [ ] **Phần 2** — Thêm ứng dụng Web, lấy đoạn cấu hình, dán vào `firebase-config.js`
- [ ] **Phần 3** — Bật đăng nhập Email/Password
- [ ] **Phần 4** — Tạo Firestore Database
- [ ] **Phần 5** — Dán quy tắc bảo mật *(quan trọng nhất — đừng bỏ qua)*
- [ ] **Phần 6** — Đưa web lên internet bằng Vercel
- [ ] **Phần 7** — Tạo tài khoản admin đầu tiên
- [ ] **Phần 8** — Cho học sinh đăng ký

> ⏱️ Tổng thời gian: khoảng **30–45 phút** nếu làm lần đầu.

---

## Trước khi bắt đầu: hiểu 2 chế độ của website

Website này có 2 chế độ, nó **tự động** nhận biết:

| Chế độ | Khi nào xảy ra | Dữ liệu lưu ở đâu |
|---|---|---|
| **Chế độ thử nghiệm** | File `firebase-config.js` vẫn còn chữ `THAY_...` | Chỉ lưu trong trình duyệt của **một máy đó** (localStorage). Đổi máy là mất. |
| **Chế độ thật** | Đã dán cấu hình Firebase vào | Lưu trên Firebase, **đồng bộ mọi máy, mọi điện thoại** |

Hiện tại website đang ở **chế độ thử nghiệm** — bạn sẽ thấy một dòng cảnh báo màu vàng:

> ⚠️ Chế độ thử nghiệm: dữ liệu chỉ lưu trên máy này. Cấu hình Firebase để đồng bộ qua internet.

Ở chế độ thử nghiệm, bạn có thể đăng nhập thử bằng tài khoản admin demo:
**`admin`** / **`admin@123`** — dùng để xem trước giao diện quản trị.

👉 **Làm xong Phần 1–5, dòng cảnh báo vàng sẽ tự biến mất.** Đó là dấu hiệu bạn đã làm đúng.

---

## PHẦN 1 — Tạo dự án Firebase mới

Firebase là dịch vụ miễn phí của Google, dùng để lưu tài khoản và dữ liệu.

1. Mở trình duyệt, vào **https://console.firebase.google.com**
2. Đăng nhập bằng tài khoản Google (Gmail) của bạn.
3. Bấm nút **`Create a project`** (hoặc **`Thêm dự án`** nếu hiện tiếng Việt).
4. Ở ô **Project name**, nhập tên dự án. Gợi ý:

   ```
   vanhoadoc-lethihonggam
   ```

   > 💡 Firebase yêu cầu **Project ID** phải độc nhất trên toàn thế giới. Nếu tên đã có
   > người dùng, Firebase sẽ tự thêm vài chữ số vào cuối (ví dụ
   > `vanhoadoc-lethihonggam-a1b2c`). **Không sao cả** — cứ chấp nhận. Hãy ghi lại
   > Project ID mà Firebase hiện ra, vì Phần 2 sẽ cần.

5. Bấm **`Continue`**.
6. Đến bước **Google Analytics**: **TẮT** nó đi (bấm cho công tắc chuyển sang xám).
   Website này không cần Analytics, tắt đi cho đơn giản.
7. Bấm **`Create project`**, chờ khoảng 30 giây.
8. Bấm **`Continue`** khi thấy chữ *"Your new project is ready"*.

✅ **Xong Phần 1** khi bạn thấy trang tổng quan (Project Overview) của dự án mới.

---

## PHẦN 2 — Thêm ứng dụng Web & lấy đoạn cấu hình

1. Ở trang tổng quan dự án, tìm dòng chữ *"Get started by adding Firebase to your app"*.
2. Bấm vào biểu tượng **`</>`** (biểu tượng Web — hình dấu ngoặc nhọn).
3. Ở ô **App nickname**, nhập gì cũng được, ví dụ:

   ```
   Website Van hoa doc
   ```

4. ⚠️ **KHÔNG** tích vào ô *"Also set up Firebase Hosting for this app"* —
   ta dùng Vercel để đưa web lên mạng, không dùng Firebase Hosting.
5. Bấm **`Register app`**.
6. Firebase hiện ra một đoạn mã. Bạn chỉ cần phần trong dấu ngoặc `{ ... }`, trông như thế này:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy........................",
     authDomain: "vanhoadoc-lethihonggam.firebaseapp.com",
     projectId: "vanhoadoc-lethihonggam",
     storageBucket: "vanhoadoc-lethihonggam.firebasestorage.app",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890"
   };
   ```

7. **Copy toàn bộ đoạn đó.**
8. Mở file **`firebase-config.js`** trong thư mục website, tìm đoạn:

   ```js
   const firebaseConfig = {
     apiKey:            "THAY_API_KEY",
     authDomain:        "THAY_AUTH_DOMAIN",
     projectId:         "THAY_PROJECT_ID",
     storageBucket:     "THAY_STORAGE_BUCKET",
     messagingSenderId: "THAY_MESSAGING_SENDER_ID",
     appId:             "THAY_APP_ID"
   };
   ```

   **Thay 6 dòng `THAY_...` bằng 6 giá trị thật** bạn vừa copy. Lưu file lại.

9. Bấm **`Continue to console`** trên Firebase.

### ❓ Dán `apiKey` công khai lên GitHub có nguy hiểm không?

**Không.** `apiKey` của Firebase Web **không phải mật khẩu** — nó chỉ là mã số để nhận biết
dự án, Google thiết kế nó để hiện công khai trong trình duyệt. Bất kỳ ai xem mã nguồn
website đều thấy được nó, và điều đó là bình thường.

Cái **thật sự** bảo vệ dữ liệu là **quy tắc bảo mật (Security Rules)** ở **Phần 5**.
Vì vậy Phần 5 là phần quan trọng nhất của tài liệu này.

✅ **Xong Phần 2** khi file `firebase-config.js` không còn chữ `THAY_` nào.

---

## PHẦN 3 — Bật đăng nhập Email/Password

Nếu bỏ qua bước này, học sinh sẽ gặp lỗi:
*"Hệ thống chưa bật đăng nhập Email/Password trong Firebase"*.

1. Ở menu bên trái Firebase Console, bấm **`Build`** → **`Authentication`**.
2. Bấm nút **`Get started`**.
3. Trong danh sách **Sign-in providers**, bấm vào **`Email/Password`**.
4. Bật công tắc **`Enable`** ở dòng đầu tiên (Email/Password).
5. ⚠️ Dòng thứ hai **`Email link (passwordless sign-in)`** thì **để TẮT**.
6. Bấm **`Save`**.

✅ **Xong Phần 3** khi cột Status của Email/Password hiện chữ **`Enabled`**.

### Tại sao học sinh đăng nhập bằng tên, mà Firebase lại đòi email?

Firebase **bắt buộc** đăng nhập bằng email. Nhưng học sinh tiểu học khó nhớ email, nên
website tự làm việc này thay các em:

```
Học sinh nhập:     an.nguyen
Website tự ghép:   an.nguyen@lethihonggam-krongno.edu.vn
Gửi cho Firebase:  an.nguyen@lethihonggam-krongno.edu.vn
```

Đuôi email này là **email ảo** — nó không tồn tại thật, không nhận được thư.
Học sinh **chỉ cần nhớ tên đăng nhập**, không bao giờ thấy chuỗi email này.

Đuôi email nằm ở dòng `EMAIL_DOMAIN` trong file `firebase-config.js`.
⚠️ **Xem cảnh báo ở Phần 12 trước khi nghĩ đến việc đổi nó.**

---

## PHẦN 4 — Tạo Firestore Database

Đây là nơi lưu điểm, nhật ký đọc sách, danh sách sách và video.

1. Menu bên trái → **`Build`** → **`Firestore Database`**.
2. Bấm **`Create database`**.
3. **Location** (vị trí máy chủ): chọn

   ```
   asia-southeast1 (Singapore)
   ```

   > 💡 Singapore là máy chủ gần Việt Nam nhất → website chạy nhanh nhất.
   > ⚠️ **Chọn xong KHÔNG đổi lại được.** Hãy chọn cẩn thận.

4. Đến bước chọn quy tắc bảo mật, chọn:

   ```
   ⦿ Start in production mode
   ```

   > ⚠️ **Đừng chọn "Start in test mode".** Test mode cho **bất kỳ ai trên internet**
   > đọc và ghi toàn bộ dữ liệu, và sau 30 ngày Firebase sẽ tự khóa sạch làm website
   > đứng hẳn. Ta chọn Production mode (khóa hết), rồi mở đúng những gì cần ở Phần 5.

5. Bấm **`Create`**, chờ khoảng 30 giây.

✅ **Xong Phần 4** khi bạn thấy màn hình Data trống với dòng *"Start collection"*.

> 📌 Lúc này website **chưa dùng được** — vì Production mode đang khóa tất cả.
> Phần 5 sẽ mở khóa đúng mức cần thiết. Hãy làm tiếp ngay.

---

## PHẦN 5 — Dán quy tắc bảo mật ⭐ QUAN TRỌNG NHẤT

### Vì sao phần này quan trọng?

Việc ẩn menu "🔑 Quản trị" khỏi học sinh **chỉ là che ở phía trình duyệt** — nó làm cho
giao diện gọn gàng, chứ **không bảo vệ được gì**. Một học sinh biết chút kỹ thuật, chỉ cần
mở công cụ Developer Tools của trình duyệt, là có thể:

- Tự phong mình làm **admin**
- Tự cộng cho mình **99999 điểm**
- **Xóa sạch** toàn bộ thư viện sách và video của trường

Quy tắc bảo mật dưới đây được Firebase kiểm tra **trên máy chủ Google**, học sinh không
can thiệp được. Đây là thứ **duy nhất** chặn thật được những việc trên.

### Cách dán

1. Menu bên trái → **`Build`** → **`Firestore Database`**.
2. Bấm tab **`Rules`** (ở hàng tab phía trên: Data · Rules · Indexes · Usage).
3. **Xóa sạch** toàn bộ nội dung đang có trong ô soạn thảo.
4. **Copy toàn bộ** khối dưới đây và dán vào:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    /* ---------- Các hàm kiểm tra dùng chung ---------- */

    // Đã đăng nhập chưa?
    function daDangNhap() {
      return request.auth != null;
    }

    // Có phải chính chủ hồ sơ này không?
    function laChu(uid) {
      return daDangNhap() && request.auth.uid == uid;
    }

    // Có phải admin không? (đọc field role trong hồ sơ của chính người đang thao tác)
    function laAdmin() {
      return daDangNhap()
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    /* ---------- Hồ sơ người dùng ---------- */
    match /users/{uid} {

      // Học sinh đọc được hồ sơ của nhau -> cần cho "Bảng vàng của trường"
      allow read: if daDangNhap();

      // Khi đăng ký: BẮT BUỘC role = student, điểm = 0.
      // => Không ai tự đăng ký thành admin được.
      allow create: if laChu(uid)
        && request.resource.data.role == 'student'
        && request.resource.data.score == 0
        && request.resource.data.bookCount == 0;

      // Admin sửa / xóa hồ sơ nào cũng được
      allow update, delete: if laAdmin();

      // Học sinh tự cập nhật hồ sơ mình, nhưng:
      //   - KHÔNG được đổi role (không tự phong admin)
      //   - KHÔNG được đổi username
      //   - Điểm chỉ được tăng ĐÚNG +10 kèm +1 cuốn sách (ghi 1 bài nhật ký)
      allow update: if laChu(uid)
        && request.resource.data.role == resource.data.role
        && request.resource.data.username == resource.data.username
        && (
             (request.resource.data.score == resource.data.score
               && request.resource.data.bookCount == resource.data.bookCount)
             ||
             (request.resource.data.score == resource.data.score + 10
               && request.resource.data.bookCount == resource.data.bookCount + 1)
           );

      /* ---------- Nhật ký đọc sách (riêng của từng em) ---------- */
      match /journal/{entryId} {

        // Chỉ chính em đó và admin đọc được
        allow read: if laChu(uid) || laAdmin();

        // Chỉ chính em đó ghi được, kèm giới hạn độ dài chống spam
        allow create: if laChu(uid)
          && request.resource.data.bookName is string
          && request.resource.data.bookName.size() > 0
          && request.resource.data.bookName.size() <= 200
          && request.resource.data.feeling is string
          && request.resource.data.feeling.size() <= 2000;

        // Đã ghi rồi thì không sửa được nữa
        allow update: if false;

        allow delete: if laChu(uid) || laAdmin();
      }
    }

    /* ---------- Thư viện số: ai cũng đọc, chỉ admin thêm/xóa ---------- */
    match /library/{id} {
      allow read:  if daDangNhap();
      allow write: if laAdmin();
    }

    /* ---------- Video giới thiệu sách: ai cũng đọc, chỉ admin thêm/xóa ---------- */
    match /videos/{id} {
      allow read:  if daDangNhap();
      allow write: if laAdmin();
    }

    /* ---------- Mọi thứ khác: khóa hoàn toàn ---------- */
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

5. Bấm nút **`Publish`** (nút xanh ở góc trên bên phải).
6. Chờ vài giây, Firebase hiện thông báo *"Rules published successfully"*.

✅ **Xong Phần 5.**

> 🧪 **Bộ quy tắc này đã được kiểm chứng** bằng Firestore Emulator với 42 trường hợp thử:
> học sinh tự phong admin, tự đặt điểm, sửa điểm bạn khác, đọc nhật ký bạn khác, xóa sách,
> ghi vào collection lạ — **tất cả đều bị chặn**; đồng thời các việc hợp lệ (ghi nhật ký
> +10 điểm, xem Bảng vàng, admin quản lý thư viện và sửa điểm) **vẫn chạy bình thường**.
> Bạn chỉ cần dán đúng nguyên khối trên là được.

### ⚠️ Con số `10` trong quy tắc trên

Số `10` phải **khớp** với số điểm mỗi cuốn sách trong file `app.js`:

```js
const DIEM_MOI_CUON_SACH = 10;   // dòng 28 của app.js
```

👉 **Nếu sau này bạn muốn đổi số điểm** (ví dụ 20 điểm/cuốn), phải đổi ở **CẢ HAI chỗ**:
1. Dòng 28 trong `app.js`
2. Hai chỗ có số `10` trong quy tắc bảo mật (rồi bấm Publish lại)

Nếu chỉ đổi một chỗ, học sinh sẽ **không lưu được nhật ký** và thấy lỗi
*"Em không có quyền làm thao tác này"*.

### Quy tắc này chặn được gì, không chặn được gì

| Hành vi | Có chặn? |
|---|---|
| Học sinh tự đặt `role: "admin"` | ✅ Chặn |
| Học sinh tự đặt điểm tùy ý (99999) | ✅ Chặn |
| Học sinh xóa/thêm sách, video | ✅ Chặn |
| Học sinh sửa điểm của bạn khác | ✅ Chặn |
| Học sinh đọc nhật ký của bạn khác | ✅ Chặn |
| Người chưa đăng nhập đọc bất cứ gì | ✅ Chặn |
| Học sinh ghi thật nhiều bài nhật ký để "farm" điểm | ❌ **Không chặn** |

Về dòng cuối: học sinh bấm nút trên website nhiều lần cũng làm được việc đó, nên quy tắc
không chặn. Muốn chặn hẳn phải dùng Cloud Functions (trả phí, phức tạp hơn nhiều).
Cách xử lý thực tế: giáo viên xem trang **Quản trị**, thấy em nào điểm tăng bất thường
thì nhắc nhở, và sửa lại điểm trong Firebase Console.

---

## PHẦN 6 — Đưa web lên internet bằng Vercel

Vercel là dịch vụ miễn phí giúp website có địa chỉ thật trên internet
(ví dụ `vanhoadoc.vercel.app`) để học sinh truy cập từ nhà.

1. Vào **https://vercel.com**
2. Bấm **`Sign Up`** → chọn **`Continue with GitHub`**
   (dùng chính tài khoản GitHub đang chứa website này).
3. Vercel hỏi quyền truy cập GitHub → bấm **`Authorize`**.
4. Ở trang chính Vercel, bấm **`Add New...`** → **`Project`**.
5. Tìm repo tên **`vanhoadoc`** trong danh sách → bấm **`Import`**.
6. Điền vào form cấu hình như sau:

   | Ô | Điền gì |
   |---|---|
   | Project Name | `vanhoadoc` (hoặc tên bạn muốn) |
   | Framework Preset | **`Other`** |
   | Root Directory | `./` (để nguyên) |
   | Build Command | **để TRỐNG** |
   | Output Directory | **để TRỐNG** |
   | Install Command | **để TRỐNG** |

   > 💡 Website này là HTML/CSS/JS thuần, không cần "build" gì cả. Để trống là đúng.

7. Bấm **`Deploy`**, chờ khoảng 30–60 giây.
8. Khi thấy màn hình chúc mừng kèm hình chụp website → bấm vào để mở.
   Địa chỉ web của bạn sẽ có dạng **`https://vanhoadoc.vercel.app`**

### Bước bắt buộc sau khi deploy: khai báo tên miền với Firebase

1. Copy địa chỉ web Vercel vừa nhận được, **bỏ phần `https://`**.
   Ví dụ: `vanhoadoc.vercel.app`
2. Về Firebase Console → **`Authentication`** → tab **`Settings`**
   → mục **`Authorized domains`**
3. Bấm **`Add domain`**, dán địa chỉ vào, bấm **`Add`**.

> 💡 Đăng nhập bằng mật khẩu vẫn chạy nếu bỏ bước này, nhưng khai báo là đúng chuẩn —
> và **bắt buộc** nếu sau này bạn muốn thêm đăng nhập bằng Google.

### 🔄 Từ nay mỗi lần sửa website

Mỗi lần bạn (hoặc người giúp bạn) `git push` mã nguồn lên GitHub, **Vercel tự động
cập nhật website** sau khoảng 1 phút. Bạn không cần làm gì thêm.

✅ **Xong Phần 6** khi mở được địa chỉ Vercel và **KHÔNG còn dòng cảnh báo vàng**.

> ❗ Nếu vẫn thấy dòng vàng "Chế độ thử nghiệm", nghĩa là file `firebase-config.js`
> đã sửa ở máy nhưng **chưa được push lên GitHub**. Xem Phần 10.

---

## PHẦN 7 — Tạo tài khoản admin đầu tiên

⚠️ **Không có cách nào tự đăng ký thành admin** — đó là chủ ý bảo mật. Khi ai đó đăng ký,
website **luôn** đặt `role: "student"` (xem dòng 206 file `app.js`), và quy tắc bảo mật ở
Phần 5 cũng chặn việc tự đổi thành admin.

Cách duy nhất là **sửa tay một lần** trong Firebase Console. Làm đúng 4 bước sau:

### Bước 1 — Đăng ký một tài khoản bình thường

Mở website, bấm tab **`📝 Đăng ký`**, điền:

| Ô | Điền ví dụ |
|---|---|
| Họ và tên | `Quản trị viên` |
| Tên đăng nhập | `admin.gam` |
| Mật khẩu | *(mật khẩu mạnh của riêng bạn, ít nhất 6 ký tự)* |

Bấm **Đăng ký**. Bạn sẽ vào website với tư cách **học sinh** — chưa có menu Quản trị.
Đúng như vậy, đừng lo.

> 🔐 Hãy dùng mật khẩu thật, mạnh. **Đừng** dùng `admin@123` — mật khẩu đó nằm trong mã
> nguồn công khai, chỉ dùng cho chế độ thử nghiệm offline.

### Bước 2 — Tìm hồ sơ vừa tạo trong Firebase

1. Firebase Console → **`Build`** → **`Firestore Database`** → tab **`Data`**
2. Bấm vào collection **`users`** ở cột bên trái.
3. Bạn sẽ thấy một hoặc vài dòng mã dài (đó là `uid`). Bấm từng dòng và xem cột bên phải,
   tìm cái có **`username: "admin.gam"`**

### Bước 3 — Đổi role thành admin

1. Trong cột bên phải, tìm dòng **`role`** — đang là **`"student"`**
2. Bấm vào biểu tượng **bút chì ✏️** ở cuối dòng `role`
3. Sửa giá trị từ `student` thành:

   ```
   admin
   ```

   > ⚠️ Viết **chữ thường hết**, không dấu cách, không dấu ngoặc kép.
   > `Admin` hay `ADMIN` hay `admin ` (có dấu cách) đều **KHÔNG** hoạt động.

4. Bấm **`Update`**.

### Bước 4 — Đăng nhập lại

1. Về website, bấm **`🚪 Đăng xuất`**
2. Đăng nhập lại bằng `admin.gam` + mật khẩu của bạn
3. 🎉 Bây giờ bạn sẽ thấy:
   - Menu **`🔑 Quản trị`** xuất hiện trên thanh điều hướng
   - Tên bạn có vương miện: **👑 Quản trị viên**
   - Website mở thẳng vào trang Quản trị

✅ **Xong Phần 7.**

### Muốn thêm admin khác (ví dụ thêm 1 giáo viên)?

Làm lại **đúng 4 bước trên** với tên đăng nhập khác. Không có giới hạn số lượng admin.

> 💡 **Lưu ý:** admin **không** hiện trong bảng thống kê học sinh và **không** hiện trên
> Bảng vàng — vì website chỉ lấy những hồ sơ có `role: "student"`. Đây là chủ ý, để
> giáo viên không lẫn vào danh sách học sinh.

---

## PHẦN 8 — Học sinh đăng ký & sử dụng

### Quy tắc đặt tên đăng nhập

Học sinh tự bấm tab **`📝 Đăng ký`** trên website. Tên đăng nhập phải:

- Dài **3–20 ký tự**
- Chỉ dùng **chữ thường không dấu**, **số**, và các dấu **`.`** **`_`** **`-`**
- Dấu `.` `_` `-` **không được** đứng ở đầu hoặc cuối

| Tên đăng nhập | Được không? |
|---|---|
| `an.nguyen` | ✅ Được |
| `minh_anh2b` | ✅ Được |
| `hoa-lan` | ✅ Được |
| `Nguyễn Văn An` | ❌ Có chữ hoa, dấu tiếng Việt, dấu cách |
| `an.` | ❌ Dấu chấm ở cuối |
| `an` | ❌ Chưa đủ 3 ký tự |

Mật khẩu: **ít nhất 6 ký tự** (yêu cầu của Firebase).

> 💡 **Gợi ý cho giáo viên:** thống nhất một quy tắc chung cho cả lớp để dễ quản lý,
> ví dụ `tên.họ` + số lớp: `an.nguyen3a`, `binh.tran3a`...
> Và **ghi lại danh sách tên đăng nhập + mật khẩu của cả lớp vào một file riêng** —
> vì hệ thống **không có chức năng quên mật khẩu** (xem Phần 9).

### Cách tính điểm & danh hiệu

Mỗi bài nhật ký đọc sách = **+10 điểm**.

| Điểm | Danh hiệu |
|---|---|
| Từ 0 | 🌱 Mầm đọc sách |
| Từ 50 | 📖 Người bạn của sách |
| Từ 100 | 🏆 Đại sứ văn hóa đọc |

*(Xem/sửa ở dòng 28–35 file `app.js`. Nếu đổi số điểm mỗi cuốn, nhớ đọc lại cảnh báo ở Phần 5.)*

---

## PHẦN 9 — Admin làm được gì, chưa làm được gì

Bảng này ghi **đúng thực tế** để bạn không mất thời gian tìm chức năng không tồn tại.

### ✅ Làm được ngay trên website (trang 🔑 Quản trị)

| Việc | Ghi chú |
|---|---|
| Thêm sách vào thư viện số | Để **trống** ô ảnh QR → hệ thống **tự sinh mã QR** từ link sách |
| Xóa sách khỏi thư viện | |
| Thêm video giới thiệu sách | Dán link YouTube dạng nào cũng được (`youtu.be`, `watch?v=`, Shorts, Live) — hệ thống tự nhận |
| Xóa video | |
| Xem bảng thống kê toàn bộ học sinh | Tên, tên đăng nhập, số sách, điểm, danh hiệu |
| Tìm kiếm học sinh | Ô tìm kiếm ngay trên bảng |
| Sắp xếp theo điểm cao → thấp | Bấm nút sắp xếp |
| **Xuất file CSV** | Mở được bằng Excel, **tiếng Việt không bị lỗi font** |

### ❌ Chưa có trên website — phải làm tay trong Firebase Console

| Việc cần làm | Làm ở đâu |
|---|---|
| **Sửa điểm** của một học sinh | Firestore → `users` → chọn hồ sơ → sửa `score` và `bookCount` |
| **Đặt lại mật khẩu** cho học sinh quên | Authentication → Users → chọn user → **Reset password** |
| **Khóa** tài khoản (không xóa) | Authentication → Users → dấu `⋮` → **Disable account** |
| **Xóa hẳn** tài khoản | Authentication → Users → dấu `⋮` → **Delete account**, rồi xóa luôn hồ sơ trong Firestore → `users` |
| **Phong thêm admin** | Xem Phần 7 |
| **Sửa** (thay vì xóa rồi thêm lại) sách / video | Firestore → `library` hoặc `videos` → sửa field |
| **Xem nhật ký** của một học sinh | Firestore → `users` → chọn hồ sơ → collection con `journal` |
| Đổi số điểm mỗi cuốn, đổi mốc danh hiệu | Sửa `app.js` dòng 28–35 (và rules — xem Phần 5) |

### 🚫 Không có chức năng "Quên mật khẩu" — và không thể có

Firebase gửi mail đặt lại mật khẩu tới địa chỉ email của người dùng. Nhưng email học sinh
ở đây là **email ảo** (`an.nguyen@lethihonggam-krongno.edu.vn`) — **không tồn tại thật**,
nên thư đặt lại **không bao giờ tới được**.

**Cách xử lý khi học sinh quên mật khẩu:**

1. Firebase Console → **`Authentication`** → tab **`Users`**
2. Tìm dòng có email `tên-đăng-nhập@lethihonggam-krongno.edu.vn`
3. Bấm dấu **`⋮`** ở cuối dòng → **`Reset password`**
4. Firebase cho bạn đặt mật khẩu mới → đọc lại cho học sinh

👉 Vì vậy giáo viên **nên giữ một file danh sách tên đăng nhập + mật khẩu của cả lớp**.

---

## PHẦN 10 — Xử lý sự cố thường gặp

### Vẫn thấy dòng cảnh báo vàng "Chế độ thử nghiệm"

**Nguyên nhân:** file `firebase-config.js` còn chữ `THAY_`, hoặc đã sửa ở máy nhưng chưa
push lên GitHub nên bản trên Vercel vẫn là bản cũ.

**Cách kiểm tra:** mở file `firebase-config.js` trên GitHub (`github.com/.../vanhoadoc`)
và xem dòng `apiKey` — nếu còn chữ `THAY_API_KEY` thì chưa push.

### "Em không có quyền làm thao tác này"

| Xảy ra khi | Nguyên nhân |
|---|---|
| Học sinh bấm **Lưu nhật ký** | Số `10` trong rules **không khớp** `DIEM_MOI_CUON_SACH` trong `app.js` → xem Phần 5 |
| Admin bấm **thêm sách / video** | Field `role` chưa đúng chữ `admin` (viết hoa, có dấu cách?) → xem Phần 7 Bước 3 |
| Mọi thao tác đều lỗi | Rules chưa bấm **Publish**, hoặc dán thiếu → dán lại Phần 5 |

### "Hệ thống chưa bật đăng nhập Email/Password trong Firebase"

Bạn chưa làm **Phần 3**. Quay lại làm.

### "Tên đăng nhập không hợp lệ"

Tên đăng nhập có chữ hoa, dấu tiếng Việt hoặc dấu cách → xem lại quy tắc ở **Phần 8**.

### Admin đăng nhập nhưng không thấy menu Quản trị

1. Kiểm tra field `role` trong Firestore đúng là `admin` (chữ thường, không dấu cách)
2. **Đăng xuất rồi đăng nhập lại** — website chỉ đọc quyền lúc đăng nhập

### Học sinh nói "mất hết điểm rồi"

Rất có thể em đó đang mở website ở **chế độ thử nghiệm** (dữ liệu lưu trong máy) rồi
đổi máy khác. Kiểm tra: mở website, nếu thấy dòng vàng thì đó là chế độ thử nghiệm.
Chỉ dùng **địa chỉ Vercel chính thức** cho học sinh.

### ❌ Không tải được thư viện Firebase

Đã điền cấu hình đúng nhưng máy không tải được thư viện Firebase (mất mạng, bị chặn).
Website sẽ **khóa nút đăng nhập** và báo lỗi rõ ràng — chủ ý như vậy, để dữ liệu không bị
tách làm hai nơi. Kiểm tra internet rồi tải lại trang.

---

## PHẦN 11 — Sao lưu dữ liệu & hạn mức miễn phí

### Sao lưu

Cách đơn giản nhất: vào trang **🔑 Quản trị** → bấm **Xuất CSV** → lưu file lại.
Nên làm **cuối mỗi học kỳ**.

> ⚠️ Gói miễn phí (Spark) **không có** tự động sao lưu Firestore. File CSV là bản sao lưu
> duy nhất của bạn. File CSV chứa: tên, tên đăng nhập, số sách, điểm, danh hiệu —
> **không** chứa nội dung nhật ký.

### Hạn mức gói miễn phí (Spark)

| Hạn mức | Mỗi ngày |
|---|---|
| Đọc dữ liệu | 50.000 lượt |
| Ghi dữ liệu | 20.000 lượt |
| Dung lượng lưu | 1 GB |
| Số tài khoản | Không giới hạn |

Một trường tiểu học dùng **không bao giờ chạm tới** các mức này. Bạn không cần lo về chi phí,
và **không cần** nhập thẻ tín dụng.

---

## PHẦN 12 — Những điều TUYỆT ĐỐI không được làm

### 1. ❌ Không đổi `EMAIL_DOMAIN` sau khi đã có học sinh đăng ký

```js
const EMAIL_DOMAIN = "lethihonggam-krongno.edu.vn";   // trong firebase-config.js
```

Đổi dòng này = **toàn bộ học sinh mất quyền đăng nhập vĩnh viễn**. Vì tài khoản của các em
đã lưu trong Firebase dưới địa chỉ email ghép từ đuôi cũ; đổi đuôi là website đi tìm một
địa chỉ email không tồn tại.

👉 Nếu **buộc** phải đổi: phải xóa hết tài khoản và cho toàn trường đăng ký lại từ đầu.

### 2. ❌ Không chọn "Test mode" cho Firestore

Cho cả internet đọc/ghi dữ liệu của trường, và **tự khóa sạch sau 30 ngày** làm website
đứng hẳn. Luôn dùng **Production mode + quy tắc bảo mật ở Phần 5**.

### 3. ❌ Không đổi Location của Firestore

Chọn xong là **không đổi lại được**. Muốn đổi phải tạo dự án mới hoàn toàn.

### 4. ❌ Không dùng mật khẩu `admin@123` cho tài khoản thật

Mật khẩu đó nằm trong mã nguồn công khai trên GitHub (dòng 40 file `app.js`), chỉ dùng cho
chế độ thử nghiệm offline. Tài khoản admin thật phải có mật khẩu mạnh của riêng bạn.

### 5. ❌ Không xóa collection `users` trong Firestore

Xóa `users` = mất toàn bộ điểm và danh hiệu của học sinh, **không phục hồi được**.
Tài khoản đăng nhập vẫn còn trong Authentication, nhưng điểm thì mất sạch.

### 6. ⚠️ Đổi số điểm thì phải đổi ở CẢ HAI chỗ

`app.js` dòng 28 **và** quy tắc bảo mật ở Phần 5. Xem lại cảnh báo ở Phần 5.

---

## Phụ lục — Cấu trúc dữ liệu trong Firestore

Để bạn hiểu mình đang xem gì khi mở Firebase Console.

```
users/{uid}                          ← mỗi học sinh / admin là 1 document
├── username      "an.nguyen"        (tên đăng nhập, chữ thường)
├── displayName   "Nguyễn Văn An"    (họ tên đầy đủ, hiện trên web)
├── role          "student"          ← đổi thành "admin" để phong quyền
├── score         30                 (tổng điểm)
├── bookCount     3                  (số sách đã ghi nhật ký)
├── createdAt     <thời điểm>
├── updatedAt     <thời điểm>
│
└── journal/{id}                     ← collection con: nhật ký của riêng em này
    ├── bookName   "Dế Mèn phiêu lưu ký"
    ├── feeling    "Em thích nhất đoạn..."
    └── createdAt  <thời điểm>

library/{id}                         ← thư viện số (chỉ admin thêm/xóa)
├── title      "Dế Mèn phiêu lưu ký"
├── link       "https://..."
├── qr         "https://..."         (để trống thì hệ thống tự sinh)
└── createdAt  <thời điểm>

videos/{id}                          ← video giới thiệu sách (chỉ admin thêm/xóa)
├── title      "Cảm nhận về Dế Mèn"
├── youtubeId  "dQw4w9WgXcQ"         (mã 11 ký tự, hệ thống tự tách từ link)
└── createdAt  <thời điểm>
```

### Các file trong website

| File | Nội dung |
|---|---|
| `index.html` | Toàn bộ giao diện |
| `style.css` | Màu sắc, kiểu chữ, bố cục |
| `app.js` | Toàn bộ logic: đăng nhập, tính điểm, hiển thị dữ liệu |
| `firebase-config.js` | **File duy nhất bạn cần sửa** để kết nối Firebase |
| `HUONG-DAN.md` | File hướng dẫn này |

---

## Cần giúp đỡ?

Khi nhờ ai đó hỗ trợ, hãy cung cấp:

1. **Bạn đang ở Phần nào, Bước nào** của hướng dẫn này
2. **Dòng thông báo lỗi** hiện trên website (chụp ảnh màn hình)
3. Website **có còn dòng cảnh báo vàng** hay không
4. Ảnh chụp tab **Rules** trong Firestore (để kiểm tra rules đã Publish chưa)
