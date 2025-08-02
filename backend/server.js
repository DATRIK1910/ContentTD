require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const PDFDocument = require('pdfkit');
const axios = require("axios");
const db = require("./db");
const configg = require("./configg");
const { stringify } = require("node:querystring");
const { createHash } = require("node:crypto");
const path = require("path");
const JWT_SECRET = "your_jwt_secret_key";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const formidable = require("formidable");
const { v4: uuidv4 } = require("uuid");
const cookieParser = require("cookie-parser");
const app = express();
const port = 5000;
const emailKeywordHandler = require('./handlers/Email_KeywordHandlers');
const {
    loginAdminGetHandler,
    adminDashboardHandler,
    loginAdminPostHandler,
    logoutHandler,
    adminContactsHandler,
    adminHistoryHandler,
    adminUsersHandler,
    adminDeleteUserHandler,
    adminAssignRoleHandler,
    adminContentManagerHandler,
    adminPendingContentHandler,
    adminRevenueHandler,
    adminRevenueMonthlyHandler,
    adminRevenueYearlyHandler,
    exportRevenueHandler
} = require('./handlers/adminHandlers');
const { checkSurvey, submitSurvey, getAdminRatings, renderAdminRatings, getTopSurveys } = require("./handlers/surveyHandlers");

// Cấu hình EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cookieParser())
// Cấu hình CORS
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình session sử dụng express-session
app.use(session({
    secret: configg.session.cookieKey,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
    },
}));

// Middleware kiểm tra JWT
const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ success: false, message: "Vui lòng đăng nhập!" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { id: decoded.id, email: decoded.email }; // Lấy từ token
        next();
    } catch (error) {
        console.error("JWT verification error:", error.message);
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token đã hết hạn, vui lòng đăng nhập lại!" });
        }
        return res.status(401).json({ success: false, message: "Token không hợp lệ!" });
    }
};

app.use(passport.initialize());
app.use(passport.session());
// Middleware kiểm tra token
const isAuthenticated = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
    if (!token) {
        return res.redirect('/login/admin');
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET); // Đảm bảo JWT_SECRET được định nghĩa
        req.user = decoded;
        next();
    } catch (error) {
        return res.redirect('/login/admin');
    }
};

// Middleware kiểm tra và trừ kim cương
const checkDiamonds = (req, res, next) => {
    const userId = req.user.id;
    db.query("SELECT diamonds FROM users WHERE id = ?", [userId], (err, results) => {
        if (err) {
            console.error("Database error checking diamonds:", err.message);
            return res.status(500).json({ success: false, message: "Lỗi server khi kiểm tra kim cương" });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
        }
        const currentDiamonds = results[0].diamonds;
        if (currentDiamonds < 5) {
            return res.status(400).json({ success: false, message: "Số kim cương không đủ (cần ít nhất 5 kim cương)" });
        }
        req.currentDiamonds = currentDiamonds; // Lưu số kim cương hiện tại
        next();
    });
};

// Route đăng ký
app.post("/register", async (req, res) => {
    try {
        console.log("Received register request:", req.body);
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            console.log("Missing required fields");
            return res.status(400).json({ message: "Họ tên, email và mật khẩu là bắt buộc" });
        }

        console.log("Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("Inserting into database...");
        db.query(
            "INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)",
            [name, email, hashedPassword, "USER", new Date()],
            (err, result) => {
                if (err) {
                    console.error("Database error:", err.message, err.stack);
                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(400).json({ message: "Email đã tồn tại" });
                    }
                    return res.status(500).json({ message: "Lỗi server: Không thể thêm người dùng" });
                }
                console.log("User registered successfully:", result);
                res.status(201).json({ message: "Đăng ký thành công" });
            }
        );
    } catch (error) {
        console.error("Register error:", error.message, error.stack);
        res.status(500).json({ message: "Lỗi server: Xử lý yêu cầu thất bại" });
    }
});

// Route đăng nhập bằng email và mật khẩu
app.post("/login/user", async (req, res) => {
    try {
        console.log("Received login request:", req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email và mật khẩu là bắt buộc" });
        }

        db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
            if (err) {
                console.error("Database error:", err.message, err.stack);
                return res.status(500).json({ success: false, message: "Lỗi server: Không thể truy vấn người dùng" });
            }

            if (results.length === 0) {
                return res.status(400).json({ success: false, message: "Email không tồn tại" });
            }

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Mật khẩu không đúng" });
            }

            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "3h" });

            res.status(200).json({
                success: true,
                message: "Đăng nhập thành công",
                token,
                user: { id: user.id, email: user.email, name: user.name },
            });
        });
    } catch (error) {
        console.error("Login error:", error.message, err.stack);
        res.status(500).json({ success: false, message: "Lỗi server: Xử lý yêu cầu thất bại" });
    }
});

