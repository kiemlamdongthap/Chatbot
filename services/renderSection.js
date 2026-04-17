const safe = (v, fallback = "—") => 
    v === undefined || v === null || v === "" ? fallback : v;

const formatDocs = (documents) => {
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
        return "— Không có yêu cầu hồ sơ cụ thể.";
    }
    const isProduction = process.env.NODE_ENV === 'production';
    
    const BASE_URL = isProduction 
        ? "https://chatbot-jqsw.onrender.com" 
        : "http://localhost:10000";
    return documents.map((d) => {
        const name = typeof d === "string" ? d : (d?.name || "Tài liệu");
        const fileUrl = d?.file || d?.url;
        if (!fileUrl) return "• " + name;
        const fullUrl = fileUrl.startsWith("http") ? fileUrl : BASE_URL + (fileUrl.startsWith('/') ? '' : '/') + fileUrl;
        return `• ${name} [Tải mẫu](${fullUrl})`; 
    }).join("\n");
};

export const renderSection = {
    // 1. Hotline PCCCR
    hotline: (item) => {
        const main = item.contacts?.find(c => c.main) || item.contacts?.[0];
        const others = item.contacts?.filter(c => c !== main)
            .map(c => `• ${c.name} (${c.pos}): ${c.phone}`).join("<br>");

        return `
🚨 THÔNG TIN LIÊN LẠC KHẨN CẤP KHI CHÁY RỪNG 🚨 
---
🏛️ ĐƠN VỊ: ${item.chu_rung.toUpperCase()}

🔥 HOTLINE BÁO CHÁY: ${main?.phone || "—"}
👤 Người phụ trách: ${main?.name || "—"} (${main?.pos || "—"})

📞 Các số liên hệ phối hợp khác:
${others || "—"}
`.trim();
    },

    // 2. Lệ phí thực hiện
    le_phi: (proc) => {
        // Trong ảnh của bạn, dữ liệu này có thể đang nằm ở trường 'aiFees' hoặc 'le_phi'
        const content = proc.aiFees || proc.le_phi || "Miễn phí hoặc chưa có quy định cụ thể.";
        return `
            <div class="render-section">
                💰 <b>Lệ phí thực hiện:</b>
                <div class="info-box" style="margin-top:5px; padding:10px; background:#f9f9f9; border-radius:5px; border-left:3px solid #2ecc71;">
                    ${content}
                </div>
            </div>`;
    },

    // 3. Thời gian giải quyết
    thoi_gian: (proc) => {
        // Trong ảnh là: "14 ngày làm việc kể từ ngày nhận hồ sơ hợp lệ"
        // Trường tương ứng thường là 'processingTime' hoặc 'thoi_gian'
        const content = proc.processingTime || proc.thoi_gian || "Theo quy định pháp luật hiện hành.";
        return `
            <div class="render-section">
                ⏱ <b>Thời gian giải quyết:</b>
                <div class="info-box" style="margin-top:5px; padding:10px; background:#f9f9f9; border-radius:5px; border-left:3px solid #3498db;">
                    ${content}
                </div>
            </div>`;
    },
    
    // 2. Chủ rừng
    chu_rung: (item) => {
        const d = item.data || {};
        const history = (item.history?.length > 0) 
            ? `\n📖 Lịch sử hình thành:\n${item.history.map(line => `• ${line}`).join("\n")}` 
            : "";

        return `
📜 CẨM NANG: ${item.title.toUpperCase()}
---
👤 Đại diện: ${safe(item.nguoi_dai_dien)} | 🎖️ ${safe(item.chuc_vu)} | 📞 ${safe(item.so_dien_thoai)}
📑 Mục đích sử dụng: ${safe(item.type)}
📐 Đất lâm nghiệp: ${safe(d.dien_tich_lam_nghiep)} ha
🌳 Diện tích có rừng: ${safe(d.dien_tich_rung)} ha
🏛 Hạt quản lý: ${safe(d.hat_quan_ly)}
${history}
`.trim();
    },

    // 3. Thủ tục hành chính
    thu_tuc: (p) => {
        const title = safe(p.title).toUpperCase();
        const docsContent = p.documents ? ("\n" + formatDocs(p.documents)) : "—";
        return `
Tên TTHC: ${title} (Mã TTHC: ${safe(p.code)})

🔄 Trình tự thực hiện: ${safe(p.steps)}
📍 Địa điểm thực hiện: ${Array.isArray(p.location) ? p.location.join("; ") : safe(p.location)}
⚡ Cách thức thực hiện: ${safe(p.method)}
📄 Thành phần hồ sơ: ${docsContent}
⏱ Thời hạn giải quyết: ${safe(p.processingTime)}
👤 Đối tượng thực hiện: ${safe(p.target)}
🏛 Cơ quan giải quyết: ${safe(p.authority)}
✅ Kết quả: ${safe(p.result)}
💰 Lệ phí: ${safe(p.aiFees)}
⚖️ Điều kiện thực hiện: ${safe(p.condition, "Không")}
📜 Căn cứ pháp lý: ${safe(p.legal_basis)}
`.trim();
    },

  // 4. Xử lý vi phạm
  vi_pham: (data) => {
    const punishments = data.punishments.map(p => {
        const detail = p.cases.map(c => ` ${c}`).join("<br>");
        return `<details style="margin-top:10px;border:1px solid #ccc;padding:8px;border-radius:4px;cursor:pointer;"><summary style="font-weight:bold;color:#b91c1c;outline:none;"> Khoản ${p.clause}: ${p.fine_range} (Xem chi tiết)</summary><div style="padding:10px 0 5px 20px;color:#333;border-top:1px dashed #eee;margin-top:5px;">${detail}</div></details>`;
    }).join("");

    let unitGuide = "";
    if (data.interactive_steps && data.interactive_steps.length > 0) {
        const unitName = data.calculation_unit || "mức độ";
        unitGuide = `<div style="margin-top:15px;padding:10px;background:#e3f2fd;border-radius:4px;border-left:4px solid #2196f3;">
            <strong>🔍 Công cụ tính nhanh:</strong><br>
            Vui lòng chọn <b>${unitName}</b> bên dưới để xác định chính xác Khoản phạt.
        </div>`;
    }

    const html = `<div class="legal-response" style="font-family:sans-serif;line-height:1.5;"><h3 style="color:#b91c1c;border-bottom:2px solid #b91c1c;padding-bottom:5px;">⚖️ ${data.article}: ${data.title.toUpperCase()}</h3><p style="margin:10px 0;"><strong>📖 Mô tả:</strong> ${data.description}</p>${punishments}${unitGuide}<div style="margin-top:15px;padding:10px;background:#fff3e0;border-radius:4px;"><strong>🛠️ Khắc phục:</strong> ${data.remedy?.content || "Theo quy định."}</div><p style="font-size:12px;color:#666;margin-top:10px;">📜 <b>Căn cứ:</b> ${data.legal_basis?.join(", ")}</p></div>`;

    return {
        html: html.replace(/\n/g, "").replace(/\s\s+/g, " "),
        choices: data.interactive_steps?.[0]?.options || []
    };
  },
  

  // Gộp tất cả logic tương tác Bot vào một hàm duy nhất bên trong renderSection
  handleBotLogic: (selectedValue, currentArticleData, allData) => {
    // Tình huống A: Xem chi tiết Khoản từ nút bấm cuối cùng
    if (selectedValue.includes("Khoản") && selectedValue.includes("Điều")) {
        const match = selectedValue.match(/Điều (\d+)/);
        const articleIdNum = match ? match[1] : null;
        if (articleIdNum) {
            const targetArticle = allData.find(a => a.id === `dieu_${articleIdNum.padStart(2, '0')}`);
            if (targetArticle) {
                // Sử dụng renderSection.vi_pham để lấy HTML (vì this đôi khi bị sai ngữ cảnh)
                const result = renderSection.vi_pham(targetArticle);
                return {
                    text: result.html,
                    choices: [
                        { text: "⚖️ Hành vi khác", value: "menu_chinh" },
                        { text: "🔄 Tính lại Điều này", value: targetArticle.id }
                    ]
                };
            }
        }
    }
    
    // Tình huống C: Người dùng chọn đối tượng (Rừng SX, Phòng hộ...) - check_
    if (selectedValue.startsWith('check_')) {
        const nextStep = currentArticleData.calculation_map[selectedValue];
        if (nextStep) {
            return {
                text: `<b>${currentArticleData.article}</b>: ${nextStep.question}`,
                choices: nextStep.choices.map(c => ({
                    text: c.text,
                    value: `finish_${currentArticleData.id}_${c.result}` 
                }))
            };
        }
    }

    // Tình huống D: Kết quả phạt cuối cùng - finish_
    if (selectedValue.startsWith('finish_')) {
        const parts = selectedValue.split('_');
        const clauseTarget = parts[parts.length - 1]; 
        const punishment = currentArticleData.punishments.find(p => `Khoản ${p.clause}` === clauseTarget);
        
        return {
            text: `✅ <b>Kết quả xác định:</b><br>Hành vi của bạn thuộc <b>${clauseTarget}</b>, ${currentArticleData.article}.<br>💰 <b>Mức phạt:</b> ${punishment.fine_range}`,
            choices: [
                { text: `📖 Xem chi tiết ${clauseTarget}`, value: `${currentArticleData.article} ${clauseTarget}` },
                { text: "⚖️ Hành vi khác", value: "menu_chinh" }
            ]
        };
    }
    return null;
  },

  // 5. Thông tin Xã
  xa: (p) => {
    const d = p.data || {};
    const cuLyRaw = safe(d.Cu_ly_di_chuyen || d["Cu ly di chuyen"]);
    let cuLyFormatted = "—";

    if (cuLyRaw !== "—") {
        cuLyFormatted = cuLyRaw
            .split(/<p>|<\/p>|\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => `    • ${line}`)
            .join("\n");
    }

    const rawCoords = safe(d.Toa_do || d.To_do); 
    let googleMapsLink = "—";
    if (rawCoords !== "—") {
        const cleanCoords = rawCoords.replace(/\s/g, "");
        googleMapsLink = `[Xem bản đồ](https://www.google.com/maps/search/?api=1&query=${cleanCoords})`;
    }
	 
    return `
🏛️ THÔNG TIN VỀ: ${safe(p.title).toUpperCase()}
---
🔹 Xã sáp nhập: ${safe(d.xa_cu)}
🔹 Trụ sở: ${googleMapsLink}
🔹 Diện tích tự nhiên: ${safe(d.dien_tich_tu_nhien)} ha
🔹 Đất lâm nghiệp: ${safe(d.dien_tich_lam_nghiep)} ha
🔹 Diện tích có rừng: ${safe(d.dien_tich_rung)} ha
🔹 Chủ rừng: ${safe(d.chu_rung)}
🔹 Hạt quản lý: ${safe(d.hat_quan_ly)}
🔹 Cự ly di chuyển đến xã:
${cuLyFormatted}
`.trim();
  },

  "hồ_sơ": (p) => `📄 THÀNH PHẦN HỒ SƠ:\n\n${formatDocs(p.documents)}`
};
