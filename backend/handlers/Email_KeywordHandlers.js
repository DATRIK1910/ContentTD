const express = require('express');
const formidable = require('formidable');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const configg = require('../configg');

const app = express();

// Endpoint để gợi ý từ khóa
app.post('/suggest-keywords', (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error("Error parsing form:", err);
            return res.status(500).json({ success: false, message: "Lỗi xử lý form: " + err.message });
        }

        try {
            const topic = fields.topic ? fields.topic[0] : null;
            const language = fields.language ? fields.language[0] : "vi";
            const userEmail = fields.userEmail ? fields.userEmail[0] : null;

            if (!topic || !userEmail) {
                return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc (chủ đề hoặc email)" });
            }

            // Trừ kim cương trước khi gợi ý từ khóa
            db.query("UPDATE users SET diamonds = diamonds - 5 WHERE id = (SELECT id FROM users WHERE email = ?) AND diamonds >= 5", [userEmail], (err, result) => {
                if (err) {
                    console.error("Database error in deduct diamonds:", err.message, err.stack);
                    return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                }
                if (result.affectedRows === 0) {
                    return res.status(400).json({ success: false, message: "Số kim cương không đủ (cần ít nhất 5 kim cương)" });
                }

                const prompt = `
                    Dựa trên chủ đề "${topic}", đề xuất 5 từ khóa liên quan bằng ngôn ngữ ${language}. Trả lời dưới dạng danh sách các dòng, mỗi dòng là một từ khóa, ví dụ:
                    - từ khóa 1
                    - từ khóa 2
                    - từ khóa 3
                    - từ khóa 4
                    - từ khóa 5
                `;
                const response = axios.post(
                    'https://api.mistral.ai/v1/chat/completions',
                    {
                        model: 'mistral-small',
                        messages: [
                            { role: 'user', content: prompt }
                        ],
                        max_tokens: 200,
                        temperature: 0.7
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${configg.mistral.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    }
                ).then((apiResponse) => {
                    console.log('Mistral AI response for keywords:', apiResponse.data);

                    if (!apiResponse.data || !apiResponse.data.choices || !apiResponse.data.choices[0] || !apiResponse.data.choices[0].message || !apiResponse.data.choices[0].message.content) {
                        throw new Error('Phản hồi từ Mistral AI không đúng định dạng: ' + JSON.stringify(apiResponse.data));
                    }

                    const keywordsRaw = apiResponse.data.choices[0].message.content.trim();
                    const keywords = keywordsRaw.split('\n')
                        .map(line => line.replace(/^-?\s*/g, '').trim())
                        .filter(keyword => keyword.length > 0)
                        .slice(0, 5);

                    db.query(
                        "INSERT INTO history (user_email, topic, category, language, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                        [userEmail, `Gợi ý từ khóa cho "${topic}"`, "KeywordSuggestion", language, JSON.stringify(keywords), new Date()],
                        (err, result) => {
                            if (err) {
                                console.error("Error saving to history:", err);
                                return res.status(500).json({ success: false, message: "Lỗi lưu vào lịch sử: " + err.message });
                            }
                            res.status(200).json({ success: true, keywords });
                        }
                    );
                }).catch((error) => {
                    console.error("Error suggesting keywords:", error.message);
                    res.status(500).json({ success: false, message: error.message });
                });
            });
        } catch (error) {
            console.error("Error suggesting keywords:", error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });
});