app.post("/api/auto-approve-content", async (req, res) => {
    const { id, userEmail } = req.body;

    if (!id || !userEmail) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin id hoặc userEmail" });
    }

    db.query("SELECT * FROM pending_contents WHERE request_id = ? AND status = ?", [id, "PENDING"], (err, results) => {
        if (err) {
            console.error("Error fetching pending content:", err);
            return res.status(500).json({ success: false, message: "Lỗi khi lấy nội dung chờ duyệt" });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy nội dung chờ duyệt" });
        }

        const content = results[0];
        console.log("Pending content to auto-approve:", content);

        (async () => {
            try {
                const prompt = `
                    Phân tích đoạn văn bản sau và quyết định xem nó có phù hợp để được duyệt hay không. 
                    Tiêu chí: 
                    - Từ chối nếu nội dung chứa từ ngữ nhạy cảm, xuyên tạc, xúc phạm, chống phá, hoặc công kích.
                    - Duyệt nếu nội dung sạch sẽ, không vi phạm các tiêu chí trên.
                    - Trả lời dưới dạng JSON với 2 trường:
                      - "decision": "approve" hoặc "reject"
                      - "reason": lý do quyết định (ví dụ: "Nội dung phù hợp" hoặc "Nội dung chứa từ ngữ xúc phạm")
                    Văn bản: "${content.content}"
                `;
                const response = await axios.post(
                    'https://api.mistral.ai/v1/chat/completions',
                    {
                        model: 'mistral-small',
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 500,
                        temperature: 0.5
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${configg.mistral.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    }
                );

                const aiResponse = JSON.parse(response.data.choices[0].message.content.trim());
                const { decision, reason } = aiResponse;

                if (decision === "approve") {
                    db.query(
                        "INSERT INTO history (user_email, topic, category, language, content, created_at, request_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [content.user_email, content.topic, content.category, content.language, content.content, content.created_at, content.request_id],
                        (err) => {
                            if (err) {
                                console.error("Error saving to history:", err);
                                return res.status(500).json({ success: false, message: "Lỗi khi lưu vào lịch sử" });
                            }
                            db.query("UPDATE pending_contents SET status = ? WHERE request_id = ?", ["APPROVED", id], (err) => {
                                if (err) {
                                    console.error("Error updating pending content status:", err);
                                    return res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái" });
                                }
                                db.query(
                                    "INSERT INTO notifications (user_email, message, created_at, request_id) VALUES (?, ?, ?, ?)",
                                    [userEmail, "Nội dung của bạn đã được duyệt !", new Date(), content.request_id],
                                    (err) => {
                                        if (err) {
                                            console.error("Error saving notification:", err);
                                            return res.status(500).json({ success: false, message: "Lỗi khi lưu thông báo" });
                                        }
                                        db.query("DELETE FROM pending_contents WHERE request_id = ?", [id], (err) => {
                                            if (err) {
                                                console.error("Error deleting pending content:", err);
                                                return res.status(500).json({ success: false, message: "Lỗi khi xóa nội dung chờ duyệt" });
                                            }
                                            res.status(200).json({ success: true, message: "Duyệt nội dung thành công" });
                                        });
                                    }
                                );
                            });
                        }
                    );
                } else if (decision === "reject") {
                    db.query("UPDATE pending_contents SET status = ? WHERE request_id = ?", ["REJECTED", id], (err) => {
                        if (err) {
                            console.error("Error updating pending content status:", err);
                            return res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái" });
                        }
                        db.query(
                            "INSERT INTO notifications (user_email, message, created_at, request_id) VALUES (?, ?, ?, ?)",
                            [userEmail, `Nội dung của bạn bị từ chối: ${reason}`, new Date(), content.request_id],
                            (err) => {
                                if (err) {
                                    console.error("Error saving notification:", err);
                                    return res.status(500).json({ success: false, message: "Lỗi khi lưu thông báo" });
                                }
                                db.query("DELETE FROM pending_contents WHERE request_id = ?", [id], (err) => {
                                    if (err) {
                                        console.error("Error deleting pending content:", err);
                                        return res.status(500).json({ success: false, message: "Lỗi khi xóa nội dung chờ duyệt" });
                                    }
                                    res.status(200).json({ success: true, message: "Từ chối nội dung thành công" });
                                });
                            }
                        );
                    });
                } else {
                    throw new Error("Quyết định từ AI không hợp lệ: " + decision);
                }
            } catch (error) {
                console.error("Error processing auto-approval:", error.message);
                res.status(500).json({ success: false, message: "Lỗi khi xử lý duyệt tự động: " + error.message });
            }
        })();
    });
});

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Route /api/history
app.post("/api/history", (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Error parsing form:", err);
            return res.status(500).json({ success: false, message: "Lỗi xử lý form: " + err.message });
        }

        try {
            const userEmail = fields.user_email ? fields.user_email[0] : null;
            const topic = fields.topic ? fields.topic[0] : null;
            const category = fields.category ? fields.category[0] : null;
            const language = fields.language ? fields.language[0] : null;
            const content = fields.content ? fields.content[0] : null;
            const requestId = uuidv4();

            if (!userEmail || !topic || !category || !language || !content) {
                return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc (user_email, topic, category, language, content)" });
            }

            await new Promise((resolve, reject) => {
                db.query(
                    "INSERT INTO pending_contents (user_email, topic, category, language, content, created_at, status, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [userEmail, topic, category, language, content, new Date(), "PENDING", requestId],
                    (err, result) => {
                        if (err) {
                            console.error("Error saving to pending_contents:", err);
                            return reject(new Error("Lỗi lưu vào danh sách chờ xử lý: " + err.message));
                        }
                        resolve(result);
                    }
                );
            });

            res.status(200).json({ success: true, message: "Nội dung đã được gửi và đang chờ hệ thống xử lý. Bạn vui lòng chờ trong ít phút!", request_id: requestId });
        } catch (error) {
            console.error("Error saving to pending_contents:", error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });
});

// Route /api/history (GET)
app.get("/api/history", async (req, res) => {
    try {
        const { user_email } = req.query;

        if (!user_email) {
            return res.status(400).json({ success: false, message: "Email người dùng là bắt buộc" });
        }

        db.query(
            "SELECT * FROM history WHERE user_email = ? ORDER BY created_at DESC",
            [user_email],
            (err, results) => {
                if (err) {
                    console.error("Database error:", err.message, err.stack);
                    return res.status(500).json({ success: false, message: "Lỗi server: Không thể lấy lịch sử" });
                }
                res.status(200).json({ success: true, history: results });
            }
        );
    } catch (error) {
        console.error("Get history error:", error.message, error.stack);
        res.status(500).json({ success: false, message: "Lỗi server: Không thể lấy lịch sử" });
    }
});

