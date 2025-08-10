const express = require("express");
const router = express.Router();
const db = require("../db");
const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: '1050080260@sv.hcmunre.edu.vn',
        pass: 'rypp jnci tlfv zquh'
    }
});


router.post("/contact", (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message)
        return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
        return res.status(400).json({ message: "Email không hợp lệ" });

    db.query(
        "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)",
        [name, email, message],
        (err) => {
            if (err)
                return res
                    .status(500)
                    .json({ message: "Có lỗi xảy ra khi lưu thông tin" });

            // Gửi email đến admin
            const mailOptions = {
                from: "nguyentandat12d701@gmail.com", // Email gửi đi
                to: "1050080260@sv.hcmunre.edu.vn", // Email admin nhận
                subject: "Liên hệ mới từ ContentDT",
                text: `Thông tin liên hệ mới:\n\nTên: ${name}\nEmail: ${email}\nTin nhắn: ${message}\n\nVui lòng kiểm tra và phản hồi sớm nhất.`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Email error:", error.message, error.stack);
                    // Tiếp tục trả về thành công ngay cả khi email thất bại (tùy chọn)
                    return res
                        .status(200)
                        .json({ message: "Liên hệ đã được gửi thành công!" });
                }
                console.log("Email sent:", info.response);
                res
                    .status(200)
                    .json({ message: "Liên hệ đã được gửi thành công!" });
            });
        }
    );
});

module.exports = router;