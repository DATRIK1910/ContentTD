const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/contact", (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: "Email không hợp lệ" });
    db.query("INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)", [name, email, message], (err) => {
        if (err) return res.status(500).json({ message: "Có lỗi xảy ra khi lưu thông tin" });
        res.status(200).json({ message: "Liên hệ đã được gửi thành công!" });
    });
});

module.exports = router;