// Route /api/notifications
app.get("/api/notifications", (req, res) => {
    const userEmail = req.query.user_email;

    if (!userEmail) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin user_email" });
    }

    db.query("SELECT * FROM notifications WHERE user_email = ? ORDER BY created_at DESC", [userEmail], (err, results) => {
        if (err) {
            console.error("Error fetching notifications:", err);
            return res.status(500).json({ success: false, message: "Lỗi khi lấy thông báo" });
        }

        res.status(200).json({ success: true, notifications: results });
    });
});

// Route /api/user-history
app.get("/api/user-history", (req, res) => {
    const userEmail = req.query.user_email;

    if (!userEmail) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin user_email" });
    }

    db.query("SELECT * FROM history WHERE user_email = ? ORDER BY created_at DESC", [userEmail], (err, results) => {
        if (err) {
            console.error("Error fetching user history:", err);
            return res.status(500).json({ success: false, message: "Lỗi khi lấy lịch sử nội dung" });
        }


        res.status(200).json({ success: true, history: results });
    });
});



app.post("/api/generate-content", async (req, res) => {
    try {
        const { field, language, topic, keyword, length, user_email } = req.body;

        if (!field || !language || !topic || !keyword || !length || !user_email) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc (field, language, topic, keyword, length, user_email)" });
        }

        // Trừ kim cương trước khi tạo nội dung
        const deductResult = await new Promise((resolve, reject) => {
            db.query("UPDATE users SET diamonds = diamonds - 5 WHERE id = (SELECT id FROM users WHERE email = ?) AND diamonds >= 5", [user_email], (err, result) => {
                if (err) {
                    console.error("Database error in deduct diamonds:", err.message, err.stack);
                    return reject(err);
                }
                resolve(result);
            });
        });
        if (deductResult.affectedRows === 0) {
            return res.status(400).json({ success: false, message: "Số kim cương không đủ (cần ít nhất 5 kim cương)" });
        }

        const languagePrompt = language === "vi" ? "bằng tiếng Việt" : "bằng tiếng Anh";

        const prompt = `
      Viết một bài quảng cáo ${languagePrompt} về chủ đề "${topic}" trong lĩnh vực "${field}", tập trung vào từ khóa chính "${keyword}". 
      Bài viết cần sáng tạo, tự nhiên, thu hút người đọc, và phù hợp với mục đích quảng cáo. 
      Nội dung phải:
      - Mở đầu hấp dẫn, giới thiệu ngắn gọn về chủ đề, nhấn mạnh từ khóa "${keyword}".
      - Phần thân bài trình bày chi tiết các lợi ích, đặc điểm nổi bật, và giá trị của sản phẩm/dịch vụ, lặp lại từ khóa "${keyword}" một cách tự nhiên 2-3 lần.
      - Kết thúc bằng lời kêu gọi hành động mạnh mẽ, khuyến khích người đọc thực hiện hành động (mua hàng, liên hệ, tìm hiểu thêm, v.v.), sử dụng lại từ khóa "${keyword}" nếu phù hợp.
      Độ dài bài viết khoảng ${length} từ. Tránh lan man, tập trung vào từ khóa và chủ đề chính.
    `;

        const response = await axios.post(
            "https://api.mistral.ai/v1/chat/completions",
            {
                model: "mistral-small",
                messages: [
                    {
                        role: "system",
                        content: "Bạn là một chuyên gia viết quảng cáo chuyên nghiệp, một người viết blog chuyên nghiệp, một người viết về vấn đề giáo dục chuyên nghiệp, một người sáng tạo nội dung content chuyên nghiệp ",
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
                headers: { Authorization: `Bearer ${configg.mistral.apiKey}` },
            }
        );

        const generatedContent = response.data.choices[0].message.content;
        const requestId = uuidv4();

        await db.query(
            "INSERT INTO pending_contents (user_email, topic, category, language, content, created_at, status, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [user_email, topic, field, language, generatedContent, new Date(), "PENDING", requestId]
        );

        // Thêm logic lưu từ khóa vào keyword_history
        await db.query(
            "INSERT INTO keyword_history (user_email, keyword, created_at) VALUES (?, ?, NOW())",
            [user_email, keyword],
            (err) => {
                if (err) {
                    console.error("Error saving keyword history:", err);
                }
            }
        );

        res.json({ success: true, message: "Nội dung đã được tạo và đang chờ hệ thống xử lý. Bạn vui lòng đợi trong ít phút!", request_id: requestId });
    } catch (error) {
        console.error("Error generating content:", error.message, error.response?.data || "No response data");
        res.status(500).json({ success: false, message: "Lỗi tạo nội dung", error: error.message });
    }
});

app.post("/api/rewrite-section", async (req, res) => {
    try {
        const { user_email, original_content, selected_text, field, language, topic, keyword, length } = req.body;

        if (!user_email || !original_content || !selected_text || !field || !language || !topic || !keyword || !length) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
        }

        // Làm sạch dữ liệu
        const cleanSelectedText = selected_text.trim().replace(/\s+/g, " ");
        const originalLength = cleanSelectedText.split(/\s+/).length; // Đếm số từ của đoạn gốc

        const languagePrompt = language === "vi" ? "bằng tiếng Việt" : "bằng tiếng Anh";

        const prompt = `
      Viết lại đoạn văn sau ${languagePrompt} trong ngữ cảnh chủ đề "${topic}" trong lĩnh vực "${field}", tập trung vào từ khóa chính "${keyword}":
      [Đoạn gốc]: ${cleanSelectedText}
      Yêu cầu:
      - Giữ nguyên hoàn toàn ý chính của đoạn gốc, không thay đổi ý nghĩa.
      - Sử dụng câu từ và cách diễn đạt khác biệt, tự nhiên, sáng tạo hơn so với đoạn gốc.
      - Độ dài của đoạn mới phải bằng hoặc lớn hơn số từ của đoạn gốc (${originalLength} từ), không được ngắn hơn.
      - Nhấn mạnh từ khóa "${keyword}" 1-2 lần một cách tự nhiên.
    `;

        console.log("Prompt sent to Mistral API:", prompt); // Log để kiểm tra prompt

        const response = await axios.post(
            "https://api.mistral.ai/v1/chat/completions",
            {
                model: "mistral-small",
                messages: [
                    {
                        role: "system",
                        content: "Bạn là một chuyên gia viết quảng cáo chuyên nghiệp, một người viết blog chuyên nghiệp, một người viết về vấn đề giáo dục chuyên nghiệp, một người sáng tạo nội dung content chuyên nghiệp.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                max_tokens: originalLength * 3, // Đặt max_tokens dựa trên độ dài gốc, nhân 3 để đảm bảo đủ
                temperature: 0.7,
            },
            {
                headers: { Authorization: `Bearer ${configg.mistral.apiKey}` },
            }
        );

        console.log("Response from Mistral API:", response.data); // Log phản hồi

        const rewrittenSection = response.data.choices[0].message.content.trim();
        const newContent = original_content.replace(cleanSelectedText, rewrittenSection);

        // Xóa bản ghi cũ trong history liên quan đến user_email và topic
        await new Promise((resolve, reject) => {
            db.query(
                "DELETE FROM history WHERE user_email = ? AND topic = ?",
                [user_email, topic],
                (err) => {
                    if (err) {
                        console.error("Error deleting old history:", err);
                        return reject(new Error("Lỗi xóa lịch sử cũ: " + err.message));
                    }
                    resolve();
                }
            );
        });

        // Lưu nội dung mới nhất vào history, ghi đè bản gốc
        await new Promise((resolve, reject) => {
            db.query(
                "INSERT INTO history (user_email, topic, category, language, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                [user_email, topic, "TextRewriting", language, newContent, new Date()],
                (err, result) => {
                    if (err) {
                        console.error("Error saving to history:", err);
                        return reject(new Error("Lỗi lưu vào lịch sử: " + err.message));
                    }
                    resolve(result);
                }
            );
        });

        res.json({ success: true, content: newContent });
    } catch (error) {
        console.error("Error rewriting section:", error.message, error.response?.data || "No response data");
        res.status(500).json({ success: false, message: "Lỗi khi viết lại đoạn", error: error.response?.data?.message?.detail || error.message });
    }
});

app.post("/api/rewrite-all", async (req, res) => {
    try {
        const { user_email, original_content, field, language, topic, keyword, length } = req.body;

        if (!user_email || !original_content || !field || !language || !topic || !keyword || !length) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
        }

        const languagePrompt = language === "vi" ? "bằng tiếng Việt" : "bằng tiếng Anh";

        const prompt = `
      Viết lại toàn bộ bài viết ${languagePrompt} về chủ đề "${topic}" trong lĩnh vực "${field}", tập trung vào từ khóa chính "${keyword}".
      Bài viết cần sáng tạo, tự nhiên, thu hút người đọc, và phù hợp với mục đích quảng cáo.
      Nội dung phải:
      - Mở đầu hấp dẫn, giới thiệu ngắn gọn về chủ đề, nhấn mạnh từ khóa "${keyword}".
      - Phần thân bài trình bày chi tiết các lợi ích, đặc điểm nổi bật, và giá trị của sản phẩm/dịch vụ, lặp lại từ khóa "${keyword}" một cách tự nhiên 2-3 lần.
      - Kết thúc bằng lời kêu gọi hành động mạnh mẽ, khuyến khích người đọc thực hiện hành động, sử dụng lại từ khóa "${keyword}" nếu phù hợp.
      Độ dài bài viết khoảng ${length} từ, dựa trên nội dung gốc sau: ${original_content}.
      Tránh lan man, tập trung vào từ khóa và chủ đề chính.
    `;

        console.log("Prompt sent to Mistral API:", prompt); // Log để kiểm tra prompt

        const response = await axios.post(
            "https://api.mistral.ai/v1/chat/completions",
            {
                model: "mistral-small",
                messages: [
                    {
                        role: "system",
                        content: "Bạn là một chuyên gia viết quảng cáo chuyên nghiệp, một người viết blog chuyên nghiệp, một người viết về vấn đề giáo dục chuyên nghiệp, một người sáng tạo nội dung content chuyên nghiệp.",
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
                headers: { Authorization: `Bearer ${configg.mistral.apiKey}` },
            }
        );

        console.log("Response from Mistral API:", response.data); // Log phản hồi

        const newContent = response.data.choices[0].message.content.trim();

        // Xóa bản ghi cũ trong history liên quan đến user_email và topic
        await new Promise((resolve, reject) => {
            db.query(
                "DELETE FROM history WHERE user_email = ? AND topic = ?",
                [user_email, topic],
                (err) => {
                    if (err) {
                        console.error("Error deleting old history:", err);
                        return reject(new Error("Lỗi xóa lịch sử cũ: " + err.message));
                    }
                    resolve();
                }
            );
        });

        // Lưu nội dung mới nhất vào history, ghi đè bản gốc
        await new Promise((resolve, reject) => {
            db.query(
                "INSERT INTO history (user_email, topic, category, language, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                [user_email, topic, "TextRewriting", language, newContent, new Date()],
                (err, result) => {
                    if (err) {
                        console.error("Error saving to history:", err);
                        return reject(new Error("Lỗi lưu vào lịch sử: " + err.message));
                    }
                    resolve(result);
                }
            );
        });

        res.json({ success: true, content: newContent });
    } catch (error) {
        console.error("Error rewriting all:", error.message, error.response?.data || "No response data");
        res.status(500).json({ success: false, message: "Lỗi khi viết lại toàn bộ", error: error.response?.data?.message?.detail || error.message });
    }
});


// Route để lấy lịch sử từ khóa
app.get("/api/keyword-history", (req, res) => {
    const { user_email } = req.query;
    if (!user_email) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin user_email" });
    }

    db.query("SELECT * FROM keyword_history WHERE user_email = ? ORDER BY created_at DESC", [user_email], (err, results) => {
        if (err) {
            console.error("Error fetching keyword history:", err);
            return res.status(500).json({ success: false, message: "Lỗi khi lấy lịch sử từ khóa" });
        }
        res.json({ success: true, keywords: results });
    });
});

// Endpoint để viết lại văn bản
app.post('/api/rewrite-text', (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error("Error parsing form:", err);
            return res.status(500).json({ success: false, message: "Lỗi xử lý form: " + err.message });
        }

        try {
            const textToRewrite = fields.text ? fields.text[0] : null;
            const language = fields.language ? fields.language[0] : "vi";
            const userEmail = fields.userEmail ? fields.userEmail[0] : null;

            if (!textToRewrite || !userEmail) {
                return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc (văn bản hoặc email)" });
            }

            // Trừ kim cương trước khi viết lại
            db.query("UPDATE users SET diamonds = diamonds - 5 WHERE id = (SELECT id FROM users WHERE email = ?) AND diamonds >= 5", [userEmail], (err, result) => {
                if (err) {
                    console.error("Database error in deduct diamonds:", err.message, err.stack);
                    return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                }
                if (result.affectedRows === 0) {
                    return res.status(400).json({ success: false, message: "Số kim cương không đủ (cần ít nhất 5 kim cương)" });
                }

                rewriteTextWithMistral(textToRewrite, language).then((rewrittenText) => {
                    new Promise((resolve, reject) => {
                        db.query(
                            "INSERT INTO history (user_email, topic, category, language, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                            [userEmail, "Viết lại văn bản", "TextRewriting", language, rewrittenText, new Date()],
                            (err, result) => {
                                if (err) {
                                    console.error("Error saving to history:", err);
                                    return reject(new Error("Lỗi lưu vào lịch sử: " + err.message));
                                }
                                resolve(result);
                            }
                        );
                    }).then(() => {
                        res.status(200).json({ success: true, rewrittenText });
                    }).catch((error) => {
                        res.status(500).json({ success: false, message: error.message });
                    });
                }).catch((error) => {
                    res.status(500).json({ success: false, message: error.message });
                });
            });
        } catch (error) {
            console.error("Error rewriting text:", error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });
});

// Hàm viết lại văn bản bằng Mistral AI
async function rewriteTextWithMistral(text, language = "vi") {
    try {
        const prompt = `
            Viết lại đoạn văn bản sau bằng ${language === "vi" ? "tiếng Việt với ngữ điệu tự nhiên, dễ hiểu và mạch lạc" : "English with a natural, understandable, and coherent tone"}, giữ nguyên ý chính và cải thiện cách diễn đạt.

            Văn bản: "${text}"
        `;
        const response = await axios.post(
            'https://api.mistral.ai/v1/chat/completions',
            {
                model: 'mistral-small',
                messages: [
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1000,
                temperature: 0.7
            },
            {
                headers: {
                    Authorization: `Bearer ${configg.mistral.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        console.log('Mistral AI response:', response.data);

        if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message || !response.data.choices[0].message.content) {
            throw new Error('Phản hồi từ Mistral AI không đúng định dạng: ' + JSON.stringify(response.data));
        }

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        throw new Error('Lỗi khi viết lại văn bản: ' + error.message);
    }
}

// Route /api/summarize-text
app.post("/api/summarize-text", (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error("Error parsing form:", err);
            return res.status(500).json({ success: false, message: "Lỗi xử lý form: " + err.message });
        }

        try {
            const textToSummarize = fields.text ? fields.text[0] : null;
            const userEmail = fields.userEmail ? fields.userEmail[0] : null;

            if (!textToSummarize || !userEmail) {
                return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc (văn bản hoặc email)" });
            }


            db.query("UPDATE users SET diamonds = diamonds - 5 WHERE id = (SELECT id FROM users WHERE email = ?) AND diamonds >= 5", [userEmail], (err, result) => {
                if (err) {
                    console.error("Database error in deduct diamonds:", err.message, err.stack);
                    return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                }
                if (result.affectedRows === 0) {
                    return res.status(400).json({ success: false, message: "Số kim cương không đủ (cần ít nhất 5 kim cương)" });
                }

                summarizeTextWithMistral(textToSummarize).then((summary) => {
                    new Promise((resolve, reject) => {
                        db.query(
                            "INSERT INTO history (user_email, topic, category, language, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                            [userEmail, "Tóm tắt văn bản", "TextSummarization", "vi", summary, new Date()],
                            (err, result) => {
                                if (err) {
                                    console.error("Error saving to history:", err);
                                    return reject(new Error("Lỗi lưu vào lịch sử: " + err.message));
                                }
                                resolve(result);
                            }
                        );
                    }).then(() => {
                        res.status(200).json({ success: true, summary });
                    }).catch((error) => {
                        res.status(500).json({ success: false, message: error.message });
                    });
                }).catch((error) => {
                    res.status(500).json({ success: false, message: error.message });
                });
            });
        } catch (error) {
            console.error("Error summarizing text:", error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });
});

// Hàm tóm tắt văn bản bằng Mistral AI
async function summarizeTextWithMistral(text) {
    try {
        const prompt = `
            Tóm tắt đoạn văn bản sau bằng tiếng Việt thành 3-5 câu, giữ lại các ý chính quan trọng và loại bỏ chi tiết không cần thiết. Văn bản tóm tắt cần tự nhiên, mạch lạc và phù hợp với ngữ cảnh tiếng Việt.

            Văn bản: "${text}"
        `;
        const response = await axios.post(
            'https://api.mistral.ai/v1/chat/completions',
            {
                model: 'mistral-small',
                messages: [
                    { role: 'user', content: prompt }
                ],
                max_tokens: 300,
                temperature: 0.7
            },
            {
                headers: {
                    Authorization: `Bearer ${configg.mistral.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        console.log('Mistral AI response:', response.data);

        if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message || !response.data.choices[0].message.content) {
            throw new Error('Phản hồi từ Mistral AI không đúng định dạng: ' + JSON.stringify(response.data));
        }

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        throw new Error('Lỗi khi tóm tắt văn bản: ' + error.message);
    }
}

// Endpoint để gợi ý nội dung
app.post('/api/suggest-content', async (req, res) => {
    const { topic, keyword, language, user_email } = req.body;
    console.log('Received suggest request:', { topic, keyword });

    if (!topic || !keyword || !language || !user_email) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin yêu cầu!' });
    }

    try {
        const prompt = `Dựa trên chủ đề "${topic}" và từ khóa "${keyword}", đề xuất 3 ý tưởng nội dung liên quan bằng ngôn ngữ ${language}. Trả lời dưới dạng danh sách các dòng, mỗi dòng là một gợi ý.`;
        const response = await callMistralApi(prompt, 150);
        const suggestions = response.split("\n").filter(s => s.trim().length > 0).slice(0, 3); // Lấy 3 gợi ý
        res.json({ success: true, suggestions });
    } catch (error) {
        console.error('❌ Lỗi khi gợi ý nội dung:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi tạo gợi ý: ' + error.message });
    }
});

// Endpoint trừ kim cương khi sử dụng dịch vụ
app.post("/api/deduct-diamonds", authenticateJWT, (req, res) => {
    const userId = req.user.id;
    try {
        db.query("UPDATE users SET diamonds = diamonds - 5 WHERE id = ? AND diamonds >= 5", [userId], (err, result) => {
            if (err) {
                console.error("Database error in deduct diamonds:", err.message, err.stack);
                return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(400).json({ success: false, message: "Số kim cương không đủ (cần ít nhất 5 kim cương)" });
            }
            res.json({ success: true, message: "Trừ 5 kim cương thành công" });
        });
    } catch (error) {
        console.error("Error in deduct diamonds:", error.message, error.stack);
        res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
    }
});

// Endpoint để xuất file PDF
app.post('/api/export-pdf', async (req, res) => {
    const { content, user_email, filename } = req.body;
    console.log('Received content for PDF export:', content);

    if (!content) {
        return res.status(400).json({ success: false, message: 'Không có nội dung để xuất PDF!' });
    }

    try {
        // Xử lý tên file: thay thế khoảng trắng bằng dấu gạch dưới và mã hóa nếu cần
        const safeFilename = filename
            .replace(/ /g, '_') // Thay khoảng trắng bằng _
            .replace(/[^a-zA-Z0-9_.-]/g, '') // Loại bỏ ký tự đặc biệt không hợp lệ
            .substring(0, 50) + '.pdf'; // Giới hạn độ dài và thêm đuôi .pdf

        // Tạo tài liệu PDF
        const doc = new PDFDocument({ font: 'fonts/NotoSans-Regular.ttf' }); // Sử dụng font NotoSans-Regular
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
            res.setHeader('Content-Type', 'application/pdf');
            res.send(pdfData);
        });

        // Đăng ký font để đảm bảo sử dụng đúng
        doc.registerFont('NotoSans', 'fonts/NotoSans-Regular.ttf');

        // Thêm tiêu đề và nội dung
        doc.font('NotoSans').fontSize(20).text(`Bài viết: ${safeFilename.replace('.pdf', '')}`, { align: 'center' });
        doc.moveDown();
        doc.font('NotoSans').fontSize(12).text(content, { align: 'left', width: 500 });
        doc.end();
    } catch (error) {
        console.error(' Lỗi khi xuất PDF:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi tạo file PDF: ' + error.message });
    }
});

