## API EPU TKB

### Endpoint

- Phương thức: `POST`
- URL: `/schedule`

### Tham số yêu cầu

| Tham số   | Kiểu dữ liệu | Bắt buộc |
|-----------|--------------|----------|
| mssv      | string       | Có       |
| password  | string       | Có       |
#### Request

```
POST /schedule HTTP/1.1
Host: linhcute.shop
Content-Type: application/x-www-form-urlencoded

mssv=123456789&password=secretpassword
```

#### Error
Nếu xác thực thất bại hoặc thiếu các tham số bắt buộc, API sẽ trả về phản hồi lỗi sau:

```
HTTP/1.1 200 OK
Content-Type: text/plain

Sai mật khẩu hoặc MSSV. Vui lòng nhập lại!
```

## HDSD

#### Python

```python
import requests

url = 'https://linhcute.shop/schedule'
data = {
    'mssv': '123456789',
    'password': 'secretpassword'
}

response = requests.post(url, data=data)

if response.status_code == 200:
    print(response.text)
else:
    print('Lỗi kết nối đến API')
```

#### JavaScript

```javascript
const url = 'https://linhcute.shop/schedule';
const data = new URLSearchParams();
data.append('mssv', '123456789');
data.append('password', 'secretpassword');

fetch(url, {
  method: 'POST',
  body: data
})
.then(response => response.text())
.then(result => {
  console.log(result);
})
.catch(error => {
  console.error('Lỗi kết nối đến API', error);
});
```

### cURL

```bash
curl -X POST -d "mssv=123456789&password=secretpassword" https://linhcute.shop/schedule
```