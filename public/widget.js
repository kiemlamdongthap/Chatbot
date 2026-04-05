(function() {
    // 1. Tạo Nút bấm nổi
    const btn = document.createElement('div');
    btn.innerHTML = '👮';
    btn.setAttribute('style', `
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
    `);
    document.body.appendChild(btn);

    // 2. Tạo Khung Iframe
    const frame = document.createElement('iframe');
    frame.id = 'chatbot-frame'; // Đặt ID để khớp với ảnh inspect của bạn
    frame.src = 'https://kiemlamdongthap.github.io/Chatbot/';
    
    // Gán style cơ bản TRƯỚC khi append vào body
    Object.assign(frame.style, {
        position: 'fixed',
        right: '20px',
        bottom: '90px',
        border: 'none',
        display: 'none',
        zIndex: '2147483646',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        transition: 'all 0.3s ease',
        background: '#fff',
        opacity: '0',
        transform: 'translateY(20px)'
    });

    document.body.appendChild(frame);

    // 3. Tối ưu kích thước (Responsive)
    function setResponsive() {
        const width = window.innerWidth;
        if (width <= 480) {
            frame.style.width = 'calc(100% - 40px)';
            frame.style.height = '70vh';
        } else {
            frame.style.width = '380px'; // Kích thước chuẩn cho desktop
            frame.style.height = '600px';
        }
    }

    setResponsive();
    window.addEventListener('resize', setResponsive);

    // 4. Hiệu ứng Ẩn/Hiện
    let isOpen = false;
    btn.onclick = (e) => {
        e.stopPropagation();
        isOpen = !isOpen;
        
        if (isOpen) {
            frame.style.display = 'block';
            // Dùng setTimeout để trình duyệt kịp nhận diện display: block trước khi chạy animation
            setTimeout(() => {
                frame.style.opacity = '1';
                frame.style.transform = 'translateY(0)';
            }, 50);
            btn.style.transform = 'scale(0.9) rotate(90deg)';
            btn.innerHTML = '✖';
            btn.style.fontSize = '24px';
        } else {
            frame.style.opacity = '0';
            frame.style.transform = 'translateY(20px)';
            setTimeout(() => { 
                if(!isOpen) frame.style.display = 'none'; 
            }, 300);
            btn.style.transform = 'scale(1) rotate(0)';
            btn.innerHTML = '👮';
            btn.style.fontSize = '30px';
        }
    };

    // 5. Đóng khi bấm ra ngoài
    document.addEventListener('click', (e) => {
        // Chỉ đóng nếu click hoàn toàn ra ngoài iframe và nút bấm
        if (isOpen && !frame.contains(e.target) && e.target !== btn) {
            btn.click();
        }
    });
})();