// Endpoint để gợi ý nội dung
app.post('/api/suggest-content', async (req, res) => {
    const { topic, keyword, language, user_email } = req.body;
    console.log('Received suggest request:', { topic, keyword });

    if (!topic || !keyword || !language || !user_email) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin yêu cầu!' });
    }

    try {
        const prompt = `Dựa trên chủ đề "${topic}" và từ khóa "${keyword}", đề xuất 3 ý tưởng nội dung liên quan bằng ngôn ngữ ${language}. Trả lời dưới dạng mảng JSON với các chuỗi văn bản.`;
        const response = await generateContent(prompt); // Gọi hàm Mistral

        // Giả sử response là chuỗi JSON, parse để lấy gợi ý
        const suggestions = JSON.parse(response).suggestions || ["Không có gợi ý phù hợp."];
        res.json({ success: true, suggestions });
    } catch (error) {
        console.error(' Lỗi khi gợi ý nội dung:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi tạo gợi ý: ' + error.message });
    }
});

// Endpoint /api/user-diamonds
app.get("/api/user-diamonds", authenticateJWT, (req, res) => {
    try {
        const userId = req.user.id;
        db.query("SELECT diamonds FROM users WHERE id = ?", [userId], (err, results) => {
            if (err) {
                console.error("Database error in /api/user-diamonds:", err.message, err.stack);
                return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
            }
            res.json({ success: true, diamonds: results[0].diamonds });
        });
    } catch (error) {
        console.error("Error in /api/user-diamonds:", error.message, error.stack);
        res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
    }
});

