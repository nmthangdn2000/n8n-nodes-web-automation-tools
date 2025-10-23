# TikTok Interaction Node

Node này cho phép bạn tương tác với các video TikTok thông qua các hành động như like, comment, follow, share, save và view.

## Tính năng

- **Like Video**: Thích video TikTok
- **Comment**: Bình luận trên video với text, emoji hoặc mention
- **Follow**: Theo dõi người dùng TikTok
- **Share**: Chia sẻ video với các tùy chọn khác nhau
- **Save**: Lưu video vào bộ sưu tập
- **View**: Xem video trong thời gian chỉ định

## Cách sử dụng

### 1. Cấu hình cơ bản

- **Video URL**: URL của video TikTok cần tương tác
- **Interaction Type**: Loại tương tác muốn thực hiện
- **Browser Settings**: Cấu hình trình duyệt (tùy chọn)

### 2. Các loại tương tác

#### Like Video

- Đơn giản chỉ cần chọn "Like" trong Interaction Type
- Node sẽ tự động tìm và click nút like

#### Comment

- Chọn "Comment" trong Interaction Type
- Nhập nội dung comment trong "Comment Text"
- Chọn loại comment: Text, Emoji, hoặc Mention
- Nếu chọn Mention, nhập username trong "Target Username"

#### Follow

- Chọn "Follow" trong Interaction Type
- Node sẽ tự động follow người dùng của video

#### Share

- Chọn "Share" trong Interaction Type
- Chọn loại chia sẻ:
  - Copy Link: Sao chép link
  - Share To Story: Chia sẻ lên story
  - Share To DM: Chia sẻ qua tin nhắn
  - Share To Other: Chia sẻ qua các phương thức khác

#### Save

- Chọn "Save" trong Interaction Type
- Node sẽ lưu video vào bộ sưu tập

#### View

- Chọn "View" trong Interaction Type
- Thiết lập thời gian xem trong "Wait Time (ms)"

### 3. Cấu hình nâng cao

- **Max Retries**: Số lần thử lại tối đa nếu thất bại (mặc định: 3)
- **Wait Time**: Thời gian chờ khi xem video (chỉ áp dụng cho View)
- **Target Username**: Username để mention trong comment hoặc follow

## Lưu ý

1. **Đăng nhập**: Đảm bảo đã đăng nhập TikTok trước khi sử dụng
2. **Browser Settings**: Có thể cần thiết lập browser settings để tránh bị chặn
3. **Rate Limiting**: Tránh thực hiện quá nhiều tương tác trong thời gian ngắn
4. **URL Format**: Đảm bảo URL TikTok đúng định dạng

## Ví dụ sử dụng

### Like một video

```
Video URL: https://www.tiktok.com/@username/video/1234567890
Interaction Type: Like
```

### Comment trên video

```
Video URL: https://www.tiktok.com/@username/video/1234567890
Interaction Type: Comment
Comment Text: Great video! 👍
Comment Type: Text
```

### Follow người dùng

```
Video URL: https://www.tiktok.com/@username/video/1234567890
Interaction Type: Follow
```

### Chia sẻ video

```
Video URL: https://www.tiktok.com/@username/video/1234567890
Interaction Type: Share
Share Type: Copy Link
```

## Xử lý lỗi

Node sẽ tự động xử lý các trường hợp:

- Video đã được like/save trước đó
- Người dùng đã được follow
- Lỗi mạng hoặc timeout
- Modal cảnh báo hoặc popup

## Kết quả trả về

Node sẽ trả về thông tin:

- `success`: Trạng thái thành công
- `message`: Thông báo kết quả
- `interactionType`: Loại tương tác đã thực hiện
- `videoUrl`: URL video đã tương tác
- `warn`: Cảnh báo (nếu có)
- `error`: Lỗi (nếu có)
