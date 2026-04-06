(function () {
    let isOpen = false;

    const CHATBOT_URL = "https://kiemlamdongthap.github.io/Chatbot/";

    /* =========================
       1. STYLE
    ========================= */
    const style = document.createElement("style");
    style.innerHTML = `
        #chatbot-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 65px;
            height: 65px;
            border-radius: 50%;
            background: linear-gradient(135deg, #28a745, #1e7e34);
            color: white;
            font-size: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            z-index: 999999;
            transition: all 0.3s ease;
        }

        #chatbot-btn:hover {
            transform: scale(1.1) rotate(5deg);
        }

        /* Badge thông báo */
        #chatbot-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: red;
            color: white;
            font-size: 12px;
            padding: 4px 6px;
            border-radius: 50%;
            animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            70% { transform: scale(1.4); opacity: 0; }
            100% { transform: scale(1); opacity: 0; }
        }

        /* Popup container */
        #chatbot-popup {
            position: fixed;
            bottom: 95px;
            right: 20px;
            width: 380px;
            height: 550px;
            background: white;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
            transform: scale(0);
            opacity: 0;
            transform-origin: bottom right;
            transition: all 0.3s ease;
            z-index: 999998;
        }

        #chatbot-popup.active {
            transform: scale(1);
            opacity: 1;
        }

        #chatbot-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }

        /* Mobile */
        @media (max-width: 480px) {
            #chatbot-popup {
                width: calc(100% - 20px);
                height: 80vh;
                right: 10px;
            }
        }
    `;
    document.head.appendChild(style);

    /* =========================
       2. BUTTON
    ========================= */
    const btn = document.createElement("div");
    btn.id = "chatbot-btn";
    btn.innerHTML = "👮";

    // badge
    const badge = document.createElement("div");
    badge.id = "chatbot-badge";
    badge.innerText = "1";
    btn.appendChild(badge);

    document.body.appendChild(btn);

    /* =========================
       3. POPUP
    ========================= */
    const popup = document.createElement("div");
    popup.id = "chatbot-popup";

    const iframe = document.createElement("iframe");
    iframe.id = "chatbot-iframe";

    popup.appendChild(iframe);
    document.body.appendChild(popup);

    /* =========================
       4. CLICK LOGIC
    ========================= */
    btn.onclick = (e) => {
        e.stopPropagation();

        // 👉 CHỌN 1 TRONG 2 CÁCH:

        /* ===== CÁCH 1: POPUP (Messenger style) ===== */
        isOpen = !isOpen;

        if (isOpen) {
            if (!iframe.src) iframe.src = CHATBOT_URL;
            popup.classList.add("active");
            btn.innerHTML = "✖";
        } else {
            popup.classList.remove("active");
            btn.innerHTML = "👮";
        }

        /* ===== CÁCH 2: CHUYỂN TRANG (bật nếu muốn) ===== */
        // window.open(CHATBOT_URL, '_blank');
    };

    /* =========================
       5. CLICK OUTSIDE
    ========================= */
    document.addEventListener("click", (e) => {
        if (isOpen && !popup.contains(e.target) && e.target !== btn) {
            btn.click();
        }
    });

})();