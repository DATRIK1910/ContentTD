const db = require('../db');
const jwt = require('jsonwebtoken');
const querystring = require('querystring');
const { createHash } = require('crypto');
const uuidv4 = require('uuid').v4;
const configg = require('../configg');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Cấu hình email (cần chỉnh sửa)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: '1050080260@sv.hcmunre.edu.vn',
        pass: 'rypp jnci tlfv zquh'
    }
});

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
        console.error("Error in /api/buy-diamonds-manual:", error.message, err.stack);
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

const requestRefundHandler = (req, res) => {
    const { transaction_id, reason } = req.body;
    const user_id = req.user.id;


    try {
        if (!user_id || !transaction_id || !reason) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc (user_id, transaction_id, hoặc reason)" });
        }

        db.query(
            "SELECT * FROM transactions WHERE transaction_id = ? AND user_id = ? AND status = 'completed'",
            [transaction_id, user_id],
            (err, results) => {
                if (err) {
                    console.error("Database error in query transaction:", err.message, err.stack);
                    return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                }
                if (results.length === 0) {
                    return res.status(404).json({ success: false, message: "Giao dịch không hợp lệ" });
                }

                const transaction = results[0];
                const now = new Date();
                const createdAt = new Date(transaction.created_at);
                const diffMinutes = (now - createdAt) / (1000 * 60);
                if (diffMinutes > 60) {
                    return res.status(400).json({ success: false, message: "Giao dịch đã quá 1 giờ, không thể hoàn tiền" });
                }

                const otp = crypto.randomInt(100000, 999999).toString();
                db.query(
                    "INSERT INTO refunds (transaction_id, user_id, refund_amount, reason, status, otp) VALUES (?, ?, ?, ?, 'PENDING', ?)",
                    [transaction_id, user_id, transaction.amount, reason, otp],
                    (err) => {
                        if (err) {
                            console.error("Database error in insert refund:", err.message, err.stack);
                            return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                        }
                        res.json({ success: true, message: "Vui lòng nhập email để nhận mã OTP" });
                    }
                );
            }
        );
    } catch (error) {
        console.error("Error in /api/request-refund:", error.message, error.stack);
        res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
    }
};

