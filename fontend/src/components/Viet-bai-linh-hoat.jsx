import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import { ipBE } from "../data/consts";

const FlexibleWritingPage = () => {
    const [topic, setTopic] = useState("");
    const [keyword, setKeyword] = useState("");
    const [category, setCategory] = useState("Giáo dục");
    const [language, setLanguage] = useState("vi");
    const [length, setLength] = useState(100);
    const [notification, setNotification] = useState("");
    const [pendingRequest, setPendingRequest] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [file, setFile] = useState(null);
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSurvey, setShowSurvey] = useState(false);
    const [surveySubmitted, setSurveySubmitted] = useState(false);
    const [isSatisfied, setIsSatisfied] = useState(null);
    const [comment, setComment] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [selectedText, setSelectedText] = useState(""); // Lưu đoạn text được bôi đen
    const [diamonds, setDiamonds] = useState(0); // Thêm trạng thái kim cương
    const [user] = useState(JSON.parse(localStorage.getItem("user"))); // Kiểm tra user
    const navigate = useNavigate();

    // Hàm lấy số kim cương từ API
    const fetchDiamonds = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token || !user) {
                setDiamonds(0); // Không lấy kim cương nếu chưa đăng nhập
                return;
            }
            const response = await axios.get(ipBE + "api/user-diamonds", {
                withCredentials: true,
                headers: { Authorization: `Bearer ${token}` },
            });
            setDiamonds(response.data.diamonds);
        } catch (err) {
            console.error("Lỗi lấy kim cương:", err.response?.data?.message || err.message);
            setDiamonds(0); // Đặt mặc định 0 nếu có lỗi
            if (err.response?.data?.message === "Token đã hết hạn, vui lòng đăng nhập lại!") {
                localStorage.removeItem("token");
                window.location.href = "/login";
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let interval;
        if (pendingRequest && currentRequest && user) {
            interval = setInterval(async () => {
                try {
                    const notificationResponse = await axios.get(
                        ipBE + "api/notifications",
                        {
                            params: { user_email: user.email },
                            withCredentials: true,
                        }
                    );

                    if (notificationResponse.status === 200 && notificationResponse.data.success && notificationResponse.data.notifications.length > 0) {
                        const matchingNotification = notificationResponse.data.notifications.find(
                            (notif) => notif.request_id === currentRequest.requestId
                        );

                        if (matchingNotification) {
                            setNotification(matchingNotification.message);

                            if (matchingNotification.message.includes("đã được duyệt")) {
                                const historyResponse = await axios.get(
                                    ipBE + "api/user-history",
                                    {
                                        params: { user_email: user.email },
                                        withCredentials: true,
                                    }
                                );

                                if (historyResponse.status === 200 && historyResponse.data.success && historyResponse.data.history.length > 0) {
                                    const matchingContent = historyResponse.data.history.find(
                                        (item) => item.request_id === currentRequest.requestId
                                    );
                                    if (matchingContent) {
                                        setResult(matchingContent.content);
                                        if (!surveySubmitted) {
                                            setTimeout(() => setShowSurvey(true), 30000);
                                        }
                                    } else {
                                        setResult("Không tìm thấy nội dung vừa duyệt trong lịch sử. Vui lòng kiểm tra lại!");
                                    }
                                } else {
                                    setResult("Không tìm thấy nội dung trong lịch sử. Vui lòng kiểm tra lại!");
                                }
                                setPendingRequest(false);
                                setCurrentRequest(null);
                                // Cập nhật kim cương sau khi duyệt thành công
                                await fetchDiamonds();
                                clearInterval(interval);
                            } else if (matchingNotification.message.includes("bị từ chối")) {
                                setResult("Nội dung không phù hợp, yêu cầu đã bị từ chối.");
                                setPendingRequest(false);
                                setCurrentRequest(null);
                                // Cập nhật kim cương nếu bị từ chối (khôi phục nếu cần)
                                await fetchDiamonds();
                                clearInterval(interval);
                            }
                        } else {
                            setResult("Đang chờ hệ thống xử lý, bạn vui lòng chờ trong ít phút...");
                        }
                    } else {
                        setResult("Đang chờ hệ thống xử lý, bạn vui lòng chờ trong ít phút...");
                    }
                } catch (error) {
                    console.error("Lỗi chi tiết khi kiểm tra thông báo:", error.response ? error.response.status : error.message);
                    setResult("Lỗi khi kiểm tra trạng thái duyệt: " + (error.response ? error.response.statusText : error.message));
                    setPendingRequest(false);
                    setCurrentRequest(null);
                    clearInterval(interval);
                }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [pendingRequest, currentRequest, user, surveySubmitted]);

    useEffect(() => {
        // Lấy số kim cương khi component mount hoặc user thay đổi
        if (user) {
            fetchDiamonds();
        } else {
            setDiamonds(0); // Reset khi chưa đăng nhập
        }
    }, [user]);

    useEffect(() => {
        const handleContextMenu = (e) => {
            const selection = window.getSelection();
            if (selection.toString() && result) {
                e.preventDefault();
                setSelectedText(selection.toString());
                const contextMenu = document.createElement("div");
                contextMenu.id = "custom-context-menu";
                contextMenu.style.cssText = `
                    position: absolute;
                    background: white;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    z-index: 1000;
                    padding: 4px 0;
                    top: ${e.pageY}px;
                    left: ${e.pageX}px;
                `;
                contextMenu.innerHTML = `
                    <div class="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer" onclick="handleRewriteSection()">Viết lại đoạn này</div>
                `;
                document.body.appendChild(contextMenu);

                // Xóa menu khi click ra ngoài
                const handleClickOutside = () => {
                    const menu = document.getElementById("custom-context-menu");
                    if (menu) menu.remove();
                    document.removeEventListener("click", handleClickOutside);
                };
                document.addEventListener("click", handleClickOutside);
            }
        };

        document.addEventListener("contextmenu", handleContextMenu);
        return () => document.removeEventListener("contextmenu", handleContextMenu);
    }, [result]);

    useEffect(() => {
        const handleRewriteSection = async () => {
            if (selectedText && result && user) {
                setLoading(true);
                try {
                    const response = await axios.post(
                        ipBE + "api/rewrite-section",
                        {
                            user_email: user.email,
                            original_content: result,
                            selected_text: selectedText,
                            field: category,
                            language,
                            topic,
                            keyword,
                            length,
                        },
                        { withCredentials: true }
                    );

                    if (response.data.success) {
                        const newContent = response.data.content;
                        setResult(newContent);
                        setSelectedText("");
                    } else {
                        alert("Lỗi khi viết lại đoạn: " + response.data.message);
                    }
                } catch (error) {
                    console.error("Lỗi khi viết lại đoạn:", error);
                    alert("Lỗi khi viết lại đoạn: " + error.message);
                }
                setLoading(false);
            }
        };
        window.handleRewriteSection = handleRewriteSection;
    }, [selectedText, result, category, language, topic, keyword, length, user]);

    useEffect(() => {
        const savedKeyword = localStorage.getItem("selectedKeyword");
        if (savedKeyword) {
            setKeyword(savedKeyword);
            localStorage.removeItem("selectedKeyword");
        }
    }, []);

    const handleExportPDF = async () => {
        if (!result) {
            alert("Vui lòng tạo nội dung trước khi xuất PDF!");
            return;
        }
        if (!user || !user.email) {
            alert("Bạn chưa đăng nhập! Vui lòng đăng nhập để tiếp tục.");
            navigate("/login/user");
            return;
        }

        try {
            const response = await axios.post(
                ipBE + "api/export-pdf",
                { content: result, user_email: user.email, filename: `${topic}_article.pdf` },
                { responseType: "blob", withCredentials: true }
            );

            const pdfBlob = new Blob([response.data], { type: "application/pdf" });
            saveAs(pdfBlob, `${topic}_article.pdf`);
        } catch (error) {
            console.error("Lỗi khi xuất PDF:", error);
            alert("Lỗi khi xuất PDF: " + error.message);
        }
    };

    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(result)
                .then(() => {
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                })
                .catch((err) => console.error("Lỗi khi sao chép:", err));
        }
    };

    const handleEdit = () => {
        if (result) {
            setIsEditing(true);
            setEditContent(result);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            setResult(editContent);
            setIsEditing(false);
        }
    };

    const handleRewriteAll = async () => {
        if (result && user) {
            setLoading(true);
            try {
                const response = await axios.post(
                    ipBE + "api/rewrite-all",
                    {
                        user_email: user.email,
                        original_content: result,
                        field: category,
                        language,
                        topic,
                        keyword,
                        length,
                    },
                    { withCredentials: true }
                );

                if (response.data.success) {
                    const newContent = response.data.content;
                    setResult(newContent);
                } else {
                    alert("Lỗi khi viết lại toàn bộ: " + response.data.message);
                }
            } catch (error) {
                console.error("Lỗi khi viết lại toàn bộ:", error);
                alert("Lỗi khi viết lại toàn bộ: " + error.message);
            }
            setLoading(false);
        }
    };

    const handleSurveySubmit = async (e) => {
        e.preventDefault();
        if (!user || !user.email) return;

        try {
            const response = await axios.post(
                ipBE + "api/submit-survey",
                {
                    user_email: user.email,
                    is_satisfied: isSatisfied,
                    comment: comment || null,
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                setShowSurvey(false);
                setShowSuccessModal(true);
                setTimeout(() => setShowSuccessModal(false), 2000);
                setSurveySubmitted(true);
            }
        } catch (error) {
            console.error("Lỗi khi gửi khảo sát:", error);
            alert("Lỗi khi gửi khảo sát: " + error.message);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult("");
        setNotification("");
        setCurrentRequest(null);
        setShowSurvey(false);
        setSurveySubmitted(false);

        try {
            if (!user || !user.email) {
                alert("Bạn chưa đăng nhập! Vui lòng đăng nhập để tiếp tục.");
                navigate("/login/user");
                return;
            }

            // Kiểm tra kim cương trước khi gửi request
            if (diamonds < 5) {
                alert("Số kim cương không đủ (cần ít nhất 5 kim cương)!");
                setLoading(false);
                return;
            }

            if (!category || !language || !topic || !length || !keyword) {
                throw new Error("Vui lòng điền đầy đủ thông tin, bao gồm từ khóa chính!");
            }

            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("user_email", user.email);

                const response = await axios.post(
                    "http://localhost:5000/api/upload-analyze",
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                        withCredentials: true,
                    }
                );

                if (response.data.success) {
                    setResult(response.data.content);
                    setCurrentRequest({
                        topic: "Tải lên và phân tích",
                        createdAt: new Date().toISOString(),
                        requestId: response.data.request_id,
                    });
                    // Cập nhật kim cương sau khi xử lý file
                    await fetchDiamonds();
                }
            } else {
                const response = await axios.post(
                    ipBE + "api/generate-content",
                    {
                        field: category,
                        language,
                        topic,
                        keyword,
                        length,
                        user_email: user.email,
                    },
                    {
                        headers: { "Content-Type": "application/json" },
                        withCredentials: true,
                    }
                );

                if (!response.data.success) throw new Error(response.data.message || "Lỗi khi tạo nội dung");

                setCurrentRequest({
                    topic,
                    createdAt: new Date().toISOString(),
                    requestId: response.data.request_id,
                });

                setResult("Đang chờ admin duyệt, vui lòng chờ...");
                setPendingRequest(true);

                try {
                    await axios.post(
                        ipBE + "api/auto-approve-content",
                        { id: response.data.request_id, userEmail: user.email },
                        { withCredentials: true }
                    );
                } catch (approveError) {
                    console.error("Lỗi khi gọi auto-approve-content:", approveError.response ? approveError.response.data : approveError.message);
                }

                setResult("Đang chờ duyệt tự động, vui lòng chờ...");
            }
        } catch (error) {
            console.error("Lỗi khi tạo nội dung:", error);
            setResult("Lỗi khi kết nối đến API! " + error.message);
            setPendingRequest(false);
            setCurrentRequest(null);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 p-8 mt-28 max-w-7xl mx-auto bg-gray-50 shadow-xl rounded-xl">
            <div className="w-full md:w-1/2 p-6 bg-white border border-gray-200 rounded-lg">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Viết Bài Linh Hoạt</h1>
                <p className="text-gray-600 mb-6">Mỗi lần tạo sẽ mất 5 kim cương. Số kim cương hiện tại: {diamonds}</p>
                <form onSubmit={handleGenerate} className="space-y-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Lĩnh vực *</label>
                        <select
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option>Giáo dục</option>
                            <option>Giới thiệu sản phẩm</option>
                            <option>Tạo nội dung</option>
                            <option>Viết Blog</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Ngôn ngữ *</label>
                        <select
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="vi">Tiếng Việt</option>
                            <option value="en">Tiếng Anh</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Chủ đề bài viết *</label>
                        <input
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Nhập chủ đề"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Từ khóa chính *</label>
                        <input
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Nhập từ khóa chính (ví dụ: hạnh phúc gia đình)"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Độ dài (số từ) *</label>
                        <input
                            type="number"
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Nhập số từ (ví dụ: 100)"
                            value={length}
                            onChange={(e) => setLength(Number(e.target.value))}
                            min="50"
                            max="1000"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700">Tải file lên (tùy chọn)</label>
                        <input
                            type="file"
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            accept=".txt,.docx,.pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-red-600 text-white py-3 rounded-md hover:bg-red-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={loading || diamonds < 5}
                    >
                        {loading ? "Đang tạo..." : "Bắt đầu tạo"}
                    </button>
                </form>
            </div>

            <div className="w-full md:w-1/2 p-6 bg-white border border-gray-200 rounded-lg flex flex-col">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Kết quả bài viết</h2>
                <div className="w-full p-4 border border-gray-200 rounded-md bg-gray-50 min-h-[300px] overflow-auto flex-1 relative" style={{ whiteSpace: "pre-wrap" }}>
                    {loading ? "Đang tạo nội dung..." : isEditing ? (
                        <textarea
                            className="w-full h-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyPress={handleKeyPress}
                            autoFocus
                        />
                    ) : (
                        result || "Kết quả sẽ hiển thị tại đây sau khi bạn tạo bài viết."
                    )}
                    {notification && (
                        <div className="mt-2 text-sm text-blue-600">
                            Thông báo: {notification}
                        </div>
                    )}
                    {result && !loading && !isEditing && (
                        <>
                            <button
                                onClick={handleCopy}
                                className={`absolute top-2 right-14 bg-gray-100 text-gray-600 p-1.5 rounded hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center w-8 h-8 ${isCopied ? "opacity-50" : ""}`}
                                title="Copy nội dung"
                                disabled={isCopied}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M7 9V7C7 5.89543 7.89543 5 9 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H17M7 9H5C3.89543 9 3 9.89543 3 11V21C3 22.1046 3.89543 23 5 23H15C16.1046 23 17 22.1046 17 21V19M7 9H15C16.1046 9 17 9.89543 17 11V19"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                            <button
                                onClick={handleEdit}
                                className="absolute top-2 right-7 bg-gray-100 text-gray-600 p-1.5 rounded hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center w-8 h-8"
                                title="Chỉnh sửa nội dung"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M18.4142 6.41422L11.5 13.3284L9.5 15.3284L11.6716 13.1568C11.9116 12.9168 12.2284 12.75 12.5625 12.75C12.8966 12.75 13.2134 12.9168 13.4534 13.1568L20.5 20.2036V18.1716L18.4142 16.0858C18.0391 15.7107 17.5304 15.5 17 15.5C16.4696 15.5 15.9609 15.7107 15.5858 16.0858L13.5 18.1716L11.3284 16L18.2426 9.08579C18.6101 8.71829 18.9029 8.29744 19.1015 7.84141C19.3002 7.38538 19.3992 6.90179 19.3992 6.41422C19.3992 5.92664 19.3002 5.44305 19.1015 4.98702C18.9029 4.531 18.6101 4.1101 18.2426 3.74264C17.8751 3.37518 17.4543 3.08236 16.9982 2.88371C16.5422 2.68506 16.0586 2.58606 15.571 2.58606C15.0834 2.58606 14.5998 2.68506 14.1438 2.88371C13.6878 3.08236 13.2669 3.37518 12.8994 3.74264L6 10.6421"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                            <button
                                onClick={handleRewriteAll}
                                className="absolute top-2 right-2 bg-gray-100 text-gray-600 p-1.5 rounded hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center w-8 h-8"
                                title="Viết lại toàn bộ"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M4 4v5h5M4 19v-5h5m-5 0l6-6m8 7v-5h-5m0 0l6-6m-6 6l6 6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
                {result && !loading && !isEditing && (
                    <button
                        className="mt-4 w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors duration-300"
                        onClick={handleExportPDF}
                    >
                        Xuất PDF
                    </button>
                )}
                {/* Thêm phần Hướng dẫn sử dụng với video */}
                <div className="mt-6">
                    <h3 className="text-xl font-bold text-indigo-700 mb-2 text-center bg-gradient-to-r from-indigo-100 to-white p-2 rounded-lg shadow-md">Hướng dẫn sử dụng</h3>
                    <div className="w-full aspect-video">
                        <iframe
                            src="https://www.youtube.com/embed/iuChyuTytuI?autoplay=1"
                            title="Hướng dẫn sử dụng Viết Bài Linh Hoạt"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
                        ></iframe>
                    </div>
                </div>
            </div>

            {showSurvey && !surveySubmitted && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Khảo sát hài lòng</h3>
                        <p className="mb-4 text-gray-600">Bạn hài lòng với dịch vụ của chúng tôi chứ?</p>
                        <form onSubmit={handleSurveySubmit} className="space-y-4">
                            <div className="mb-4">
                                <label className="inline-flex items-center mr-6">
                                    <input
                                        type="radio"
                                        name="satisfied"
                                        value="true"
                                        onChange={() => setIsSatisfied(true)}
                                        required
                                        className="form-radio text-red-600 focus:ring-red-500"
                                    /> <span className="ml-2 text-gray-700">Có</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="satisfied"
                                        value="false"
                                        onChange={() => setIsSatisfied(false)}
                                        className="form-radio text-red-600 focus:ring-red-500"
                                    /> <span className="ml-2 text-gray-700">Không</span>
                                </label>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Góp ý để chúng tôi phát triển hơn (tùy chọn):</label>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                    rows="3"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Nhập góp ý của bạn..."
                                />
                            </div>
                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors duration-300"
                                    onClick={() => setShowSurvey(false)}
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors duration-300"
                                >
                                    Gửi khảo sát
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-green-50 p-6 rounded-lg shadow-xl text-green-600 text-center w-full max-w-md">
                        <span className="text-4xl">✓</span> Cảm ơn đã tham gia khảo sát!
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlexibleWritingPage;