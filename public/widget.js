(function () {
    let isOpen = false;
    let container = null;
    let shadow = null;
    let frameCreated = false;

    // Nút chatbot
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
        zIndex: '2147483647'
    });

    document.body.appendChild(btn);

    btn.onclick = (e) => {
        e.stopPropagation();
        isOpen = !isOpen;

        // 👉 TẠO KHI CLICK LẦN ĐẦU
        if (isOpen && !container) {
            container = document.createElement('div');

            Object.assign(container.style, {
                position: 'fixed',
                bottom: '90px',
                right: '20px',
                width: '400px',
                height: '600px',
                zIndex: '2147483646'
            });

            // 🔥 SHADOW DOM
            shadow = container.attachShadow({ mode: 'open' });

            const wrapper = document.createElement('div');
            Object.assign(wrapper.style, {
                width: '100%',
                height: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                background: '#fff'
            });

            shadow.appendChild(wrapper);
            document.body.appendChild(container);
        }

        if (isOpen) {
            if (!frameCreated) {
                const frame = document.createElement('iframe');
                frame.src = 'https://kiemlamdongthap.github.io/Chatbot/';

                Object.assign(frame.style, {
                    width: '100%',
                    height: '100%',
                    border: 'none'
                });

                shadow.firstChild.appendChild(frame);
                frameCreated = true;
            }

            container.style.display = 'block';
            btn.innerHTML = '✖';
        } else {
            container.style.display = 'none';
            btn.innerHTML = '👮';
        }
    };

    document.addEventListener('click', (e) => {
        if (isOpen && container && !container.contains(e.target) && e.target !== btn) {
            btn.click();
        }
    });

})();