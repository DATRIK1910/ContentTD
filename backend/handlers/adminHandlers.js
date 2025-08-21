const db = require('../db'); // Đảm bảo đường dẫn đến file db đúng
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = "your_jwt_secret_key";
const exceljs = require('exceljs'); // Thêm thư viện exceljs để tạo file Excel

// Hàm xử lý GET /login/admin
const loginAdminGetHandler = (req, res) => {
    res.render("login-admin", { error: null });
};

// Hàm xử lý GET /admin
const adminDashboardHandler = (req, res) => {
    const contactQuery = "SELECT COUNT(*) as contactCount FROM contacts";
    const contentQuery = "SELECT COUNT(*) as articleCount FROM contents";
    const userQuery = "SELECT COUNT(*) as userCount FROM users";
    const serviceStatsQuery = `
        SELECT 
            category,
            COUNT(*) as usage_count,
            COUNT(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE) THEN 1 ELSE NULL END) as currentValue,
            COUNT(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH) THEN 1 ELSE NULL END) as prevValue
        FROM history
        GROUP BY category
    `;

    const queries = [
        new Promise((resolve, reject) => {
            db.query(contactQuery, (err, result) => {
                if (err) reject(err);
                else resolve(result[0].contactCount);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(contentQuery, (err, result) => {
                if (err) reject(err);
                else resolve(result[0].articleCount);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(userQuery, (err, result) => {
                if (err) reject(err);
                else resolve(result[0].userCount);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(serviceStatsQuery, (err, result) => {
                if (err) reject(err);
                else {
                    const serviceStats = result.map(row => ({
                        category: row.category,
                        usage_count: row.usage_count,
                        currentValue: row.currentValue || 0, // Số lần sử dụng trong tháng hiện tại
                        prevValue: row.prevValue || 0,      // Số lần sử dụng trong tháng trước
                        changeValue: row.currentValue - row.prevValue // Số lượt tăng/giảm
                    }));
                    resolve(serviceStats);
                }
            });
        }),
    ];

    Promise.all(queries)
        .then(([contactCount, articleCount, userCount, serviceStats]) => {
            res.render("admin", {
                title: "Admin Dashboard",
                contactCount: contactCount || 0,
                articleCount: articleCount || 0,
                userCount: userCount || 0,
                serviceStats: serviceStats || [],
            });
        })
        .catch((err) => {
            console.error("Error fetching counts:", err);
            res.status(500).send("Có lỗi xảy ra khi lấy dữ liệu.");
        });
};

// Hàm xử lý POST /login/admin
const loginAdminPostHandler = async (req, res) => {
    try {
        console.log("Received admin login request:", req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.redirect("/login/admin?error=Email và mật khẩu là bắt buộc");
        }

        db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
            if (err) {
                console.error("Database error:", err.message, err.stack);
                return res.redirect("/login/admin?error=Lỗi server: Không thể truy vấn người dùng");
            }

            if (results.length === 0) {
                return res.redirect("/login/admin?error=Email không tồn tại");
            }

            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.redirect("/login/admin?error=Mật khẩu không đúng");
            }

            if (user.role !== 'ADMIN') {
                return res.redirect("/login/admin?error=Tài khoản không phải ADMIN, chỉ ADMIN mới có thể đăng nhập");
            }

            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
            res.cookie("token", token, { httpOnly: true, maxAge: 3600000 }); // 1 giờ
            res.redirect("/admin");
        });
    } catch (error) {
        console.error("Admin login error:", error.message, error.stack);
        res.redirect("/login/admin?error=Lỗi server: Xử lý yêu cầu thất bại");
    }
};

// Hàm xử lý GET /logout
const logoutHandler = (req, res) => {
    res.clearCookie("token"); // Xóa cookie token
    res.redirect("/login/admin");
};

// Hàm xử lý GET /admin/contacts
const adminContactsHandler = (req, res) => {
    const query = "SELECT * FROM contacts ORDER BY created_at DESC";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching contacts:", err);
            return res.status(500).send("Có lỗi xảy ra khi lấy dữ liệu liên hệ.");
        }
        res.render("contacts", { title: "Quản lý Liên hệ", contacts: results });
    });
};

