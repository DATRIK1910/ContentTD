// handlers/surveyHandlers.js
const db = require("../db"); // Giả sử bạn đã cấu hình db ở đây

// Endpoint kiểm tra khảo sát
const checkSurvey = (req, res) => {
    const { user_email } = req.query;
    db.query(
        "SELECT COUNT(*) as count FROM survey_responses WHERE user_email = ?",
        [user_email],
        (err, results) => {
            if (err) {
                console.error("Error checking survey:", err);
                return res.status(500).json({ success: false, message: "Lỗi khi kiểm tra khảo sát" });
            }
            res.json({ success: true, hasResponded: results[0].count > 0 });
        }
    );
};

// Endpoint gửi khảo sát
const submitSurvey = (req, res) => {
    const { user_email, is_satisfied, comment } = req.body;
    db.query(
        "INSERT INTO survey_responses (user_email, is_satisfied, comment, created_at) VALUES (?, ?, ?, NOW())",
        [user_email, is_satisfied, comment],
        (err) => {
            if (err) {
                console.error("Error submitting survey:", err);
                return res.status(500).json({ success: false, message: "Lỗi khi gửi khảo sát" });
            }
            res.json({ success: true });
        }
    );
};

// Lấy dữ liệu khảo sát cho admin (API JSON)
const getAdminRatings = (req, res) => {
    db.query(
        "SELECT COUNT(*) as totalResponses FROM survey_responses",
        (err, totalResult) => {
            if (err) {
                console.error("Error fetching total responses:", err);
                return res.status(500).json({ success: false, message: "Lỗi khi lấy tổng số phản hồi" });
            }

            db.query(
                "SELECT COUNT(*) as satisfiedCount FROM survey_responses WHERE is_satisfied = TRUE",
                (err, satisfiedResult) => {
                    if (err) {
                        console.error("Error fetching satisfied count:", err);
                        return res.status(500).json({ success: false, message: "Lỗi khi lấy số người hài lòng" });
                    }

                    db.query(
                        "SELECT COUNT(*) as unsatisfiedCount FROM survey_responses WHERE is_satisfied = FALSE",
                        (err, unsatisfiedResult) => {
                            if (err) {
                                console.error("Error fetching unsatisfied count:", err);
                                return res.status(500).json({ success: false, message: "Lỗi khi lấy số người không hài lòng" });
                            }

                            db.query(
                                "SELECT user_email, comment, created_at, is_satisfied FROM survey_responses WHERE comment IS NOT NULL ORDER BY created_at DESC",
                                (err, commentResult) => {
                                    if (err) {
                                        console.error("Error fetching comments:", err);
                                        return res.status(500).json({ success: false, message: "Lỗi khi lấy góp ý" });
                                    }

                                    console.log("Debug - Comments:", commentResult); // Log để kiểm tra
                                    res.json({
                                        success: true,
                                        totalResponses: totalResult[0].totalResponses,
                                        satisfiedCount: satisfiedResult[0].satisfiedCount,
                                        unsatisfiedCount: unsatisfiedResult[0].unsatisfiedCount,
                                        comments: commentResult,
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};

// Endpoint render trang admin/ratings
const renderAdminRatings = (req, res) => {
    db.query(
        "SELECT COUNT(*) as totalResponses FROM survey_responses",
        (err, totalResult) => {
            if (err) {
                console.error("Error fetching total responses:", err);
                return res.status(500).send("Lỗi khi lấy dữ liệu");
            }

            db.query(
                "SELECT COUNT(*) as satisfiedCount FROM survey_responses WHERE is_satisfied = TRUE",
                (err, satisfiedResult) => {
                    if (err) {
                        console.error("Error fetching satisfied count:", err);
                        return res.status(500).send("Lỗi khi lấy dữ liệu");
                    }

                    db.query(
                        "SELECT COUNT(*) as unsatisfiedCount FROM survey_responses WHERE is_satisfied = FALSE",
                        (err, unsatisfiedResult) => {
                            if (err) {
                                console.error("Error fetching unsatisfied count:", err);
                                return res.status(500).send("Lỗi khi lấy dữ liệu");
                            }

                            db.query(
                                "SELECT user_email, comment, created_at, is_satisfied FROM survey_responses WHERE comment IS NOT NULL ORDER BY created_at DESC",
                                (err, commentResult) => {
                                    if (err) {
                                        console.error("Error fetching comments:", err);
                                        return res.status(500).send("Lỗi khi lấy dữ liệu");
                                    }

                                    console.log("Debug - Comments for render:", commentResult); // Log để kiểm tra
                                    res.render("ratings", {
                                        title: "Khảo sát độ hài lòng",
                                        satisfiedCount: satisfiedResult[0].satisfiedCount,
                                        unsatisfiedCount: unsatisfiedResult[0].unsatisfiedCount,
                                        totalResponses: totalResult[0].totalResponses,
                                        comments: commentResult,
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};

// Endpoint lấy 3 khảo sát hàng đầu
const getTopSurveys = (req, res) => {
    db.query(
        "SELECT user_email, comment, created_at FROM survey_responses ORDER BY created_at DESC LIMIT 3",
        (err, results) => {
            if (err) {
                console.error("Error fetching top surveys:", err);
                return res.status(500).json({ success: false, message: "Lỗi khi lấy khảo sát" });
            }
            res.json({ success: true, surveys: results });
        }
    );
};

module.exports = {
    checkSurvey,
    submitSurvey,
    getAdminRatings,
    renderAdminRatings,
    getTopSurveys,
};