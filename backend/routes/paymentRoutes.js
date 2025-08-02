const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const querystring = require("querystring");
const { addDiamonds, getUserDiamonds } = require("../models/userModel");
const configg = require("../configg");
const { db } = require("../server"); // Import db từ server.js

// Middleware giả định để lấy user_id từ session/token (thay bằng logic thực tế)
const authenticate = (req, res, next) => {
    const user = req.session?.user || null; // Giả định dùng session
    if (!user || !user.id) {
        return res.status(401).json({ success: false, message: "Vui lòng đăng nhập!" });
    }
    req.user = user;
    next();
};

router.post("/buy-diamonds", authenticate, async (req, res) => {
    const { amount } = req.body;
    const user_id = req.user.id; // Lấy user_id từ session/token
    console.log("Request to /buy-diamonds:", { user_id, amount });
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
                diamonds = 200;
                break;
            case 500000:
                diamonds = 500;
                break;
            default:
                throw new Error("Số tiền không hợp lệ!");
        }

        const vnp_TmnCode = configg.vnpay.tmnCode;
        const vnp_HashSecret = configg.vnpay.hashSecret;
        const vnp_Url = configg.vnpay.url;
        const vnp_ReturnUrl = "http://localhost:3000/vnpay-return"; // Cập nhật với ngrok nếu cần
        const vnp_TxnRef = uuidv4();
        const vnp_Amount = amount * 100;
        const vnp_OrderInfo = `Mua ${diamonds} kim cương (${amount} VNĐ)`;
        const vnp_IpAddr = req.ip || "127.0.0.1";

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

        const sortedParams = Object.keys(vnp_Params)
            .sort()
            .reduce((acc, key) => (acc[key] = vnp_Params[key], acc), {});
        const signData = querystring.stringify(sortedParams) + `&vnp_SecureHash=${vnp_HashSecret}`;
        const secureHash = crypto.createHash("sha256").update(signData).digest("hex");

        vnp_Params.vnp_SecureHash = secureHash;
        const paymentUrl = `${vnp_Url}?${querystring.stringify(vnp_Params)}`;
        console.log("Payment URL:", paymentUrl);

        // Lưu thông tin giao dịch vào database (tùy chọn)
        await db.query(
            "INSERT INTO transactions (user_id, amount, diamonds, transaction_id, status) VALUES (?, ?, ?, ?, ?)",
            [user_id, amount, diamonds, vnp_TxnRef, "pending"]
        );

        res.json({ success: true, url: paymentUrl });
    } catch (error) {
        console.error("Error in /buy-diamonds:", error.message, error.stack);
        res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
    }
});

router.get("/vnpay-return", async (req, res) => {
    const vnp_Params = req.query;
    const vnp_HashSecret = configg.vnpay.hashSecret;
    const secureHash = vnp_Params.vnp_SecureHash;

    let orderId = vnp_Params.vnp_TxnRef;
    let rspCode = vnp_Params.vnp_ResponseCode;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const signData = querystring.stringify(vnp_Params, { encode: false }) + `&vnp_SecureHash=${vnp_HashSecret}`;
    const checkHash = crypto.createHash("sha256").update(signData).digest("hex");

    if (secureHash === checkHash) {
        if (rspCode === "00") {
            const amount = vnp_Params.vnp_Amount / 100;
            let diamonds;
            switch (amount) {
                case 100000:
                    diamonds = 100;
                    break;
                case 200000:
                    diamonds = 200;
                    break;
                case 500000:
                    diamonds = 500;
                    break;
                default:
                    diamonds = 0;
            }

            // Lấy user_id từ session/token (giả định)
            const user = req.session?.user || null;
            if (!user || !user.id) {
                return res.status(401).send("Vui lòng đăng nhập để cập nhật kim cương!");
            }
            const userId = user.id;

            // Cập nhật kim cương
            await addDiamonds(userId, diamonds);

            // Cập nhật trạng thái giao dịch
            await db.query(
                "UPDATE transactions SET status = ?, completed_at = NOW() WHERE transaction_id = ?",
                ["completed", orderId]
            );

            res.send(`Thanh toán thành công! Bạn đã nhận được ${diamonds} kim cương.`);
        } else {
            // Cập nhật trạng thái giao dịch thất bại
            await db.query(
                "UPDATE transactions SET status = ? WHERE transaction_id = ?",
                ["failed", orderId]
            );
            res.send("Thanh toán thất bại.");
        }
    } else {
        res.send("Chữ ký không hợp lệ.");
    }
});

module.exports = router;