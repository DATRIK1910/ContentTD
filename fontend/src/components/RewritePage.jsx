import { useState, useEffect } from "react";
import axios from "axios";
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const RewritePage = () => {
    const [inputText, setInputText] = useState("");
    const [rewrittenText, setRewrittenText] = useState("");
    const [language, setLanguage] = useState("vi"); // Mặc định là tiếng Việt
    const [loading, setLoading] = useState(false);
    const [showSamples, setShowSamples] = useState(false);
    const [isCopied, setIsCopied] = useState(false); // Thêm state cho Copy
    const [isEditing, setIsEditing] = useState(false); // Thêm state cho chỉnh sửa
    const [editContent, setEditContent] = useState(""); // Thêm state cho nội dung chỉnh sửa
    const [diamonds, setDiamonds] = useState(0); // Thêm trạng thái kim cương
    const [user] = useState(JSON.parse(localStorage.getItem("user"))); // Kiểm tra user
    const navigate = useNavigate();

    // Danh sách các đoạn văn bản mẫu
    const sampleTexts = [
        "Đoạn văn là một đơn vị nhỏ trong bài viết, bao gồm một nhóm câu cùng phát triển một ý tưởng chính.",
        "Một bài viết hay cần có bố cục rõ ràng, sử dụng từ ngữ chính xác và mạch lạc để truyền tải thông tin một cách hiệu quả.",
        "Sáng tạo nội dung là một kỹ năng quan trọng giúp bạn tạo ra những bài viết hấp dẫn và lôi cuốn người đọc.",
        "SEO đóng vai trò quan trọng trong việc tối ưu hóa nội dung, giúp bài viết của bạn tiếp cận nhiều người hơn.",
    ];

    // Hàm lấy số kim cương từ API
    const fetchDiamonds = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token || !user) {
                setDiamonds(0); // Không lấy kim cương nếu chưa đăng nhập
                return;
            }
            const response = await axios.get("http://localhost:5000/api/user-diamonds", {
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
        // Reset rewrittenText khi inputText thay đổi
        setRewrittenText("");

        // Lấy số kim cương khi component mount
        if (user) {
            fetchDiamonds(); // Chỉ gọi khi có user
        } else {
            setDiamonds(0); // Reset khi chưa đăng nhập
        }
    }, [inputText, user]); // Dependency array phụ thuộc vào inputText và user

    const handleUploadAndRewrite = async () => {
        if (!inputText.trim()) {
            alert("Vui lòng nhập văn bản để viết lại!");
            return;
        }

        setLoading(true);
        setRewrittenText("");

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

            let contentToRewrite = inputText;

            // Gọi API viết lại văn bản với FormData
            const formData = new FormData();
            formData.append("text", contentToRewrite);
            formData.append("language", language);
            formData.append("userEmail", user.email);

            const response = await axios.post(
                "http://localhost:5000/api/rewrite-text",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    withCredentials: true,
                }
            );

            if (response.data.success) {
                const rewrittenContent = response.data.rewrittenText;
                setRewrittenText(rewrittenContent);

                // Cập nhật lại kim cương từ server
                await fetchDiamonds();

                // Tự động lưu vào lịch sử
                await axios.post(
                    "http://localhost:5000/api/history",
                    {
                        user_email: user.email,
                        topic: "Viết lại văn bản",
                        category: "Rewrite",
                        language,
                        content: rewrittenContent,
                    },
                    { withCredentials: true }
                );

                alert("✅ Văn bản đã được viết lại và lưu vào lịch sử!");
            } else {
                throw new Error(response.data.message || "Lỗi khi viết lại văn bản");
            }
        } catch (error) {
            console.error("Lỗi viết lại văn bản:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại! " + error.message);
        }

        setLoading(false);
    };

    // Hàm copy nội dung
    const handleCopy = () => {
        if (rewrittenText) {
            navigator.clipboard.writeText(rewrittenText).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000); // Làm mờ 2 giây
            }).catch(err => {
                console.error("Lỗi khi sao chép:", err);
            });
        }
    };

    // Hàm bắt đầu chỉnh sửa
    const handleEdit = () => {
        if (rewrittenText) {
            setIsEditing(true);
            setEditContent(rewrittenText);
        }
    };

    // Xử lý khi nhấn Enter để hoàn tất chỉnh sửa
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            setRewrittenText(editContent);
            setIsEditing(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="w-full max-w-6xl bg-white shadow-xl rounded-xl p-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Cột bên trái - Nhập văn bản */}
                    <div className="w-full md:w-1/2">
                        <p className="text-gray-600 mb-6">
                            ContentDT viết lại văn bản cho bạn. Nhập hoặc paste đoạn văn, sau đó nhấn nút mũi tên để bắt đầu.
                        </p>
                        <p className="text-gray-600 mb-6">Mỗi lần viết lại sẽ mất 5 kim cương. Số kim cương hiện tại: {diamonds}</p>
                        <textarea
                            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 resize-none"
                            rows="6"
                            placeholder="Nhập văn bản..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        ></textarea>

                        {/* Trường chọn ngôn ngữ */}
                        <div className="mt-6">
                            <label className="block text-lg font-medium text-gray-800 mb-2">Ngôn ngữ *</label>
                            <select
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                <option value="vi">Tiếng Việt</option>
                                <option value="en">Tiếng Anh</option>
                            </select>
                        </div>

                        {/* Nút "Thử câu mẫu" */}
                        <button
                            className="mt-6 w-full py-3 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 transition duration-300"
                            onClick={() => setShowSamples(!showSamples)}
                        >
                            Thử câu mẫu
                        </button>

                        {/* Hiển thị danh sách đoạn văn bản mẫu */}
                        {showSamples && (
                            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-md">
                                {sampleTexts.map((text, index) => (
                                    <p
                                        key={index}
                                        className="p-2 text-gray-700 cursor-pointer hover:bg-gray-200 rounded-md transition duration-200"
                                        onClick={() => {
                                            setInputText(text);
                                            setShowSamples(false);
                                        }}
                                    >
                                        {text}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Nút mũi tên giữa */}
                    <div className="flex items-center justify-center w-full md:w-16 my-8 md:my-0">
                        <button
                            onClick={handleUploadAndRewrite}
                            className="p-5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition duration-300"
                            disabled={loading || !inputText.trim() || diamonds < 5}
                        >
                            <FaArrowRight size={24} />
                        </button>
                    </div>

                    {/* Cột bên phải - Kết quả */}
                    <div className="w-full md:w-1/2">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Kết quả:</h2>
                        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg h-[200px] overflow-auto relative">
                            {rewrittenText ? (
                                isEditing ? (
                                    <textarea
                                        className="w-full h-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 resize-none"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        autoFocus
                                    />
                                ) : (
                                    <p className="text-gray-800 leading-relaxed">{rewrittenText}</p>
                                )
                            ) : (
                                <p className="text-gray-500 italic">Kết quả sẽ hiển thị ở đây...</p>
                            )}
                            {rewrittenText && !isEditing && (
                                <>
                                    <button
                                        onClick={handleCopy}
                                        className={`absolute top-6 right-12 bg-gray-100 text-gray-600 p-1.5 rounded hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center w-8 h-8 ${isCopied ? 'opacity-50' : ''}`}
                                        title="Copy nội dung"
                                        disabled={isCopied}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M7 9V7C7 5.89543 7.89543 5 9 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H17M7 9H5C3.89543 9 3 9.89543 3 11V21C3 22.1046 3.89543 23 5 23H15C16.1046 23 17 22.1046 17 21V19M7 9H15C16.1046 9 17 9.89543 17 11V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleEdit}
                                        className="absolute top-6 right-2 bg-gray-100 text-gray-600 p-1.5 rounded hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center w-8 h-8"
                                        title="Chỉnh sửa nội dung"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M18.4142 6.41422L11.5 13.3284L9.5 15.3284L11.6716 13.1568C11.9116 12.9168 12.2284 12.75 12.5625 12.75C12.8966 12.75 13.2134 12.9168 13.4534 13.1568L20.5 20.2036V18.1716L18.4142 16.0858C18.0391 15.7107 17.5304 15.5 17 15.5C16.4696 15.5 15.9609 15.7107 15.5858 16.0858L13.5 18.1716L11.3284 16L18.2426 9.08579C18.6101 8.71829 18.9029 8.29744 19.1015 7.84141C19.3002 7.38538 19.3992 6.90179 19.3992 6.41422C19.3992 5.92664 19.3002 5.44305 19.1015 4.98702C18.9029 4.531 18.6101 4.1101 18.2426 3.74264C17.8751 3.37518 17.4543 3.08236 16.9982 2.88371C16.5422 2.68506 16.0586 2.58606 15.571 2.58606C15.0834 2.58606 14.5998 2.68506 14.1438 2.88371C13.6878 3.08236 13.2669 3.37518 12.8994 3.74264L6 10.6421" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                        {/* Thêm phần Hướng dẫn sử dụng với video */}
                        <div className="mt-6 w-full">
                            <h3 className="text-xl font-bold text-indigo-700 mb-2 text-center bg-gradient-to-r from-indigo-100 to-white p-2 rounded-lg shadow-md">Hướng dẫn sử dụng</h3>
                            <div className="w-full aspect-video">
                                <iframe
                                    src="https://www.youtube.com/embed/4Nm9UedUxK4?autoplay=1"
                                    title="Hướng dẫn sử dụng Viết lại văn bản"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RewritePage;