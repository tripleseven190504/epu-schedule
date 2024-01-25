<h1 id="hướng-dẫn-sử-dụng-script-lấy-lịch-học-epu-trên-github-📅"><strong>Hướng Dẫn Sử Dụng Script Lấy Lịch Học EPU trên
        GitHub</strong> 📅</h1>
<h2 id="1-tạo-biến-môi-trường-⚙️">1. Tạo Biến Môi Trường ⚙️</h2>
<ul>
    <li>
        <p>Fork repository này về.</p>
    </li>
    <li>
        <p>Trong repository của bạn:</p>
        <ul>
            <li>
                <p>Truy cập tab <strong>Settings</strong> ⚙️.</p>
            </li>
            <li>
                <p>Chọn <strong>Secrets</strong> từ menu bên trái.</p>
            </li>
            <li>
                <p>Nhấp vào <strong>New repository secret</strong>.</p>
            </li>
        </ul>
    </li>
    <li>
        <p>Tạo hai secrets</p>
        <ul>
            <li><code>USERNAME</code>: Tên đăng nhập Cổng Thông tin Sinh viên EPU của bạn.</li>
            <li><code>PASSWORD</code>: Mật khẩu Cổng Thông tin Sinh viên EPU của bạn.</li>
        </ul>
    </li>
</ul>
<h2 id="2-cập-nhật-lịch-học-tự-động-🔄">2. Cập Nhật Lịch Học Tự Động 🔄</h2>
<p>GitHub Action đã được cấu hình để chạy tự động theo lịch trình 6 tiếng 1 lần và mỗi khi có sự thay đổi trong nhánh
    <strong>main</strong>.
</p>
<p>Nếu muốn thay đổi lịch trình, bạn có thể chỉnh sửa <strong>cron expression</strong> trong tệp
    <strong>main.yml</strong>.
</p>
<h2 id="3-triển-khai-trang-github-pages-🌐">3. Triển Khai Trang GitHub Pages 🌐</h2>
<ul>
    <li>
        <p>Trong repository của bạn:</p>
        <ul>
            <li>
                <p>Chọn tab <strong>Settings</strong> ⚙️.</p>
            </li>
            <li>
                <p>Di chuyển xuống phần <strong>Pages</strong>.</p>
            </li>
            <li>
                <p>Chọn branch <strong>page</strong> để deploy và lưu lại.</p>
            </li>
        </ul>
    </li>
</ul>
<p>Bạn có thể truy cập trang GitHub Pages của mình qua đường dẫn:</p>
<ul>
    <li>🔗 https://<code>tên-người-dùng</code>.github.io/<code>tên-repository</code></li>
</ul>
<p>Xem hướng dẫn thêm <strong>custom domain</strong> tại <a
        href="https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site">đây</a>.</p>