// Endpoint /api/buy-diamonds
app.post("/api/buy-diamonds", authenticateJWT, (req, res) => {
    const { amount } = req.body;
    const user_id = req.user.id;
    console.log("Request to /api/buy-diamonds:", { user_id, amount });
    try {
        if (!user_id || !amount) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
        }

        let diamonds;
        switch (amount) {
            case 100000:
                diamonds = 100;
                break;
            case 200000:
                diamonds = 210;
                break;
            case 500000:
                diamonds = 550;
                break;
            default:
                throw new Error("Số tiền không hợp lệ!");
        }

        const vnp_TmnCode = configg.vnpay.tmnCode;
        const vnp_HashSecret = configg.vnpay.hashSecret;
        const vnp_Url = configg.vnpay.url || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        const vnp_ReturnUrl = configg.vnpay.returnUrl || "http://localhost:3000/vnpay-return";
        const vnp_TxnRef = uuidv4();
        const vnp_Amount = Number(amount) * 100;
        const vnp_OrderInfo = `Mua ${diamonds} kim cương (${amount} VNĐ)`;
        const vnp_IpAddr = req.ip || "127.0.0.1";

        if (configg.isLocal) {
            // Ở môi trường localhost, tự động hoàn tất giao dịch
            db.query(
                "INSERT INTO transactions (user_id, amount, diamonds, transaction_id, status) VALUES (?, ?, ?, ?, ?)",
                [user_id, amount, diamonds, vnp_TxnRef, "completed"],
                (err) => {
                    if (err) {
                        console.error("Database error in insert transaction:", err.message, err.stack);
                        return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                    }

                    // Cập nhật kim cương 
                    db.query(
                        "UPDATE users SET diamonds = diamonds + ? WHERE id = ?",
                        [diamonds, user_id],
                        (err) => {
                            if (err) {
                                console.error("Database error in update diamonds:", err.message, err.stack);
                                return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                            }
                            res.json({ success: true, message: `Đã mua thành công ${diamonds} kim cương!`, diamonds });
                        }
                    );
                }
            );
        } else {
            // Ở môi trường thật, tạo URL VNPay
            const vnp_Params = {
                vnp_Version: "2.1.0",
                vnp_Command: "pay",
                vnp_TmnCode: vnp_TmnCode,
                vnp_Amount: vnp_Amount,
                vnp_CurrCode: "VND",
                vnp_TxnRef: vnp_TxnRef,
                vnp_OrderInfo: vnp_OrderInfo,
                vnp_OrderType: "other",
                vnp_Locale: "vn",
                vnp_ReturnUrl: vnp_ReturnUrl,
                vnp_IpAddr: vnp_IpAddr,
                vnp_CreateDate: new Date().toISOString().slice(0, 19).replace("T", " "),
            };

            console.log("VNPay Params:", vnp_Params);

            const sortedParams = Object.keys(vnp_Params)
                .sort()
                .reduce((acc, key) => (acc[key] = vnp_Params[key], acc), {});
            const signData = stringify(sortedParams) + `&vnp_SecureHash=${vnp_HashSecret}`;
            const secureHash = createHash("sha256").update(signData).digest("hex");

            vnp_Params.vnp_SecureHash = secureHash;
            const paymentUrl = `${vnp_Url}?${stringify(vnp_Params)}`;
            console.log("Generated Payment URL:", paymentUrl);


            db.query(
                "INSERT INTO transactions (user_id, amount, diamonds, transaction_id, status) VALUES (?, ?, ?, ?, ?)",
                [user_id, amount, diamonds, vnp_TxnRef, "pending"],
                (err) => {
                    if (err) {
                        console.error("Database error in insert transaction:", err.message, err.stack);
                        return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                    }
                    res.json({ success: true, url: paymentUrl });
                }
            );
        }
    } catch (error) {
        console.error("Error in /api/buy-diamonds:", error.message, error.stack);
        res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
    }
});