// Hàm xử lý GET /admin/history
const adminHistoryHandler = (req, res) => {
    const itemsPerPage = 5;
    const currentPage = parseInt(req.query.page) || 1;
    const offset = (currentPage - 1) * itemsPerPage;

    db.query("SELECT COUNT(*) AS total FROM history", (err, countResult) => {
        if (err) {
            console.error("Error counting history:", err);
            return res.status(500).send("Lỗi khi đếm dữ liệu lịch sử");
        }

        const totalItems = countResult[0].total;
        const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 1;

        if (totalItems === 0) {
            return res.render("history", {
                title: "Lịch sử",
                history: [],
                currentPage: 1,
                totalPages: 1,
            });
        }

        db.query("SELECT * FROM history ORDER BY created_at DESC LIMIT ? OFFSET ?", [itemsPerPage, offset], (err, results) => {
            if (err) {
                console.error("Error fetching history:", err);
                return res.status(500).send("Lỗi khi lấy dữ liệu lịch sử");
            }

            const adjustedCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

            res.render("history", {
                title: "Lịch sử",
                history: results,
                currentPage: adjustedCurrentPage,
                totalPages: totalPages,
            });
        });
    });
};

const adminUsersHandler = (req, res) => {
    db.query("SELECT * FROM users ORDER BY created_at DESC", (err, results) => {
        if (err) {
            console.error("Database error:", err.message, err.stack);
            return res.status(500).send("Lỗi server");
        }

        // Tính tổng số người dùng
        const totalUsers = results.length;

        // Tính số người dùng mới trong tháng này
        const currentMonth = new Date().getMonth(); // Tháng hiện tại (0-11), tháng 8 là 7
        const currentYear = new Date().getFullYear(); // Năm hiện tại (2025)
        const newUsersThisMonth = results.filter(user => {
            const userDate = new Date(user.created_at);
            return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
        }).length;

        // Tính số người dùng của tháng trước bằng truy vấn SQL
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        db.query(
            "SELECT COUNT(*) as count FROM users WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?",
            [prevMonth + 1, prevYear], // +1 vì MONTH() trong SQL bắt đầu từ 1
            (err, prevMonthResults) => {
                if (err) {
                    console.error("Error fetching previous month data:", err.message, err.stack);
                    return res.status(500).send("Lỗi server");
                }
                const prevNewUsersThisMonth = prevMonthResults[0].count || 0;

                // Tính tổng số người dùng đến cuối tháng trước
                db.query(
                    "SELECT COUNT(*) as count FROM users WHERE created_at < ?",
                    [new Date(currentYear, currentMonth, 1).toISOString().slice(0, 10)],
                    (err, prevTotalResults) => {
                        if (err) {
                            console.error("Error fetching previous total users:", err.message, err.stack);
                            return res.status(500).send("Lỗi server");
                        }
                        const prevTotalUsers = prevTotalResults[0].count || 0;

                        res.render("users", {
                            title: "Quản lý Người dùng",
                            users: results,
                            totalUsers: totalUsers,
                            newUsersThisMonth: newUsersThisMonth,
                            prevTotalUsers: prevTotalUsers,
                            prevNewUsersThisMonth: prevNewUsersThisMonth
                        });
                    }
                );
            }
        );
    });
};

// Hàm xử lý POST /admin/users/delete/:id
const adminDeleteUserHandler = (req, res) => {
    const userId = req.params.id;

    db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
        if (err) {
            console.error("Database error:", err.message, err.stack);
            return res.status(500).send("Lỗi server");
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("Không tìm thấy người dùng");
        }

        res.redirect("/admin/users");
    });
};

// Hàm xử lý POST /admin/users/assign-role/:id
const adminAssignRoleHandler = (req, res) => {
    const userId = req.params.id;
    db.query("UPDATE users SET role = 'ADMIN' WHERE id = ?", [userId], (err) => {
        if (err) {
            console.error("Error assigning role:", err);
            return res.status(500).send("Có lỗi xảy ra khi phân quyền.");
        }
        res.redirect("/admin/users");
    });
};

