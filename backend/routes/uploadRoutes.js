const express = require("express");
const router = express.Router();
const formidable = require("formidable");
const fs = require("fs").promises;
const path = require("path");
const db = require("../db");
const { v4: uuidv4 } = require("uuid");

// Hàm trích xuất nội dung từ file (hỗ trợ .txt, .docx, .pdf cơ bản)
async function extractTextFromFile(filePath, originalFilename) {
    const ext = path.extname(originalFilename).toLowerCase(); // Sử dụng tên file gốc để lấy phần mở rộng
    let content = "";

    try {
        console.log("Processing file with extension:", ext); // Log định dạng file
        if (ext === ".txt") {
            content = await fs.readFile(filePath, "utf-8");
        } else if (ext === ".docx") {
            const docx = require("docx");
            const doc = await docx.readFile(filePath);
            content = doc.getText();
        } else if (ext === ".pdf") {
            const pdfParse = require("pdf-parse");
            const data = await pdfParse(await fs.readFile(filePath));
            content = data.text;
        } else {
            throw new Error("Định dạng file không được hỗ trợ");
        }
        return content;
    } catch (error) {
        throw new Error(`Lỗi trích xuất nội dung: ${error.message}`);
    }
}

// Route /api/upload-analyze
router.post("/upload-analyze", async (req, res) => {
    const form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, "../uploads");
    form.keepExtensions = true;

    let filePath = null; // Khai báo filePath ngoài try để kiểm soát phạm vi

    try {
        // Tạo thư mục uploads nếu chưa tồn tại
        await fs.mkdir(form.uploadDir, { recursive: true });

        // Xử lý file tải lên
        const [fields, files] = await form.parse(req);

        if (!files.file) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn file để tải lên" });
        }

        const file = files.file[0];
        filePath = file.filepath; // Đường dẫn file tạm
        const originalFilename = file.originalFilename; // Tên file gốc từ client
        console.log("File path:", filePath); // Log đường dẫn file
        console.log("File name:", originalFilename); // Log tên file gốc

        const userEmail = fields.user_email ? fields.user_email[0] : null;

        if (!userEmail) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin user_email" });
        }

        // Trích xuất nội dung từ file
        const content = await extractTextFromFile(filePath, originalFilename);

        // Lưu vào lịch sử
        const requestId = uuidv4();
        await new Promise((resolve, reject) => {
            db.query(
                "INSERT INTO history (user_email, topic, category, language, content, created_at, request_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [userEmail, "Tải lên và phân tích", "UploadAnalyze", "vi", content, new Date(), requestId],
                (err, result) => {
                    if (err) {
                        console.error("Error saving to history:", err);
                        return reject(new Error("Lỗi lưu vào lịch sử: " + err.message));
                    }
                    resolve(result);
                }
            );
        });

        // Xóa file tạm sau khi xử lý thành công
        await fs.unlink(filePath);

        res.status(200).json({
            success: true,
            message: "Tải lên và phân tích thành công",
            content,
            request_id: requestId,
        });
    } catch (error) {
        console.error("Error in upload-analyze:", error.message);
        // Xóa file nếu filePath đã được gán
        if (filePath) {
            await fs.unlink(filePath).catch((err) => console.error("Lỗi xóa file:", err));
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;