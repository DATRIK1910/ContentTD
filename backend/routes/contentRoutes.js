// const express = require("express");
// const router = express.Router();
// const formidable = require("formidable");
// const { v4: uuidv4 } = require("uuid");
// const db = require("../db");
// const { generateContentFromDescription, rewriteTextWithMistral, summarizeTextWithMistral } = require("../utils/mistral");
// const configg = require("../configg");
// const axios = require("axios");

// router.post("/api/history", (req, res) => {
//     const form = new formidable.IncomingForm();

//     form.parse(req, async (err, fields, files) => {
//         if (err) {
//             console.error("Error parsing form:", err);
//             return res.status(500).json({ success: false, message: "Lỗi xử lý form: " + err.message });
//         }

//         try {
//             const userEmail = fields.user_email ? fields.user_email[0] : null;
//             const topic = fields.topic ? fields.topic[0] : null;
//             const category = fields.category ? fields.category[0] : null;
//             const language = fields.language ? fields.language[0] : null;
//             const content = fields.content ? fields.content[0] : null;
//             const requestId = uuidv4();

//             if (!userEmail || !topic || !category || !language || !content) {
//                 return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc (user_email, topic, category, language, content)" });
//             }

//             await new Promise((resolve, reject) => {
//                 db.query(
//                     "INSERT INTO pending_contents (user_email, topic, category, language, content, created_at, status, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
//                     [userEmail, topic, category, language, content, new Date(), "PENDING", requestId],
//                     (err, result) => {
//                         if (err) {
//                             console.error("Error saving to pending_contents:", err);
//                             return reject(new Error("Lỗi lưu vào danh sách chờ xử lý: " + err.message));
//                         }
//                         resolve(result);
//                     }
//                 );
//             });

//             res.status(200).json({ success: true, message: "Nội dung đã được gửi và đang chờ hệ thống xử lý. Bạn vui lòng chờ trong ít phút!", request_id: requestId });
//         } catch (error) {
//             console.error("Error saving to pending_contents:", error.message);
//             res.status(500).json({ success: false, message: error.message });
//         }
//     });
// });

// router.get("/api/history", async (req, res) => {
//     try {
//         const { user_email } = req.query;

//         if (!user_email) {
//             return res.status(400).json({ success: false, message: "Email người dùng là bắt buộc" });
//         }

//         db.query(
//             "SELECT * FROM history WHERE user_email = ? ORDER BY created_at DESC",
//             [user_email],
//             (err, results) => {
//                 if (err) {
//                     console.error("Database error:", err.message, err.stack);
//                     return res.status(500).json({ success: false, message: "Lỗi server: Không thể lấy lịch sử" });
//                 }
//                 res.status(200).json({ success: true, history: results });
//             }
//         );
//     } catch (error) {
//         console.error("Get history error:", error.message, error.stack);
//         res.status(500).json({ success: false, message: "Lỗi server: Không thể lấy lịch sử" });
//     }
// });

// router.get("/api/notifications", (req, res) => {
//     const userEmail = req.query.user_email;

//     if (!userEmail) {
//         return res.status(400).json({ success: false, message: "Thiếu thông tin user_email" });
//     }

//     db.query("SELECT * FROM notifications WHERE user_email = ? ORDER BY created_at DESC", [userEmail], (err, results) => {
//         if (err) {
//             console.error("Error fetching notifications:", err);
//             return res.status(500).json({ success: false, message: "Lỗi khi lấy thông báo" });
//         }

//         res.status(200).json({ success: true, notifications: results });
//     });
// });

// router.get("/api/user-history", (req, res) => {
//     const userEmail = req.query.user_email;

//     if (!userEmail) {
//         return res.status(400).json({ success: false, message: "Thiếu thông tin user_email" });
//     }

//     db.query("SELECT * FROM history WHERE user_email = ? ORDER BY created_at DESC", [userEmail], (err, results) => {
//         if (err) {
//             console.error("Error fetching user history:", err);
//             return res.status(500).json({ success: false, message: "Lỗi khi lấy lịch sử nội dung" });
//         }

//         console.log("User history fetched:", results);
//         res.status(200).json({ success: true, history: results });
//     });
// });

// router.post("/api/generate-content", async (req, res) => {
//     try {
//         const { field, language, topic, keyword, length, user_email } = req.body;

//         if (!field || !language || !topic || !keyword || !length || !user_email) {
//             return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc (field, language, topic, keyword, length, user_email)" });
//         }

