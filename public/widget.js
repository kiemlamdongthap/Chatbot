(function() {
    // 1. CHÈN CSS TRỰC TIẾP VÀO HEAD (Giải quyết triệt để lỗi 300x150)
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
            pointer-events: none !important;
        }
        #chatbot-frame.is-open {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }
    `;
    document.head.appendChild(style);

    let isOpen = false;

    // 2. Tạo Nút bấm nổi
    const btn = document.createElement('div');
    btn.id = 'chatbot-launcher';
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
        userSelect: 'none',
        webkitTapHighlightColor: 'transparent'
    });

    // 3. Tạo Iframe
    const frame = document.createElement('iframe');
    frame.id = 'chatbot-frame';
    frame.src = 'https://kiemlamdongthap.github.io/Chatbot/';
    
    // Đưa vào DOM (Dùng prepend để nó nằm trên cùng của body)
    document.body.prepend(frame);
    document.body.appendChild(btn);

    // 4. Hàm tính toán kích thước thực tế
    function updateSize() {
        if (!isOpen) return;
        const isMobile = window.innerWidth <= 480;
        frame.style.setProperty('width', isMobile ? 'calc(100% - 40px)' : '400px', 'important');
        frame.style.setProperty('height', isMobile ? '75vh' : '600px', 'important');
    }

    // 5. Xử lý Toggle
    btn.onclick = (e) => {
        if (e) e.stopPropagation();
        isOpen = !isOpen;
        
        if (isOpen) {
            frame.classList.add('is-open');
            updateSize();
            btn.innerHTML = '✖';
            btn.style.fontSize = '24px';
            btn.style.transform = 'scale(0.9) rotate(90deg)';
        } else {
            frame.classList.remove('is-open');
            // Reset lại kích thước về 0 sau khi hiệu ứng ẩn kết thúc
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

    // Đóng khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (isOpen && !frame.contains(e.target) && e.target !== btn) {
            btn.onclick();
        }
    });

    window.addEventListener('resize', updateSize);
})();