const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/admin", (req, res) => {
    const contactQuery = "SELECT COUNT(*) as contactCount FROM contacts";
    const contentQuery = "SELECT COUNT(*) as articleCount FROM contents";
    const userQuery = "SELECT COUNT(*) as userCount FROM users";

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
    ];

    Promise.all(queries)
        .then(([contactCount, articleCount, userCount]) => {
            res.render("admin", {
                title: "Admin Dashboard",
                contactCount: contactCount || 0,
                articleCount: articleCount || 0,
                userCount: userCount || 0,
            });
        })
        .catch((err) => {
            console.error("Error fetching counts:", err);
            res.status(500).send("Có lỗi xảy ra khi lấy dữ liệu.");
        });
});

router.get("/contacts", (req, res) => {
    const query = "SELECT * FROM contacts ORDER BY created_at DESC";
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching contacts:", err);
            return res.status(500).send("Có lỗi xảy ra khi lấy dữ liệu liên hệ.");
        }
        res.render("contacts", { title: "Quản lý Liên hệ", contacts: results });
    });
});

router.get("/history", (req, res) => {
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

        db.query(
            "SELECT * FROM history ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [itemsPerPage, offset],
            (err, results) => {
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
            }
        );
    });
});

router.get("/users", (req, res) => {
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
});

router.post("/users/delete/:id", (req, res) => {
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
});

router.get("/content-manager", (req, res) => {
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

        db.query(
            "SELECT * FROM contents ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [itemsPerPage, offset],
            (err, results) => {
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
            }
        );
    });
});

router.get("/pending-content", (req, res) => {
    const itemsPerPage = 5;
    const currentPage = parseInt(req.query.page) || 1;
    const offset = (currentPage - 1) * itemsPerPage;

    db.query(
        "SELECT COUNT(*) AS total FROM pending_contents WHERE status = ?",
        ["PENDING"],
        (err, countResult) => {
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
        }
    );
});

router.post("/approve-content", (req, res) => {
    const { id, userEmail } = req.body;

    if (!id || !userEmail) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin id hoặc userEmail" });
    }

    db.query("SELECT * FROM pending_contents WHERE id = ? AND status = ?", [id, "PENDING"], (err, results) => {
        if (err) {
            console.error("Error fetching pending content:", err);
            return res.status(500).json({ success: false, message: "Lỗi khi lấy nội dung chờ duyệt" });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy nội dung chờ duyệt" });
        }

        const content = results[0];
        console.log("Pending content to approve:", content);

        db.query(
            "INSERT INTO history (user_email, topic, category, language, content, created_at, request_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [content.user_email, content.topic, content.category, content.language, content.content, content.created_at, content.request_id],
            (err, result) => {
                if (err) {
                    console.error("Error saving to history:", err);
                    return res.status(500).json({ success: false, message: "Lỗi khi lưu vào lịch sử" });
                }

                console.log("Saved to history:", {
                    user_email: content.user_email,
                    topic: content.topic,
                    category: content.category,
                    language: content.language,
                    content: content.content,
                    created_at: content.created_at,
                    request_id: content.request_id,
                });

                db.query("UPDATE pending_contents SET status = ? WHERE id = ?", ["APPROVED", id], (err) => {
                    if (err) {
                        console.error("Error updating pending content status:", err);
                        return res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái" });
                    }

                    db.query(
                        "INSERT INTO notifications (user_email, message, created_at, request_id) VALUES (?, ?, ?, ?)",
                        [userEmail, "Nội dung của bạn đã được duyệt thành công!", new Date(), content.request_id],
                        (err) => {
                            if (err) {
                                console.error("Error saving notification:", err);
                                return res.status(500).json({ success: false, message: "Lỗi khi lưu thông báo" });
                            }

                            db.query("DELETE FROM pending_contents WHERE id = ?", [id], (err) => {
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
    });
});

router.post("/reject-content", (req, res) => {
    const { id, userEmail } = req.body;

    if (!id || !userEmail) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin id hoặc userEmail" });
    }

    db.query("SELECT * FROM pending_contents WHERE id = ? AND status = ?", [id, "PENDING"], (err, results) => {
        if (err) {
            console.error("Error fetching pending content:", err);
            return res.status(500).json({ success: false, message: "Lỗi khi lấy nội dung chờ duyệt" });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy nội dung chờ duyệt" });
        }

        const content = results[0];

        db.query("UPDATE pending_contents SET status = ? WHERE id = ?", ["REJECTED", id], (err) => {
            if (err) {
                console.error("Error updating pending content status:", err);
                return res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái" });
            }

            db.query(
                "INSERT INTO notifications (user_email, message, created_at, request_id) VALUES (?, ?, ?, ?)",
                [userEmail, "Nội dung của bạn không phù hợp, yêu cầu đã bị từ chối.", new Date(), content.request_id],
                (err) => {
                    if (err) {
                        console.error("Error saving notification:", err);
                        return res.status(500).json({ success: false, message: "Lỗi khi lưu thông báo" });
                    }

                    db.query("DELETE FROM pending_contents WHERE id = ?", [id], (err) => {
                        if (err) {
                            console.error("Error deleting pending content:", err);
                            return res.status(500).json({ success: false, message: "Lỗi khi xóa nội dung chờ duyệt" });
                        }

                        res.status(200).json({ success: true, message: "Từ chối HANDUNG thành công" });
                    });
                }
            );
        });
    });
});

module.exports = router;