(function () {

    const CHATBOT_URL = "https://kiemlamdongthap.github.io/Chatbot/";

    // ❌ tránh tạo trùng
    if (document.getElementById("chatbot-btn")) return;

    /* =========================
       STYLE
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
    `;
    document.head.appendChild(style);

    /* =========================
       BUTTON
    ========================= */
    const btn = document.createElement("div");
    btn.id = "chatbot-btn";
    btn.innerHTML = "👮";

    const badge = document.createElement("div");
    badge.id = "chatbot-badge";
    badge.innerText = "1";
    btn.appendChild(badge);

    document.body.appendChild(btn);

    /* =========================
       CLICK → OPEN TAB
    ========================= */
    btn.onclick = () => {
        window.open(CHATBOT_URL, "_blank");

        // optional: tắt badge sau khi click
        badge.remove();
    };

    /* =========================
       💣 CLEAN OLD WIDGET
    ========================= */
    (function () {
        const remove = () => {
            document.querySelectorAll('#chatbot-frame-container, #chatbot-frame, #chatbot-popup')
                .forEach(el => el.remove());
        };
        setInterval(remove, 1000);
    })();

})();