app.post("/generate-email", (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error("Error parsing form:", err);
            return res.status(500).json({ success: false, message: "Lỗi xử lý form: " + err.message });
        }

        try {
            const topic = fields.topic ? fields.topic[0] : null;
            const recipient = fields.recipient ? fields.recipient[0] : null;
            const purpose = fields.purpose ? fields.purpose[0] : null;
            const tone = fields.tone ? fields.tone[0] : "formal";
            const language = fields.language ? fields.language[0] : "vi";
            const length = fields.length ? parseInt(fields.length[0]) : 100;
            const userEmail = fields.user_email ? fields.user_email[0] : null;
            const contactInfo = fields.contact_info ? fields.contact_info[0] : null;
            const time = fields.time ? fields.time[0] : null;
            const location = fields.location ? fields.location[0] : null;

            if (!topic || !recipient || !purpose || !length || !userEmail) {
                return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc (topic, recipient, purpose, length, user_email)" });
            }

            // Trừ kim cương trước khi tạo email
            db.query("UPDATE users SET diamonds = diamonds - 5 WHERE id = (SELECT id FROM users WHERE email = ?) AND diamonds >= 5", [userEmail], (err, result) => {
                if (err) {
                    console.error("Database error in deduct diamonds:", err.message, err.stack);
                    return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                }
                if (result.affectedRows === 0) {
                    return res.status(400).json({ success: false, message: "Số kim cương không đủ (cần ít nhất 5 kim cương)" });
                }

                const languagePrompt = language === "vi" ? "bằng tiếng Việt" : "bằng tiếng Anh";
                const tonePrompt = tone === "formal" ? "chính thức" : tone === "casual" ? "thân mật" : "chuyên nghiệp";

                const prompt = `
      Viết một email ${languagePrompt} với chủ đề "${topic}" gửi đến "${recipient}", mục đích "${purpose}", sử dụng tông giọng ${tonePrompt}.
      Email cần:
      - Mở đầu chào hỏi người nhận một cách tự nhiên và lịch sự, đề cập đến chủ đề.
      - Phần thân bài trình bày chi tiết về mục đích, cung cấp thông tin cần thiết, và giữ giọng điệu phù hợp với tông ${tonePrompt}.
      - Nếu có thời gian "${time}" và địa điểm "${location}", hãy thêm chúng vào phần thân bài một cách tự nhiên (ví dụ: thông báo thời gian và địa điểm của sự kiện).
      - Kết thúc bằng lời chào kết thúc và lời kêu gọi hành động (như xác nhận, phản hồi, v.v.) một cách rõ ràng.
      Độ dài email khoảng ${length} từ. Đảm bảo định dạng email đúng chuẩn (chào, thân, kết), tránh lan man, và phù hợp với ngữ cảnh.
      ${contactInfo ? `Thêm thông tin liên lạc: ${contactInfo} vào phần kết nếu phù hợp.` : ""}
    `;

                const response = axios.post(
                    "https://api.mistral.ai/v1/chat/completions",
                    {
                        model: "mistral-small",
                        messages: [
                            {
                                role: "system",
                                content: "Bạn là một chuyên gia viết email chuyên nghiệp, có khả năng tạo nội dung tự nhiên và phù hợp với ngữ cảnh kinh doanh hoặc cá nhân.",
                            },
                            {
                                role: "user",
                                content: prompt,
                            },
                        ],
                        max_tokens: length * 2,
                        temperature: 0.7,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${configg.mistral.apiKey}`,
                            "Content-Type": "application/json",
                        },
                        timeout: 30000,
                    }
                ).then((apiResponse) => {
                    console.log("Mistral AI response for email:", apiResponse.data);

                    if (!apiResponse.data || !apiResponse.data.choices || !apiResponse.data.choices[0] || !apiResponse.data.choices[0].message || !apiResponse.data.choices[0].message.content) {
                        throw new Error("Phản hồi từ Mistral AI không đúng định dạng: " + JSON.stringify(apiResponse.data));
                    }

                    const generatedEmail = apiResponse.data.choices[0].message.content.trim();
                    const requestId = uuidv4();

                    db.query(
                        "INSERT INTO history (user_email, topic, category, language, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                        [userEmail, `Email cho "${topic}" gửi đến ${recipient}`, "EmailGeneration", language, generatedEmail, new Date()],
                        (err, result) => {
                            if (err) {
                                console.error("Error saving to history:", err);
                                return res.status(500).json({ success: false, message: "Lỗi lưu vào lịch sử: " + err.message });
                            }
                            res.status(200).json({ success: true, message: "Email đã được tạo và đang chờ xử lý. Bạn vui lòng đợi trong ít phút!", request_id: requestId, content: generatedEmail });
                        }
                    );
                }).catch((error) => {
                    console.error("Error generating email:", error.message);
                    res.status(500).json({ success: false, message: error.message });
                });
            });
        } catch (error) {
            console.error("Error generating email:", error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });
});

// Thêm endpoint kiểm tra trạng thái
app.get("/check-email-status", (req, res) => {
    const { request_id } = req.query;
    if (!request_id) {
        return res.status(400).json({ success: false, message: "Thiếu request_id" });
    }

    db.query("SELECT content FROM history WHERE request_id = ? AND category = 'EmailGeneration'", [request_id], (err, results) => {
        if (err) {
            console.error("Error checking email status:", err);
            return res.status(500).json({ success: false, message: "Lỗi kiểm tra trạng thái: " + err.message });
        }
        if (results.length > 0) {
            res.json({ success: true, content: results[0].content });
        } else {
            res.json({ success: false, message: "Chưa hoàn tất" });
        }
    });
});

module.exports = app;