// Thêm handler gửi OTP
const sendOtpHandler = (req, res) => {
    const { transaction_id, otp_email } = req.body;
    const user_id = req.user.id;


    try {
        if (!user_id || !transaction_id || !otp_email) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc (user_id, transaction_id, hoặc otp_email)" });
        }

        db.query(
            "SELECT otp FROM refunds WHERE transaction_id = ? AND user_id = ? AND status = 'PENDING'",
            [transaction_id, user_id],
            (err, results) => {
                if (err) {
                    console.error("Database error in query refund:", err.message, err.stack);
                    return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                }
                if (results.length === 0) {
                    return res.status(404).json({ success: false, message: "Yêu cầu hoàn tiền không tồn tại" });
                }

                const otp = results[0].otp;
                const mailOptions = {
                    from: 'your-email@gmail.com',
                    to: otp_email,
                    subject: 'Mã OTP để xác nhận hoàn tiền',
                    text: `Mã OTP của bạn là: ${otp}. Vui lòng không chia sẻ mã này với bất kỳ ai.`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Email error:", error.message, error.stack);
                        return res.status(500).json({ success: false, message: "Lỗi khi gửi email: " + error.message });
                    }
                    res.json({ success: true, message: "Mã OTP đã được gửi đến email của bạn" });
                });
            }
        );
    } catch (error) {
        console.error("Error in /api/send-otp:", error.message, error.stack);
        res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
    }
};
// Endpoint /api/verify-otp
const verifyOtpHandler = (req, res) => {
    const { transaction_id, otp_email, otp } = req.body;
    const user_id = req.user.id;

    try {
        if (!transaction_id || !otp_email || !otp) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
        }

        db.query(
            "SELECT * FROM refunds WHERE transaction_id = ? AND user_id = ? AND status = 'PENDING'",
            [transaction_id, user_id],
            (err, results) => {
                if (err) return res.status(500).json({ success: false, message: "Lỗi server" });
                if (results.length === 0) return res.status(404).json({ success: false, message: "Yêu cầu không tồn tại" });

                const refund = results[0];
                if (refund.otp !== otp) return res.status(400).json({ success: false, message: "Mã OTP không đúng" });

                db.query(
                    "UPDATE refunds SET status = 'VERIFIED', otp_email = ? WHERE id = ?",
                    [otp_email, refund.id],
                    (err) => {
                        if (err) return res.status(500).json({ success: false, message: "Lỗi server" });

                        transporter.sendMail({
                            from: 'your-email@gmail.com',
                            to: otp_email,
                            subject: 'Mã OTP để hoàn tiền',
                            text: `Mã OTP của bạn là: ${refund.otp}. Vui lòng không chia sẻ mã này!`
                        }, (error) => {
                            if (error) console.error("Lỗi gửi email:", error);
                        });

                        res.json({ success: true, message: "Mã OTP đã được gửi đến email của bạn, vui lòng kiểm tra" });
                    }
                );
            }
        );
    } catch (error) {
        console.error("Error in /api/verify-otp:", error.message);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

const processRefundHandler = (req, res) => {
    const { refund_id } = req.body;


    try {
        if (!refund_id) {
            return res.status(400).json({ success: false, message: "Thiếu refund_id" });
        }

        // Lấy thông tin hoàn tiền và giao dịch liên quan
        db.query(
            "SELECT r.*, t.amount, t.user_id, u.diamonds, t.transaction_id FROM refunds r JOIN transactions t ON r.transaction_id = t.transaction_id JOIN users u ON t.user_id = u.id WHERE r.id = ? AND r.status = 'VERIFIED'",
            [refund_id],
            (err, results) => {
                console.log("Query results:", results); // Debug kết quả truy vấn
                if (err) {
                    console.error("Database error in query refund:", err.message, err.stack);
                    return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                }
                if (results.length === 0) {
                    return res.status(400).json({ success: false, message: "Yêu cầu hoàn tiền không hợp lệ hoặc chưa được xác minh (VERIFIED)" });
                }

                const refund = results[0];
                const { amount, user_id, diamonds, transaction_id } = refund;

                // Xác định số kim cương cần trừ dựa trên số tiền
                let refundDiamonds;
                if (amount === 100000) refundDiamonds = 100;  // Gói 100k: trừ 100kc
                else if (amount === 200000) refundDiamonds = 210; // Gói 200k: trừ 210kc
                else if (amount === 500000) refundDiamonds = 550; // Gói 500k: trừ 550kc
                else {
                    return res.status(400).json({ success: false, message: "Gói giao dịch không hợp lệ" });
                }
                console.log("Calculated refundDiamonds:", refundDiamonds); // Debug số kim cương cần trừ

                // Kiểm tra số kim cương hiện có
                if (diamonds < refundDiamonds) {
                    return res.status(400).json({ success: false, message: `Số kim cương không đủ để hoàn tiền. Cần ${refundDiamonds}, hiện có ${diamonds}` });
                }

                // Trừ kim cương và cập nhật trạng thái hoàn tiền
                db.query(
                    "UPDATE users SET diamonds = diamonds - ? WHERE id = ?",
                    [refundDiamonds, user_id],
                    (err) => {
                        if (err) {
                            console.error("Database error in update diamonds:", err.message, err.stack);
                            return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                        }
                        db.query(
                            "UPDATE refunds SET status = 'PROCESSED' WHERE id = ?",
                            [refund_id],
                            (err) => {
                                if (err) {
                                    console.error("Database error in update refund:", err.message, err.stack);
                                    return res.status(500).json({ success: false, message: "Lỗi server: " + err.message });
                                }
                                // Cập nhật trạng thái hoàn tiền trong transactions
                                db.query(
                                    "UPDATE transactions SET refund_status = 'PROCESSED' WHERE transaction_id = ?",
                                    [transaction_id],
                                    (err) => {
                                        if (err) {
                                            console.error("Error updating transaction refund_status:", err.message, err.stack);
                                        }
                                        res.json({ success: true, message: "Hoàn tiền đã được xử lý thành công" });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        console.error("Error in /admin/process-refund:", error.message, error.stack);
        res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
    }
};

module.exports = {
    buyDiamondsHandler,
    buyDiamondsManualHandler,
    updateTransactionStatusHandler,
    vnpayReturnHandler,
    requestRefundHandler,
    verifyOtpHandler,
    processRefundHandler,
    sendOtpHandler,
};