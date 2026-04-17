import fs from "fs";
import path from "path";

const REG_DIR = "./data/regulations";

export const searchRegulation = (queryNorm) => {
    const files = fs.readdirSync(REG_DIR);
    
    for (const file of files) {
        if (file.endsWith(".json")) {
            const content = JSON.parse(fs.readFileSync(path.join(REG_DIR, file), "utf-8"));
            // So khớp không dấu giữa query và mảng keywords
            const isMatch = content.keywords?.some(k => 
                queryNorm.includes(k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d"))
            );

            if (isMatch) return content;
        }
    }
    return null;
};