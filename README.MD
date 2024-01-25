# **Hướng Dẫn Sử Dụng Script Lấy Lịch Học EPU trên GitHub** 📅

## 1. Tạo Biến Môi Trường ⚙️

- Fork repository này về.

- Trong repository của bạn:

  - Truy cập tab **Settings** ⚙️.

  - Chọn **Secrets** từ menu bên trái.

  - Nhấp vào **New repository secret**.

- Tạo hai secrets

  - `USERNAME`: Tên đăng nhập Cổng Thông tin Sinh viên EPU của bạn.
  - `PASSWORD`: Mật khẩu Cổng Thông tin Sinh viên EPU của bạn.

## 2. Cập Nhật Lịch Học Tự Động 🔄

GitHub Action đã được cấu hình để chạy tự động theo lịch trình và mỗi khi có sự thay đổi trong nhánh **main**. Nếu muốn thay đổi lịch trình, bạn có thể chỉnh sửa **cron expression** trong tệp **main.yml**.

## 3. Triển Khai Trang GitHub Pages 🌐

- Trong repository của bạn:

  - Chọn tab **Settings** ⚙️.

  - Di chuyển xuống phần **Pages**.

  - Chọn branch **page** để deploy và lưu lại.

Bạn có thể truy cập trang GitHub Pages của mình qua đường dẫn:

- 🔗 https://`tên-người-dùng`.github.io/`tên-repository`

Xem hướng dẫn thêm **custom domain** tại [đây](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).
