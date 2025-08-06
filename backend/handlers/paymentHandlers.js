const db = require('../db');
const jwt = require('jsonwebtoken');
const querystring = require('querystring');
const { createHash } = require('crypto');
const uuidv4 = require('uuid').v4;
const configg = require('../configg');

// Endpoint /api/buy-diamonds 
const buyDiamondsHandler = (req, res) => {
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
            db.query(
                "INSERT INTO transactions (user_id, amount, diamonds, transaction_id, status) VALUES (?, ?, ?, ?, ?)",
                [user_id, amount, diamonds, vnp_TxnRef, "completed"],
                (err) => {
                    if (err) {
                        console.error("Database error in insert transaction:", err.message, err.stack);
                        return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                    }
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
            const signData = querystring.stringify(sortedParams) + `&vnp_SecureHash=${vnp_HashSecret}`;
            const secureHash = createHash("sha256").update(signData).digest("hex");

            vnp_Params.vnp_SecureHash = secureHash;
            const paymentUrl = `${vnp_Url}?${querystring.stringify(vnp_Params)}`;
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
};

// Endpoint /api/buy-diamonds-manual 
const buyDiamondsManualHandler = (req, res) => {
    const { amount, diamonds } = req.body;
    const user_id = req.user.id;
    console.log("Request to /api/buy-diamonds-manual:", { user_id, amount, diamonds });
    try {
        if (!user_id || !amount || !diamonds) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
        }

        const transactionId = `TXN_${uuidv4().slice(0, 8)}_${Date.now()}`;
        db.query(
            "INSERT INTO transactions (user_id, amount, diamonds, transaction_id, status) VALUES (?, ?, ?, ?, ?)",
            [user_id, amount, diamonds, transactionId, "pending"],
            (err) => {
                if (err) {
                    console.error("Database error in insert transaction:", err.message, err.stack);
                    return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                }
                res.json({ success: true, transactionId });
            }
        );
    } catch (error) {
        console.error("Error in /api/buy-diamonds-manual:", error.message, error.stack);
        res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
    }
};

// Endpoint /api/update-transaction-status 
const updateTransactionStatusHandler = (req, res) => {
    const { transactionId, status } = req.body;
    if (!transactionId || !status) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin" });
    }

    db.query(
        "UPDATE transactions SET status = ? WHERE transaction_id = ?",
        [status, transactionId],
        (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: "Cập nhật trạng thái thành công" });
        }
    );
};

// Endpoint /vnpay-return 
const vnpayReturnHandler = (req, res) => {
    const vnp_Params = req.query;
    const vnp_HashSecret = configg.vnpay.hashSecret;
    const secureHash = vnp_Params.vnp_SecureHash;

    console.log("VNPay Return Params:", vnp_Params);

    let orderId = vnp_Params.vnp_TxnRef;
    let rspCode = vnp_Params.vnp_ResponseCode;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const signData = querystring.stringify(vnp_Params, { encode: false }) + `&vnp_SecureHash=${vnp_HashSecret}`;
    const checkHash = createHash("sha256").update(signData).digest("hex");

    if (secureHash === checkHash) {
        if (rspCode === "00") {
            const amount = vnp_Params.vnp_Amount / 100;
            let diamonds;
            switch (amount) {
                case 100000: diamonds = 100; break;
                case 200000: diamonds = 210; break;
                case 500000: diamonds = 550; break;
                default: diamonds = 0;
            }

            const token = req.cookies.token;
            if (!token) return res.status(401).send("Vui lòng đăng nhập để cập nhật kim cương!");
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
                    if (err) console.error("Database error in update transaction:", err.message, err.stack);
                    res.send("Thanh toán thất bại.");
                }
            );
        }
    } else {
        res.send("Chữ ký không hợp lệ.");
    }
};

module.exports = {
    buyDiamondsHandler,
    buyDiamondsManualHandler,
    updateTransactionStatusHandler,
    vnpayReturnHandler
};