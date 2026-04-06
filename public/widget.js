(function() {
    let isOpen = false;

    // 1. Tạo một "Chiếc hộp tàng hình" để chứa Iframe
    // Chiếc hộp này sẽ giúp cô lập Iframe khỏi sự ảnh hưởng của Tailwind
    const container = document.createElement('div');
    container.id = 'chatbot-container';
    Object.assign(container.style, {
        position: 'fixed',
        bottom: '90px',
        right: '20px',
        width: '0px',
        height: '0px',
        zIndex: '2147483646',
        overflow: 'visible', // Cho phép Iframe hiện ra khi cần
        pointerEvents: 'none'
    });
    document.body.prepend(container);

    // 2. Tạo Iframe bên trong hộp
    const frame = document.createElement('iframe');
    frame.id = 'chatbot-frame';
    frame.src = 'https://kiemlamdongthap.github.io/Chatbot/';
    
    // Thiết lập CSS cưỡng chế cao nhất
    const frameStyles = {
        'display': 'none',
        'width': '0px',
        'height': '0px',
        'border': 'none',
        'border-radius': '16px',
        'box-shadow': '0 10px 30px rgba(0,0,0,0.25)',
        'transition': 'all 0.3s ease',
        'opacity': '0',
        'transform': 'translateY(20px)',
        'background': '#fff'
    };

    for (const [prop, value] of Object.entries(frameStyles)) {
        frame.style.setProperty(prop, value, 'important');
    }
    container.appendChild(frame);

    // 3. Tạo Nút bấm (Giữ nguyên icon Cảnh sát của bạn)
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
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });
    document.body.appendChild(btn);

    function updateSize() {
        if (!isOpen) return;
        const isMobile = window.innerWidth <= 480;
        frame.style.setProperty('width', isMobile ? 'calc(100vw - 40px)' : '400px', 'important');
        frame.style.setProperty('height', isMobile ? '70vh' : '600px', 'important');
    }

    btn.onclick = (e) => {
        e.stopPropagation();
        isOpen = !isOpen;
        
        if (isOpen) {
            frame.style.setProperty('display', 'block', 'important');
            frame.style.setProperty('pointer-events', 'auto', 'important');
            updateSize();
            
            setTimeout(() => {
                frame.style.setProperty('opacity', '1', 'important');
                frame.style.setProperty('transform', 'translateY(0)', 'important');
            }, 10);

            btn.innerHTML = '✖';
            btn.style.transform = 'scale(0.9) rotate(90deg)';
        } else {
            frame.style.setProperty('opacity', '0', 'important');
            frame.style.setProperty('transform', 'translateY(20px)', 'important');
            frame.style.setProperty('pointer-events', 'none', 'important');

            setTimeout(() => { 
                if(!isOpen) {
                    frame.style.setProperty('display', 'none', 'important');
                    frame.style.setProperty('width', '0px', 'important');
                    frame.style.setProperty('height', '0px', 'important');
                }
            }, 300);
            
            btn.innerHTML = '👮';
            btn.style.transform = 'scale(1) rotate(0)';
        }
    };

    window.addEventListener('resize', updateSize);
})();