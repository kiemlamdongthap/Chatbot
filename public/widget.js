(function() {
    // 1. CHÈN CSS CƯỠNG CHẾ (Giải quyết lỗi 300x150 của trình duyệt/Tailwind)
    const style = document.createElement('style');
    style.innerHTML = `
        #chatbot-frame {
            position: fixed !important;
            bottom: 90px !important;
            right: 20px !important;
            width: 0px !important;
            height: 0px !important;
            border: none !important;
            display: none !important;
            visibility: hidden !important;
            z-index: 2147483646 !important;
            opacity: 0 !important;
            transition: all 0.3s ease !important;
        }
        #chatbot-frame.is-open {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(style);

    let isOpen = false;

    // 2. Tạo Nút bấm nổi
    const btn = document.createElement('div');
    btn.innerHTML = '👮';
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '30px',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        zIndex: '2147483647',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        userSelect: 'none'
    });

    // 3. Tạo Iframe
    const frame = document.createElement('iframe');
    frame.id = 'chatbot-frame';
    frame.src = 'https://kiemlamdongthap.github.io/Chatbot/';
    
    // Chèn vào đầu body
    document.body.prepend(frame);
    document.body.appendChild(btn);

    // 4. Hàm tính toán kích thước
    function updateFrameSize() {
        if (!isOpen) return;
        const isMobile = window.innerWidth <= 480;
        frame.style.setProperty('width', isMobile ? 'calc(100% - 40px)' : '400px', 'important');
        frame.style.setProperty('height', isMobile ? '75vh' : '600px', 'important');
    }

    // 5. Sự kiện Click
    btn.onclick = (e) => {
        if (e) e.stopPropagation();
        isOpen = !isOpen;
        
        if (isOpen) {
            frame.classList.add('is-open');
            updateFrameSize();
            
            btn.innerHTML = '✖';
            btn.style.fontSize = '24px';
            btn.style.transform = 'scale(0.9) rotate(90deg)';
        } else {
            frame.classList.remove('is-open');
            // Đợi animation chạy xong mới ẩn kích thước
            setTimeout(() => { 
                if(!isOpen) {
                    frame.style.setProperty('width', '0px', 'important');
                    frame.style.setProperty('height', '0px', 'important');
                }
            }, 300);
            
            btn.innerHTML = '👮';
            btn.style.fontSize = '30px';
            btn.style.transform = 'scale(1) rotate(0)';
        }
    };

    // Đóng khi bấm ra ngoài
    document.addEventListener('click', (e) => {
        if (isOpen && !frame.contains(e.target) && e.target !== btn) {
            btn.onclick();
        }
    });

    window.addEventListener('resize', updateFrameSize);
})();