// Endpoint /vnpay-return
app.get("/vnpay-return", (req, res) => {
    const vnp_Params = req.query;
    const vnp_HashSecret = configg.vnpay.hashSecret;
    const secureHash = vnp_Params.vnp_SecureHash;

    console.log("VNPay Return Params:", vnp_Params);

    let orderId = vnp_Params.vnp_TxnRef;
    let rspCode = vnp_Params.vnp_ResponseCode;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const signData = stringify(vnp_Params, { encode: false }) + `&vnp_SecureHash=${vnp_HashSecret}`;
    const checkHash = createHash("sha256").update(signData).digest("hex");

    if (secureHash === checkHash) {
        if (rspCode === "00") {
            const amount = vnp_Params.vnp_Amount / 100;
            let diamonds;
            switch (amount) {
                case 100000:
                    diamonds = 100;
                    break;
                case 200000:
                    diamonds = 210;
                    break;
                case 500000:
                    diamonds = 550;
                    break;
                default:
                    diamonds = 0;
            }

            // Lấy token từ cookie
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).send("Vui lòng đăng nhập để cập nhật kim cương!");
            }
            const decoded = jwt.verify(token, configg.JWT_SECRET);
            const userId = decoded.id;


            db.query("UPDATE users SET diamonds = diamonds + ? WHERE id = ?", [diamonds, userId], (err) => {
                if (err) {
                    console.error("Database error in update diamonds:", err.message, err.stack);
                    return res.status(500).send("Lỗi server khi cập nhật kim cương");
                }


                db.query(
                    "UPDATE transactions SET status = ?, completed_at = NOW() WHERE transaction_id = ?",
                    ["completed", orderId],
                    (err) => {
                        if (err) {
                            console.error("Database error in update transaction:", err.message, err.stack);
                            return res.status(500).send("Lỗi server khi cập nhật giao dịch");
                        }
                        res.send(`Thanh toán thành công! Bạn đã nhận được ${diamonds} kim cương.`);
                    }
                );
            });
        } else {

            db.query(
                "UPDATE transactions SET status = ? WHERE transaction_id = ?",
                ["failed", orderId],
                (err) => {
                    if (err) {
                        console.error("Database error in update transaction:", err.message, err.stack);
                    }
                    res.send("Thanh toán thất bại.");
                }
            );
        }
    } else {
        res.send("Chữ ký không hợp lệ.");
    }
});

