const express = require("express");
const router = express.Router();
const passport = require("../middleware/auth");
const axios = require("axios");
const db = require("../db");
const configg = require("../configg");

router.get("/current_user", (req, res) => {
    res.json(req.user ? req.user : null);
});

router.post("/api/logout", (req, res) => {
    req.logout(() => {
        res.json({ success: true, message: "Đăng xuất thành công!" });
    });
});

router.post("/auth/google", async (req, res) => {
    try {
        const { token } = req.body;
        const googleRes = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);
        const { sub, name, email } = googleRes.data;

        if (!sub || !email) return res.status(400).json({ success: false, message: "Token không hợp lệ" });

        db.query("SELECT * FROM users WHERE google_id = ?", [sub], async (err, results) => {
            if (err) return res.status(500).json({ success: false, message: "Lỗi server" });

            if (results.length === 0) {
                db.query("INSERT INTO users (google_id, username, email) VALUES (?, ?, ?)", [sub, name, email], (err) => {
                    if (err) return res.status(500).json({ success: false, message: "Lỗi khi lưu user" });
                    return res.json({ success: true, user: { id: sub, name, email } });
                });
            } else {
                return res.json({ success: true, user: results[0] });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xác thực", error: error.message });
    }
});

module.exports = router;