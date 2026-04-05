(function() {
    let isOpen = false;

    // 1. Cấu hình hằng số để dễ quản lý
    const CONFIG = {
        iframeSrc: 'https://kiemlamdongthap.github.io/Chatbot/',
        mobileWidth: 'calc(100% - 40px)',
        desktopWidth: '400px',
        desktopHeight: '600px',
        zIndex: '2147483647'
    };

    // 2. Tạo Nút bấm nổi (Dùng CSS Class hoặc JS Style tập trung)
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
        zIndex: CONFIG.zIndex,
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        userSelect: 'none',
        webkitTapHighlightColor: 'transparent'
    });

    // 3. Tạo Khung Iframe (Dùng setProperty để ép !important triệt để)
    const frame = document.createElement('iframe');
    frame.id = 'chatbot-frame';
    frame.src = CONFIG.iframeSrc;
    
    const initialStyles = {
        'position': 'fixed',
        'bottom': '90px',
        'right': '20px',
        'width': '0px',
        'height': '0px',
        'border': 'none',
        'display': 'none',
        'z-index': (parseInt(CONFIG.zIndex) - 1).toString(),
        'border-radius': '16px',
        'box-shadow': '0 10px 30px rgba(0,0,0,0.25)',
        'transition': 'all 0.3s ease',
        'background': '#fff',
        'opacity': '0',
        'transform': 'translateY(20px)',
        'overflow': 'hidden'
    };

    for (const [prop, value] of Object.entries(initialStyles)) {
        frame.style.setProperty(prop, value, 'important');
    }

    // Chèn vào đầu body để tránh xung đột z-index với các phần tử cuối trang
    document.body.prepend(btn);
    document.body.prepend(frame);

    // 4. Hàm cập nhật kích thước (Tối ưu hóa performance với ResizeObserver hoặc Logic đơn giản)
    function updateFrameSize() {
        if (!isOpen) return;
        const isMobile = window.innerWidth <= 480;
        frame.style.setProperty('width', isMobile ? CONFIG.mobileWidth : CONFIG.desktopWidth, 'important');
        frame.style.setProperty('height', isMobile ? '75vh' : CONFIG.desktopHeight, 'important');
    }

    // 5. Xử lý Toggle Ẩn/Hiện
    function toggleChat(e) {
        if (e) e.stopPropagation();
        isOpen = !isOpen;

        if (isOpen) {
            frame.style.setProperty('display', 'block', 'important');
            updateFrameSize();
            
            // Delay cực ngắn để trigger CSS Transition
            requestAnimationFrame(() => {
                frame.style.setProperty('opacity', '1', 'important');
                frame.style.setProperty('transform', 'translateY(0)', 'important');
            });

            btn.style.transform = 'scale(0.9) rotate(90deg)';
            btn.innerHTML = '✖';
            btn.style.fontSize = '24px';
        } else {
            frame.style.setProperty('opacity', '0', 'important');
            frame.style.setProperty('transform', 'translateY(20px)', 'important');

            setTimeout(() => {
                if (!isOpen) {
                    frame.style.setProperty('display', 'none', 'important');
                    frame.style.setProperty('width', '0px', 'important');
                    frame.style.setProperty('height', '0px', 'important');
                }
            }, 300);

            btn.style.transform = 'scale(1) rotate(0)';
            btn.innerHTML = '👮';
            btn.style.fontSize = '30px';
        }
    }

    btn.onclick = toggleChat;

    // 6. Sự kiện bổ trợ (Resize & Click Out)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateFrameSize, 100); // Debounce resize
    });

    document.addEventListener('click', (e) => {
        if (isOpen && !frame.contains(e.target) && e.target !== btn) {
            toggleChat(e);
        }
    });
})();