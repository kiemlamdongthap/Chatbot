(function() {
    let isOpen = false;
    let frameCreated = false;

    // 1. CHÈN CSS CƯỠNG CHẾ VÀO ĐẦU TRANG
    const style = document.createElement('style');
    style.innerHTML = `
        #chatbot-frame-container {
            position: fixed !important;
            bottom: 90px !important;
            right: 20px !important;
            width: 0px !important;
            height: 0px !important;
            z-index: 2147483646 !important;
            border: none !important;
            overflow: hidden !important;
            display: none !important; /* Mặc định ẩn hoàn toàn */
        }
        #chatbot-frame-container.active {
            display: block !important;
            width: 400px !important;
            height: 600px !important;
        }
        @media (max-width: 480px) {
            #chatbot-frame-container.active {
                width: calc(100% - 40px) !important;
                height: 75vh !important;
            }
        }
        #chatbot-frame {
            width: 100% !important;
            height: 100% !important;
            border: none !important;
            border-radius: 16px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.25) !important;
        }
    `;
    document.head.appendChild(style);

    // 2. Tạo Container rỗng (Không có Iframe bên trong)
    const container = document.createElement('div');
    container.id = 'chatbot-frame-container';
    document.body.appendChild(container);

    // 3. Tạo Nút bấm icon Cảnh sát
    const btn = document.createElement('div');
    btn.innerHTML = '👮';
    Object.assign(btn.style, {
        position: 'fixed', bottom: '20px', right: '20px', width: '60px', height: '60px',
        background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)',
        color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '30px', cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)', zIndex: '2147483647',
        transition: 'all 0.3s ease'
    });
    document.body.appendChild(btn);

    // 4. Xử lý logic Click
    btn.onclick = (e) => {
        e.stopPropagation();
        isOpen = !isOpen;

        if (isOpen) {
            // Chỉ khi click mới tạo Iframe và nạp SRC
            if (!frameCreated) {
                const frame = document.createElement('iframe');
                frame.id = 'chatbot-frame';
                frame.src = 'https://kiemlamdongthap.github.io/Chatbot/';
                container.appendChild(frame);
                frameCreated = true;
            }
            container.classList.add('active');
            btn.innerHTML = '✖';
        } else {
            container.classList.remove('active');
            btn.innerHTML = '👮';
        }
    };

    // Đóng khi click ngoài
    document.addEventListener('click', (e) => {
        if (isOpen && !container.contains(e.target) && e.target !== btn) {
            btn.click();
        }
    });
})();