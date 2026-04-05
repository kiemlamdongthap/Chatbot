(function () {
    let isOpen = false;
    let frame = null;

    // 1. Tạo nút
    const btn = document.createElement('div');
    btn.innerHTML = '👮';

    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        background: 'linear-gradient(135deg, #28a745, #1e7e34)',
        color: '#fff',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '30px',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        zIndex: '9999',
        transition: 'all 0.25s ease',
        userSelect: 'none'
    });

    document.body.appendChild(btn);

    // 2. Tạo iframe (chỉ 1 lần)
    function createFrame() {
        if (frame) return;

        frame = document.createElement('iframe');
        frame.src = 'https://kiemlamdongthap.github.io/Chatbot/';

        Object.assign(frame.style, {
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '400px',
            height: '600px',
            border: 'none',
            opacity: '0',
            transform: 'scale(0.9)',
            pointerEvents: 'none',
            transition: 'all 0.25s ease',
            zIndex: '9998'
        });

        document.body.appendChild(frame);
    }

    // 3. Responsive
    function updateSize() {
        if (!frame) return;

        const mobile = window.innerWidth <= 480;
        frame.style.width = mobile ? 'calc(100% - 40px)' : '400px';
        frame.style.height = mobile ? '75vh' : '600px';
    }

    // 4. Mở
    function openChat() {
        createFrame();
        updateSize();

        frame.style.opacity = '1';
        frame.style.transform = 'scale(1)';
        frame.style.pointerEvents = 'auto';

        btn.innerHTML = '✖';
        btn.style.transform = 'rotate(90deg) scale(0.9)';
        btn.style.fontSize = '24px';

        isOpen = true;
    }

    // 5. Đóng
    function closeChat() {
        if (!frame) return;

        frame.style.opacity = '0';
        frame.style.transform = 'scale(0.9)';
        frame.style.pointerEvents = 'none';

        btn.innerHTML = '👮';
        btn.style.transform = 'none';
        btn.style.fontSize = '30px';

        isOpen = false;
    }

    // 6. Toggle
    btn.onclick = (e) => {
        e.stopPropagation();
        isOpen ? closeChat() : openChat();
    };

    // 7. Click ngoài
    document.addEventListener('click', (e) => {
        if (!isOpen || !frame) return;

        const clickedInsideBtn = btn.contains(e.target);
        const clickedInsideFrame = frame === e.target;

        if (!clickedInsideBtn && !clickedInsideFrame) {
            closeChat();
        }
    });

    // 8. Resize
    window.addEventListener('resize', updateSize);
})();