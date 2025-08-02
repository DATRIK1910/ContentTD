const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Đảm bảo đường dẫn đến file db đúng
const JWT_SECRET = "your_jwt_secret_key";

// Hàm xử lý đăng ký
const registerHandler = async (req, res) => {
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
};

// Hàm xử lý đăng nhập
const loginHandler = async (req, res) => {
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
        console.error("Login error:", error.message, error.stack);
        res.status(500).json({ success: false, message: "Lỗi server: Xử lý yêu cầu thất bại" });
    }
};

module.exports = { registerHandler, loginHandler };