// Hàm xử lý GET /admin/content-manager
const adminContentManagerHandler = (req, res) => {
    const itemsPerPage = 5;
    const currentPage = parseInt(req.query.page) || 1;
    const offset = (currentPage - 1) * itemsPerPage;

    db.query("SELECT COUNT(*) AS total FROM contents", (err, countResult) => {
        if (err) {
            console.error("Error counting contents:", err);
            return res.status(500).send("Lỗi khi đếm dữ liệu nội dung");
        }

        const totalItems = countResult[0].total;
        const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 1;

        if (totalItems === 0) {
            return res.render("content-manager", {
                title: "Quản lý Nội Dung",
                contents: [],
                currentPage: 1,
                totalPages: 1,
            });
        }

        db.query("SELECT * FROM contents ORDER BY created_at DESC LIMIT ? OFFSET ?", [itemsPerPage, offset], (err, results) => {
            if (err) {
                console.error("Error fetching contents:", err);
                return res.status(500).send("Lỗi khi lấy dữ liệu nội dung");
            }

            const adjustedCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

            res.render("content-manager", {
                title: "Quản lý Nội Dung",
                contents: results,
                currentPage: adjustedCurrentPage,
                totalPages: totalPages,
            });
        });
    });
};

// Hàm xử lý GET /admin/pending-content
const adminPendingContentHandler = (req, res) => {
    const itemsPerPage = 5;
    const currentPage = parseInt(req.query.page) || 1;
    const offset = (currentPage - 1) * itemsPerPage;

    db.query("SELECT COUNT(*) AS total FROM pending_contents WHERE status = ?", ["PENDING"], (err, countResult) => {
        if (err) {
            console.error("Error counting pending contents:", err);
            return res.status(500).send("Lỗi khi đếm dữ liệu nội dung chờ duyệt");
        }

        const totalItems = countResult[0].total;
        const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 1;

        if (totalItems === 0) {
            return res.render("pending-content", {
                title: "Duyệt Nội Dung",
                pendingContents: [],
                currentPage: 1,
                totalPages: 1,
            });
        }

        db.query(
            "SELECT * FROM pending_contents WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            ["PENDING", itemsPerPage, offset],
            (err, results) => {
                if (err) {
                    console.error("Error fetching pending contents:", err);
                    return res.status(500).send("Lỗi khi lấy dữ liệu nội dung chờ duyệt");
                }

                const adjustedCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

                res.render("pending-content", {
                    title: "Duyệt Nội Dung",
                    pendingContents: results,
                    currentPage: adjustedCurrentPage,
                    totalPages: totalPages,
                });
            }
        );
    });
};

