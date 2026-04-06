(function() {
    // 1. CHÈN CSS VÀO ĐẦU TRANG (Khóa chết hiển thị ngay khi trình duyệt đọc file)
    const style = document.createElement('style');
    style.innerHTML = `
        #chatbot-frame {
            display: none !important;
            visibility: hidden !important;
            position: fixed !important;
            width: 0px !important;
            height: 0px !important;
            opacity: 0 !important;
            pointer-events: none !important;
            z-index: -1 !important; /* Đẩy xuống dưới cùng để không chiếm chỗ */
            border: none !important;
        }
        #chatbot-frame.is-open {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            z-index: 2147483646 !important;
            bottom: 90px !important;
            right: 20px !important;
            transition: all 0.3s ease !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    let isOpen = false;

    // 2. TẠO IFRAME VỚI THUỘC TÍNH HTML (Ngăn render 300x150 mặc định)
    const frame = document.createElement('iframe');
    frame.id = 'chatbot-frame';
    frame.src = 'https://kiemlamdongthap.github.io/Chatbot/';
    
    // Gán trực tiếp vào thuộc tính thẻ (Thắng mọi CSS reset)
    frame.setAttribute('width', '0');
    frame.setAttribute('height', '0');
    frame.setAttribute('style', 'display:none !important; width:0px !important; height:0px !important;');

    // 3. Tạo Nút bấm
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

    // Chèn vào đầu body
    document.body.prepend(frame);
    document.body.appendChild(btn);

    function updateSize() {
        if (!isOpen) return;
        const isMobile = window.innerWidth <= 480;
        frame.style.setProperty('width', isMobile ? 'calc(100% - 40px)' : '400px', 'important');
        frame.style.setProperty('height', isMobile ? '75vh' : '600px', 'important');
    }

    btn.onclick = (e) => {
        if (e) e.stopPropagation();
        isOpen = !isOpen;
        
        if (isOpen) {
            frame.classList.add('is-open');
            frame.style.setProperty('transform', 'translateY(20px)', 'important');
            updateSize();
            
            setTimeout(() => {
                frame.style.setProperty('transform', 'translateY(0)', 'important');
            }, 10);

            btn.innerHTML = '✖';
            btn.style.transform = 'scale(0.9) rotate(90deg)';
        } else {
            frame.classList.remove('is-open');
            setTimeout(() => { 
                if(!isOpen) {
                    frame.style.setProperty('width', '0px', 'important');
                    frame.style.setProperty('height', '0px', 'important');
                }
            }, 300);
            btn.innerHTML = '👮';
            btn.style.transform = 'scale(1) rotate(0)';
        }
    };

    document.addEventListener('click', (e) => {
        if (isOpen && !frame.contains(e.target) && e.target !== btn) btn.onclick();
    });

    window.addEventListener('resize', updateSize);
})();