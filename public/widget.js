(function() {
    // 1. Tạo Nút bấm nổi (Icon 👮)
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
        -webkit-tap-highlight-color: transparent;
    `);
    document.body.appendChild(btn);

    // 2. Tạo Khung Iframe (Giao diện Chat)
    const frame = document.createElement('iframe');
    frame.src = 'https://kiemlamdongthap.github.io/Chatbot/';
    frame.setAttribute('style', `
        position: fixed;
        bottom: 90px;
        right: 20px;
        border: none;
        display: none;
        z-index: 2147483646;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        transition: all 0.3s ease;
        background: #fff;
        overflow: hidden;
    `);
    document.body.appendChild(frame);

    // 3. Tối ưu kích thước theo thiết bị (Responsive)
    function setResponsive() {
        const width = window.innerWidth;
        if (width <= 480) { // Mobile
            frame.style.width = 'calc(100% - 40px)';
            frame.style.height = '75vh';
            frame.style.right = '20px';
            frame.style.bottom = '85px';
        } else { // Desktop
            frame.style.width = '400px';
            frame.style.height = '600px';
            frame.style.right = '20px';
            frame.style.bottom = '90px';
        }
    }

    setResponsive();
    window.addEventListener('resize', setResponsive);

    // 4. Hiệu ứng Ẩn/Hiện chuyên nghiệp
    let isOpen = false;
    btn.onclick = (e) => {
        e.stopPropagation();
        isOpen = !isOpen;
        
        if (isOpen) {
            frame.style.display = 'block';
            frame.style.opacity = '0';
            frame.style.transform = 'translateY(20px)';
            setTimeout(() => {
                frame.style.opacity = '1';
                frame.style.transform = 'translateY(0)';
            }, 10);
            btn.style.transform = 'scale(0.9) rotate(15deg)';
            btn.innerHTML = '✖'; // Đổi icon sang dấu đóng
            btn.style.fontSize = '24px';
        } else {
            frame.style.opacity = '0';
            frame.style.transform = 'translateY(20px)';
            setTimeout(() => { frame.style.display = 'none'; }, 300);
            btn.style.transform = 'scale(1) rotate(0)';
            btn.innerHTML = '👮';
            btn.style.fontSize = '30px';
        }
    };

    // 5. Đóng chat khi bấm ra ngoài (tăng trải nghiệm)
    document.addEventListener('click', () => {
        if (isOpen && window.innerWidth <= 480) btn.click();
    });
})();