// Hàm xử lý GET /admin/revenue
const adminRevenueHandler = (req, res) => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // Tháng hiện tại (1-12)
        const currentYear = currentDate.getFullYear();   // Năm hiện tại (2025)

        // Lấy danh sách khách hàng để hiển thị trong filter
        db.query("SELECT id, email FROM users", (err, users) => {
            if (err) {
                console.error("Error fetching users:", err);
                return res.status(500).send("Có lỗi xảy ra khi lấy danh sách người dùng.");
            }

            // Lấy tất cả giao dịch đã hoàn tất
            db.query(
                "SELECT t.*, u.email AS user_email FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.status = 'completed' ORDER BY t.created_at DESC",
                (err, transactions) => {
                    if (err) {
                        console.error("Database error in /admin/revenue:", err.message, err.stack);
                        return res.status(500).send("Lỗi server");
                    }

                    // Tính doanh thu tháng hiện tại
                    const monthlyRevenue = transactions
                        .filter(t => new Date(t.created_at).getMonth() + 1 === currentMonth && new Date(t.created_at).getFullYear() === currentYear)
                        .reduce((sum, t) => sum + (t.amount || 0), 0);

                    // Tính doanh thu năm hiện tại
                    const yearlyRevenue = transactions
                        .filter(t => new Date(t.created_at).getFullYear() === currentYear)
                        .reduce((sum, t) => sum + (t.amount || 0), 0);

                    // Tính doanh thu tháng trước
                    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
                    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
                    const prevMonthlyRevenue = transactions
                        .filter(t => new Date(t.created_at).getMonth() + 1 === prevMonth && new Date(t.created_at).getFullYear() === prevYear)
                        .reduce((sum, t) => sum + (t.amount || 0), 0);

                    // Tính phần trăm thay đổi so với tháng trước
                    let monthlyRevenueChangePercent = 0;
                    if (prevMonthlyRevenue > 0) {
                        monthlyRevenueChangePercent = ((monthlyRevenue - prevMonthlyRevenue) / prevMonthlyRevenue * 100).toFixed(2);
                    }

                    const selectedUserId = req.query.user_id;
                    let filteredTransactions = transactions;
                    let totalAmount = 0;

                    if (selectedUserId) {
                        filteredTransactions = transactions.filter(t => t.user_id.toString() === selectedUserId);
                        totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                    } else {
                        totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                    }

                    res.render("revenue", {
                        title: "Quản lý Doanh thu",
                        currentMonth,
                        currentYear,
                        monthlyRevenue,
                        yearlyRevenue,
                        prevMonthlyRevenue,
                        monthlyRevenueChangePercent,
                        transactions: filteredTransactions,
                        users: users,
                        selectedUserId: selectedUserId || "",
                        totalAmount: totalAmount
                    });
                }
            );
        });
    } catch (error) {
        console.error("Error in /admin/revenue:", error.message, error.stack);
        res.status(500).send("Lỗi server");
    }
};

// Hàm xử lý GET /admin/revenue/monthly
const adminRevenueMonthlyHandler = (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        db.query("SELECT * FROM transactions WHERE YEAR(created_at) = ?", [currentYear], (err, transactions) => {
            if (err) {
                console.error("Error fetching transactions for monthly revenue:", err);
                return res.status(500).send("Có lỗi xảy ra khi lấy dữ liệu doanh thu theo tháng.");
            }

            // Tính monthlyData từ transactions, loại trừ hoàn tiền
            const monthlyData = Array(12).fill(0).map((_, i) => {
                return transactions
                    .filter(t => t.status === 'completed' && (!t.refund_status || t.refund_status !== 'PROCESSED')
                        && new Date(t.created_at).getMonth() === i)
                    .reduce((sum, t) => sum + t.amount, 0);
            });

            res.render("revenue_monthly", {
                title: "Doanh thu Theo Tháng",
                monthlyData,
                currentYear,
                transactions // Truyền transactions để template sử dụng
            });
        });
    } catch (error) {
        console.error("Error in /admin/revenue/monthly:", error.message, error.stack);
        res.status(500).send("Lỗi server");
    }
};

// Hàm xử lý GET /admin/revenue/yearly
const adminRevenueYearlyHandler = (req, res) => {
    try {
        db.query("SELECT * FROM transactions", (err, transactions) => {
            if (err) {
                console.error("Error fetching transactions for yearly revenue:", err);
                return res.status(500).send("Có lỗi xảy ra khi lấy dữ liệu doanh thu theo năm.");
            }

            // Tính yearlyData từ transactions, loại trừ hoàn tiền
            const yearlyData = [];
            const years = [...new Set(transactions.map(t => new Date(t.created_at).getFullYear()))];
            years.forEach(year => {
                const total = transactions
                    .filter(t => t.status === 'completed' && (!t.refund_status || t.refund_status !== 'PROCESSED')
                        && new Date(t.created_at).getFullYear() === year)
                    .reduce((sum, t) => sum + t.amount, 0);
                yearlyData.push({ year, total });
            });

            res.render("revenue_yearly", {
                title: "Doanh thu Theo Năm",
                yearlyData,
                transactions // Truyền transactions để template sử dụng
            });
        });
    } catch (error) {
        console.error("Error in /admin/revenue/yearly:", error.message, error.stack);
        res.status(500).send("Lỗi server");
    }
};