//         const languagePrompt = language === "vi" ? "bằng tiếng Việt" : "bằng tiếng Anh";

//         const prompt = `
//       Viết một bài quảng cáo ${languagePrompt} về chủ đề "${topic}" trong lĩnh vực "${field}", tập trung vào từ khóa chính "${keyword}".
//       Bài viết cần sáng tạo, tự nhiên, thu hút người đọc, và phù hợp với mục đích quảng cáo.
//       Nội dung phải:
//       - Mở đầu hấp dẫn, giới thiệu ngắn gọn về chủ đề, nhấn mạnh từ khóa "${keyword}".
//       - Phần thân bài trình bày chi tiết các lợi ích, đặc điểm nổi bật, và giá trị của sản phẩm/dịch vụ, lặp lại từ khóa "${keyword}" một cách tự nhiên 2-3 lần.
//       - Kết thúc bằng lời kêu gọi hành động mạnh mẽ, khuyến khích người đọc thực hiện hành động (mua hàng, liên hệ, tìm hiểu thêm, v.v.), sử dụng lại từ khóa "${keyword}" nếu phù hợp.
//       Độ dài bài viết khoảng ${length} từ. Tránh lan man, tập trung vào từ khóa và chủ đề chính.
//     `;

//         const response = await axios.post(
//             "https://api.mistral.ai/v1/chat/completions",
//             {
//                 model: "mistral-small",
//                 messages: [
//                     {
//                         role: "system",
//                         content: prompt,
//                     },
//                 ],
//                 max_tokens: length * 2,
//                 temperature: 0.7,
//             },
//             {
//                 headers: { Authorization: `Bearer ${configg.mistral.apiKey}` },
//             }
//         );

//         const generatedContent = response.data.choices[0].message.content;
//         const requestId = uuidv4();

//         await db.query(
//             "INSERT INTO pending_contents (user_email, topic, category, language, content, created_at, status, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
//             [user_email, topic, field, language, generatedContent, new Date(), "PENDING", requestId]
//         );

//         res.json({ success: true, message: "Nội dung đã được tạo và đang chờ hệ thống xử lý. Bạn vui lòng đợi trong ít phút!", request_id: requestId });
//     } catch (error) {
//         console.error("Error generating content:", error.message);
//         res.status(500).json({ success: false, message: "Lỗi tạo nội dung", error: error.message });
//     }
// });

// router.post("/api/rewrite-text", async (req, res) => {
//     try {
//         const { text, language } = req.body;
//         if (!text) {
//             return res.status(400).json({ success: false, message: "Vui lòng cung cấp văn bản cần viết lại." });
//         }

//         const rewrittenText = await rewriteTextWithMistral(text, language || "vi");

//         res.json({ success: true, rewrittenText });
//     } catch (error) {
//         console.error("Rewrite text error:", error.message, error.stack);
//         res.status(500).json({ success: false, message: "Lỗi viết lại văn bản", error: error.message });
//     }
// });

// router.post("/api/summarize-text", (req, res) => {
//     const form = new formidable.IncomingForm();

//     form.parse(req, async (err, fields, files) => {
//         if (err) {
//             console.error("Error parsing form:", err);
//             return res.status(500).json({ success: false, message: "Lỗi xử lý form: " + err.message });
//         }

//         try {
//             const textToSummarize = fields.text ? fields.text[0] : null;
//             const userEmail = fields.userEmail ? fields.userEmail[0] : null;

//             if (!textToSummarize || !userEmail) {
//                 return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc (văn bản hoặc email)" });
//             }

//             const summary = await summarizeTextWithMistral(textToSummarize);

//             await new Promise((resolve, reject) => {
//                 db.query(
//                     "INSERT INTO history (user_email, topic, category, language, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
//                     [userEmail, "Tóm tắt văn bản", "TextSummarization", "vi", summary, new Date()],
//                     (err, result) => {
//                         if (err) {
//                             console.error("Error saving to history:", err);
//                             return reject(new Error("Lỗi lưu vào lịch sử: " + err.message));
//                         }
//                         resolve(result);
//                     }
//                 );
//             });

//             res.status(200).json({ success: true, summary });
//         } catch (error) {
//             console.error("Error summarizing text:", error.message);
//             res.status(500).json({ success: false, message: error.message });
//         }
//     });
// });

// module.exports = router;