// Endpoint để lấy 3 người dùng có thứ hạng cao nhất
app.get('/api/top-users', (req, res) => {
    const query = `
        SELECT 
            u.id,
            u.email,
            u.name,
            COALESCE(SUM(t.amount), 0) as totalPayment,
            CASE 
                WHEN COALESCE(SUM(t.amount), 0) < 100000 THEN 'Vô hạng'
                WHEN COALESCE(SUM(t.amount), 0) >= 100000 AND COALESCE(SUM(t.amount), 0) <= 300000 THEN 'Đồng'
                WHEN COALESCE(SUM(t.amount), 0) >= 310000 AND COALESCE(SUM(t.amount), 0) <= 500000 THEN 'Bạc'
                ELSE 'Vàng'
            END as rank
        FROM 
            users u
        LEFT JOIN 
            transactions t ON u.id = t.user_id AND t.status = 'completed'
        GROUP BY 
            u.id, u.email, u.name
        ORDER BY 
            totalPayment DESC
        LIMIT 3;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Lỗi khi lấy top người dùng:", err);
            return res.status(500).json({ success: false, message: "Lỗi server" });
        }
        res.json({ success: true, users: results });
    });
});

// Endpoint để lấy danh sách người dùng theo tổng tiền thanh toán
app.get('/api/user-rank', (req, res) => {
    const query = `
        SELECT 
            u.id,
            u.email,
            u.name,
            COALESCE(SUM(t.amount), 0) as totalPayment,
            CASE 
                WHEN COALESCE(SUM(t.amount), 0) < 100000 THEN 'Vô hạng'
                WHEN COALESCE(SUM(t.amount), 0) >= 100000 AND COALESCE(SUM(t.amount), 0) <= 300000 THEN 'Đồng'
                WHEN COALESCE(SUM(t.amount), 0) >= 310000 AND COALESCE(SUM(t.amount), 0) <= 500000 THEN 'Bạc'
                ELSE 'Vàng'
            END as rank
        FROM 
            users u
        LEFT JOIN 
            transactions t ON u.id = t.user_id AND t.status = 'completed'
        GROUP BY 
            u.id, u.email, u.name
        ORDER BY 
            totalPayment DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Lỗi khi lấy danh sách người dùng:", err);
            return res.status(500).json({ success: false, message: "Lỗi server" });
        }
        res.json({ success: true, users: results });
    });
});