// Hàm xử lý GET /admin/revenue/export
const exportRevenueHandler = (req, res) => {
    try {
        // Lấy tất cả giao dịch đã hoàn tất
        db.query(
            "SELECT t.*, u.email AS user_email FROM transactions t JOIN users u ON t.user_id = u.id WHERE t.status = 'completed' ORDER BY t.created_at DESC",
            async (err, transactions) => {
                if (err) {
                    console.error("Database error in /admin/revenue/export:", err.message, err.stack);
                    return res.status(500).send("Có lỗi xảy ra khi lấy dữ liệu giao dịch.");
                }

                // Tạo workbook và worksheet
                const workbook = new exceljs.Workbook();
                const worksheet = workbook.addWorksheet("Revenue Report");

                // Định nghĩa header
                worksheet.columns = [
                    { header: "ID Giao dịch", key: "id", width: 10 },
                    { header: "Email Khách hàng", key: "user_email", width: 30 },
                    { header: "Số tiền", key: "amount", width: 15 },
                    { header: "Trạng thái", key: "status", width: 15 },
                    { header: "Thời gian", key: "created_at", width: 20 }
                ];

                // Thêm dữ liệu giao dịch
                transactions.forEach(transaction => {
                    worksheet.addRow({
                        id: transaction.id,
                        user_email: transaction.user_email,
                        amount: transaction.amount,
                        status: transaction.status,
                        created_at: new Date(transaction.created_at).toLocaleString("vi-VN")
                    });
                });

                // Tạo file buffer
                const buffer = await workbook.xlsx.writeBuffer();
                res.setHeader('Content-Disposition', 'attachment; filename="revenue_report.xlsx"');
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.send(buffer);
            }
        );
    } catch (error) {
        console.error("Error in /admin/revenue/export:", error.message, error.stack);
        res.status(500).send("Lỗi server khi xuất file Excel.");
    }
};

// Hàm xử lý GET /admin/payment-management
const adminPaymentManagementHandler = (req, res) => {
    db.query("SELECT * FROM transactions WHERE status = 'pending' ORDER BY created_at DESC", (err, results) => {
        if (err) {
            console.error("Error fetching transactions:", err);
            return res.status(500).send("Có lỗi xảy ra khi lấy dữ liệu giao dịch.");
        }
        res.render("payment-management", {
            title: "Quản lý Thanh toán",
            transactions: results
        });
    });
};

// Endpoint /admin/confirm-transaction (Xác nhận giao dịch từ admin)
const adminConfirmTransactionHandler = (req, res) => {
    const { transactionId } = req.body;
    if (!transactionId) {
        return res.status(400).json({ success: false, message: "Thiếu transactionId" });
    }

    db.query(
        "SELECT user_id, diamonds FROM transactions WHERE transaction_id = ? AND status = 'pending'",
        [transactionId],
        (err, results) => {
            if (err || results.length === 0) {
                return res.status(404).json({ success: false, message: "Giao dịch không tồn tại hoặc đã xử lý" });
            }
            const { user_id, diamonds } = results[0];

            db.query(
                "UPDATE users SET diamonds = diamonds + ? WHERE id = ?",
                [diamonds, user_id],
                (err) => {
                    if (err) {
                        console.error("Database error in update diamonds:", err.message, err.stack);
                        return res.status(500).json({ success: false, message: err.message });
                    }
                    db.query(
                        "UPDATE transactions SET status = 'completed', created_at = NOW() WHERE transaction_id = ?",
                        [transactionId],
                        (err) => {
                            if (err) {
                                console.error("Database error in update transaction:", err.message, err.stack);
                                return res.status(500).json({ success: false, message: err.message });
                            }

                        }
                    );
                }
            );
        }
    );
};



module.exports = {
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
    exportRevenueHandler,
    adminPaymentManagementHandler,
    adminConfirmTransactionHandler,
};