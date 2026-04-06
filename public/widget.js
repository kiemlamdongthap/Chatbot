(function () {
    let isOpen = false;
    let container = null;
    let frameCreated = false;

    // 1. Inject CSS
    const style = document.createElement('style');
    style.innerHTML = `
        #chatbot-frame-container {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 400px;
            height: 600px;
            z-index: 2147483646;
            border: none;
            overflow: hidden;

            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translateY(20px);
            transition: all 0.3s ease;
        }

        #chatbot-frame-container.active {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transform: translateY(0);
        }

        @media (max-width: 480px) {
            #chatbot-frame-container {
                width: calc(100% - 40px);
                height: 75vh;
            }
        }

        #chatbot-frame {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }
    `;
    document.head.appendChild(style);

    // 2. Nút chatbot
    const btn = document.createElement('div');
    btn.innerHTML = '👮';

    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        background: 'linear-gradient(135deg, #28a745, #1e7e34)',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '30px',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        zIndex: '2147483647',
        transition: 'all 0.3s ease'
    });

    document.body.appendChild(btn);

    // 3. Click toggle
    btn.onclick = (e) => {
        e.stopPropagation();
        isOpen = !isOpen;

        // 👉 CHỈ TẠO KHI CLICK LẦN ĐẦU
        if (isOpen && !container) {
            container = document.createElement('div');
            container.id = 'chatbot-frame-container';

            document.body.appendChild(container);
        }

        if (isOpen) {
            if (!frameCreated) {
                const frame = document.createElement('iframe');
                frame.id = 'chatbot-frame';
                frame.src = 'https://kiemlamdongthap.github.io/Chatbot/';
                container.appendChild(frame);
                frameCreated = true;
            }

            container.classList.add('active');
            btn.innerHTML = '✖';
        } else {
            container.classList.remove('active');
            btn.innerHTML = '👮';
        }
    };

    // 4. Click ngoài để đóng
    document.addEventListener('click', (e) => {
        if (isOpen && container && !container.contains(e.target) && e.target !== btn) {
            btn.click();
        }
    });

})();