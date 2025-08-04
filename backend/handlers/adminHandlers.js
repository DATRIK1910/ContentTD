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
    const serviceStatsQuery = "SELECT category, COUNT(*) as usage_count FROM history GROUP BY category ORDER BY usage_count DESC";

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
                else resolve(result);
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

// Hàm xử lý GET /admin/users
const adminUsersHandler = (req, res) => {
    db.query("SELECT * FROM users ORDER BY created_at DESC", (err, results) => {
        if (err) {
            console.error("Database error:", err.message, err.stack);
            return res.status(500).send("Lỗi server");
        }

        res.render("users", {
            title: "Quản lý Người dùng",
            users: results,
        });
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
        db.query("SELECT MONTH(created_at) as month, SUM(amount) as total FROM transactions WHERE status = 'completed' AND YEAR(created_at) = ? GROUP BY MONTH(created_at)", [currentYear], (err, results) => {
            if (err) {
                console.error("Error fetching monthly revenue:", err);
                return res.status(500).send("Có lỗi xảy ra khi lấy dữ liệu doanh thu theo tháng.");
            }
            const monthlyData = Array(12).fill(0).map((_, i) => {
                const found = results.find(r => r.month === i + 1);
                return found ? found.total : 0;
            });
            res.render("revenue_monthly", { title: "Doanh thu Theo Tháng", monthlyData, currentYear });
        });
    } catch (error) {
        console.error("Error in /admin/revenue/monthly:", error.message, error.stack);
        res.status(500).send("Lỗi server");
    }
};

// Hàm xử lý GET /admin/revenue/yearly
const adminRevenueYearlyHandler = (req, res) => {
    try {
        db.query("SELECT YEAR(created_at) as year, SUM(amount) as total FROM transactions WHERE status = 'completed' GROUP BY YEAR(created_at) ORDER BY YEAR(created_at) DESC", (err, results) => {
            if (err) {
                console.error("Error fetching yearly revenue:", err);
                return res.status(500).send("Có lỗi xảy ra khi lấy dữ liệu doanh thu theo năm.");
            }
            const yearlyData = results.map(r => ({ year: r.year, total: r.total }));
            res.render("revenue_yearly", { title: "Doanh thu Theo Năm", yearlyData });
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
    exportRevenueHandler
};