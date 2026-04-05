(function() {
    let isOpen = false;

    // 1. Tạo Nút bấm nổi
    const btn = document.createElement('div');
    btn.innerHTML = '👮';
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 2147483647;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        user-select: none;
        -webkit-tap-highlight-color: transparent;
    `;
    document.body.appendChild(btn);

    // 2. Tạo Khung Iframe (Ép kích thước 0x0 ngay từ đầu)
    const frame = document.createElement('iframe');
    frame.id = 'chatbot-frame';
    frame.src = 'https://kiemlamdongthap.github.io/Chatbot/';
    frame.style.cssText = `
        position: fixed !important;
        bottom: 90px !important;
        right: 20px !important;
        width: 0px !important; 
        height: 0px !important;
        border: none !important;
        display: none !important;
        z-index: 2147483646 !important;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        transition: all 0.3s ease;
        background: #fff;
        opacity: 0;
        transform: translateY(20px);
    `;
    document.body.appendChild(frame);

    // 3. Hàm tính toán kích thước chuẩn
    function updateFrameSize() {
        if (!isOpen) return; // Chỉ tính toán khi đang mở
        if (window.innerWidth <= 480) {
            frame.style.width = 'calc(100% - 40px)';
            frame.style.height = '75vh';
        } else {
            frame.style.width = '400px';
            frame.style.height = '600px';
        }
    }

    // 4. Sự kiện Click xử lý Ẩn/Hiện
    btn.onclick = (e) => {
        e.stopPropagation();
        isOpen = !isOpen;
        
        if (isOpen) {
            frame.style.display = 'block';
            updateFrameSize(); // Gán kích thước thực tế khi mở
            
            setTimeout(() => {
                frame.style.opacity = '1';
                frame.style.transform = 'translateY(0)';
            }, 10);
            
            btn.style.transform = 'scale(0.9) rotate(90deg)';
            btn.innerHTML = '✖';
            btn.style.fontSize = '24px';
        } else {
            frame.style.opacity = '0';
            frame.style.transform = 'translateY(20px)';
            
            setTimeout(() => { 
                if(!isOpen) {
                    frame.style.display = 'none'; 
                    frame.style.width = '0px';  // Trả về 0 để không gây lỗi layout
                    frame.style.height = '0px';
                }
            }, 300);
            
            btn.style.transform = 'scale(1) rotate(0)';
            btn.innerHTML = '👮';
            btn.style.fontSize = '30px';
        }
    };

    // 5. Cập nhật lại kích thước nếu người dùng xoay màn hình
    window.addEventListener('resize', () => {
        if (isOpen) updateFrameSize();
    });

    // 6. Đóng khi bấm ra ngoài
    document.addEventListener('click', (e) => {
        if (isOpen && !frame.contains(e.target) && e.target !== btn) {
            btn.onclick(e);
        }
    });
})();