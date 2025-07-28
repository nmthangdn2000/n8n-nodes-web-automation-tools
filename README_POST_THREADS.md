# Post Threads Node

Node custom n8n để đăng bài lên Threads.com

## Tính năng

- Đăng bài với nội dung text
- Upload video (tùy chọn)
- Hỗ trợ đa nền tảng (Windows, MacOS, Linux)
- Tự động đăng nhập và đăng bài

## Cài đặt

1. Clone repository này
2. Chạy `npm install`
3. Build project: `npm run build`
4. Copy thư mục `dist` vào thư mục `custom` của n8n

## Sử dụng

### Tham số đầu vào

- **Description** (bắt buộc): Nội dung bài đăng
- **Media Files** (tùy chọn): Danh sách file media (ảnh/video)
  - **File Path**: Đường dẫn đến file
  - **File Type**: Loại file (Image/Video) - tối đa 1 video
- **Show Browser** (tùy chọn): Hiển thị browser (cần thiết cho lần đầu đăng nhập)
- **Is Close Browser** (tùy chọn): Đóng browser sau khi đăng bài
- **OS** (tùy chọn): Hệ điều hành (Windows/MacOS/Linux)

### Tham số đầu ra

- **url**: URL của bài đăng đã tạo
- **description**: Nội dung đã đăng
- **mediaFiles**: Danh sách file media đã upload
- **videoCount**: Số lượng video
- **imageCount**: Số lượng ảnh

## Lưu ý

- Cần đăng nhập vào Threads.com trước khi sử dụng
- Đảm bảo đường dẫn video chính xác và file tồn tại
- Node sẽ tự động xử lý việc đăng nhập và đăng bài

## Ví dụ

```javascript
// Input
{
  "description": "Hello Threads! This is my first post using n8n automation.",
  "videoPaths": [
    {
      "path": "C:/Users/YourUsername/Videos/my_video.mp4"
    }
  ],
  "showBrowser": false,
  "isCloseBrowser": true,
  "os": "windows"
}

// Output
{
  "url": "https://www.threads.com/@username/post/123456789",
  "description": "Hello Threads! This is my first post using n8n automation.",
  "videoPaths": ["C:/Users/YourUsername/Videos/my_video.mp4"]
}
```
