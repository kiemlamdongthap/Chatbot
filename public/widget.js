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

    // 1. Tạo Nút bấm nổi
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

    // 2. TẠO IFRAME VỚI THIẾT LẬP ẨN NGAY TỪ ĐẦU (CRITICAL)
    const frame = document.createElement('iframe');
    frame.id = 'chatbot-frame';
    frame.src = 'https://kiemlamdongthap.github.io/Chatbot/';
    
    // ÉP KIỂU INLINE TRỰC TIẾP TRƯỚC KHI APPEND VÀO BODY
    // Điều này ngăn chặn trình duyệt render kích thước 300x150 mặc định
    frame.style.setProperty('position', 'fixed', 'important');
    frame.style.setProperty('bottom', '90px', 'important');
    frame.style.setProperty('right', '20px', 'important');
    frame.style.setProperty('width', '0px', 'important');
    frame.style.setProperty('height', '0px', 'important');
    frame.style.setProperty('display', 'none', 'important');
    frame.style.setProperty('border', 'none', 'important');
    frame.style.setProperty('z-index', '2147483646', 'important');
    frame.style.setProperty('opacity', '0', 'important');
    frame.style.setProperty('border-radius', '16px', 'important');

    // Chèn vào đầu body để đảm bảo không bị dính layout tĩnh bên dưới
    document.body.prepend(frame);
    document.body.appendChild(btn);

    // 3. Hàm tính toán kích thước khi mở
    function updateFrameSize() {
        if (!isOpen) return;
        const isMobile = window.innerWidth <= 480;
        frame.style.setProperty('width', isMobile ? 'calc(100% - 40px)' : '400px', 'important');
        frame.style.setProperty('height', isMobile ? '75vh' : '600px', 'important');
    }

    // 4. Sự kiện Click
    btn.onclick = (e) => {
        e.stopPropagation();
        isOpen = !isOpen;
        
        if (isOpen) {
            frame.style.setProperty('display', 'block', 'important');
            updateFrameSize();
            
            setTimeout(() => {
                frame.style.setProperty('opacity', '1', 'important');
                frame.style.setProperty('transform', 'translateY(0)', 'important');
            }, 50);
            
            btn.innerHTML = '✖';
            btn.style.fontSize = '24px';
            btn.style.transform = 'scale(0.9) rotate(90deg)';
        } else {
            frame.style.setProperty('opacity', '0', 'important');
            frame.style.setProperty('transform', 'translateY(20px)', 'important');
            
            setTimeout(() => { 
                if(!isOpen) {
                    frame.style.setProperty('display', 'none', 'important');
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
            btn.click();
        }
    });

    window.addEventListener('resize', updateFrameSize);
})();