app.get('/admin/user-rank', async (req, res) => {
    try {
        const response = await new Promise((resolve, reject) => {
            db.query(`
                SELECT 
                    u.id,
                    u.email,
                    u.name,
                    COALESCE(SUM(t.amount), 0) as totalPayment
                FROM 
                    users u
                LEFT JOIN 
                    transactions t ON u.id = t.user_id AND t.status = 'completed'
                GROUP BY 
                    u.id, u.email, u.name
                ORDER BY 
                    totalPayment DESC
            `, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        res.render('user-rank', {
            title: 'Thứ bậc Người dùng',
            users: response
        });
    } catch (err) {
        console.error("Lỗi khi render user-rank:", err);
        res.status(500).send("Lỗi server");
    }
});

const contactRoutes = require("./routes/contactRoutes");
const authRoutes = require("./routes/authRoutes");

app.use("/", contactRoutes);
app.use("/auth", authRoutes);



// Gắn các endpoint từ adminHandlers
app.get("/login/admin", loginAdminGetHandler);
app.get("/admin", isAuthenticated, adminDashboardHandler);
app.post("/login/admin", loginAdminPostHandler);
app.get("/logout", logoutHandler);
app.get("/admin/contacts", adminContactsHandler);
app.get("/admin/history", adminHistoryHandler);
app.get("/admin/users", adminUsersHandler);
app.post("/admin/users/delete/:id", adminDeleteUserHandler);
app.post("/admin/users/assign-role/:id", isAuthenticated, adminAssignRoleHandler);
app.get("/admin/content-manager", adminContentManagerHandler);
app.get("/admin/pending-content", adminPendingContentHandler);
app.get("/admin/revenue", adminRevenueHandler);
app.get("/admin/revenue/monthly", adminRevenueMonthlyHandler);
app.get("/admin/revenue/yearly", adminRevenueYearlyHandler);
app.get("/admin/revenue/export", exportRevenueHandler);
// Routes từ surveyHandlers
app.get("/api/check-survey", checkSurvey);
app.post("/api/submit-survey", submitSurvey);
app.get("/api/admin/ratings", getAdminRatings);
app.get("/admin/ratings", renderAdminRatings);
app.get("/api/top-surveys", getTopSurveys);
app.use('/api', emailKeywordHandler);
// Khởi động server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
