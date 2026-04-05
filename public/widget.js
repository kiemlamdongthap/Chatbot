(function () {
    let isOpen = false;
    let frame = null;

    // 1. Nút chatbot
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
        transition: 'all 0.3s ease',
        userSelect: 'none'
    });

    document.body.appendChild(btn);

    // 2. Tạo iframe (lazy load)
    function createFrame() {
        frame = document.createElement('iframe');
        frame.src = 'https://kiemlamdongthap.github.io/Chatbot/';

        Object.assign(frame.style, {
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '0px',
            height: '0px',
            border: 'none',
            opacity: '0',
            transform: 'scale(0.8)',
            pointerEvents: 'none',
            transition: 'all 0.3s ease',
            zIndex: '9998'
        });

        document.body.appendChild(frame);
    }

    // 3. Resize responsive
    function updateSize() {
        if (!frame) return;

        const isMobile = window.innerWidth <= 480;

        frame.style.width = isMobile ? 'calc(100% - 40px)' : '400px';
        frame.style.height = isMobile ? '75vh' : '600px';
    }

    // 4. Toggle
    btn.onclick = (e) => {
        e.stopPropagation();
        isOpen = !isOpen;

        if (isOpen) {
            if (!frame) createFrame();

            updateSize();

            frame.style.opacity = '1';
            frame.style.transform = 'scale(1)';
            frame.style.pointerEvents = 'auto';

            btn.innerHTML = '✖';
            btn.style.transform = 'rotate(90deg) scale(0.9)';
            btn.style.fontSize = '24px';
        } else {
            frame.style.opacity = '0';
            frame.style.transform = 'scale(0.8)';
            frame.style.pointerEvents = 'none';

            setTimeout(() => {
                if (!isOpen) {
                    frame.style.width = '0px';
                    frame.style.height = '0px';
                }
            }, 300);

            btn.innerHTML = '👮';
            btn.style.transform = 'rotate(0) scale(1)';
            btn.style.fontSize = '30px';
        }
    };

    // 5. Click ngoài để đóng
    document.addEventListener('click', (e) => {
        if (isOpen && frame && !frame.contains(e.target) && e.target !== btn) {
            btn.click();
        }
    });

    window.addEventListener('resize', updateSize);
})();