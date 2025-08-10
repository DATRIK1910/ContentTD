import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaCopy } from "react-icons/fa"; // Icon cho nút copy

const KeywordSuggestionStandalone = () => {
    const [topic, setTopic] = useState("");
    const [keywords, setKeywords] = useState([]);
    const [language, setLanguage] = useState("vi"); // Mặc định tiếng Việt
    const [loading, setLoading] = useState(false);
    const [diamonds, setDiamonds] = useState(0); // Thêm trạng thái kim cương
    const [user] = useState(JSON.parse(localStorage.getItem("user"))); // Kiểm tra user
    const navigate = useNavigate();

    useEffect(() => {
        // Reset keywords khi topic thay đổi
        setKeywords([]);

        // Lấy số kim cương khi component mount
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

        if (user) {
            fetchDiamonds(); // Chỉ gọi khi có user
        } else {
            setDiamonds(0); // Reset khi chưa đăng nhập
        }
    }, [user, topic]); // Dependency array phụ thuộc vào user và topic

    const handleSuggestKeywords = async () => {
        if (!topic) {
            alert("Vui lòng điền chủ đề!");
            return;
        }

        setLoading(true);

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

            const formData = new FormData();
            formData.append("topic", topic);
            formData.append("language", language);
            formData.append("userEmail", user.email);

            const response = await axios.post(
                "http://localhost:5000/api/suggest-keywords",
                formData,
                { headers: { "Content-Type": "multipart/form-data" }, withCredentials: true }
            );

            if (response.data.success) {
                setKeywords(response.data.keywords);
                // Cập nhật lại kim cương từ server
                const token = localStorage.getItem("token");
                const diamondResponse = await axios.get("http://localhost:5000/api/user-diamonds", {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDiamonds(diamondResponse.data.diamonds);
            } else {
                alert("Không thể gợi ý từ khóa: " + response.data.message);
            }
        } catch (error) {
            console.error("❌ Lỗi khi gợi ý từ khóa:", error);
            alert("Lỗi khi gợi ý từ khóa: " + error.message);
        }

        setLoading(false);
    };

    const handleCopyKeyword = (keyword) => {
        navigator.clipboard.writeText(keyword)
            .then(() => alert(`Đã sao chép "${keyword}" vào clipboard!`))
            .catch((err) => alert("Lỗi khi sao chép: " + err.message));
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="w-full max-w-5xl bg-white shadow-2xl rounded-2xl p-8 border border-gray-200 flex flex-col md:flex-row gap-8">
                {/* Phần Gợi ý Từ khóa - Góc trái */}
                <div className="w-full md:w-2/3">
                    <h1 className="text-4xl font-bold mb-6 text-gray-900 text-left">Gợi ý Từ khóa</h1>
                    <p className="text-gray-600 mb-6 text-left">Mỗi lần gợi ý sẽ mất 5 kim cương. Số kim cương hiện tại: <span className="font-semibold text-indigo-600">{diamonds}</span></p>
                    <div className="mb-6">
                        <label className="block text-lg font-medium text-gray-800 mb-2">Chủ đề *</label>
                        <input
                            type="text"
                            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                            placeholder="Nhập chủ đề (ví dụ: công nghệ, giáo dục)"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-lg font-medium text-gray-800 mb-2">Ngôn ngữ *</label>
                        <select
                            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="vi">Tiếng Việt</option>
                            <option value="en">Tiếng Anh</option>
                        </select>
                    </div>
                    <button
                        type="button"
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        onClick={handleSuggestKeywords}
                        disabled={loading || !topic || diamonds < 5}
                    >
                        {loading ? "Đang gợi ý..." : "Gợi ý từ khóa"}
                    </button>
                    {keywords.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Từ khóa gợi ý:</h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {keywords.map((k, index) => (
                                    <li key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg shadow-md hover:bg-gray-100 transition duration-200">
                                        <span className="text-gray-800 text-lg">{k}</span>
                                        <button
                                            onClick={() => handleCopyKeyword(k)}
                                            className="ml-4 text-indigo-600 hover:text-indigo-800 transition duration-200"
                                            title="Sao chép"
                                        >
                                            <FaCopy />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                {/* Phần Hướng dẫn sử dụng - Góc phải */}
                <div className="w-full md:w-1/3">
                    <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center bg-gradient-to-r from-blue-100 to-white p-3 rounded-lg shadow-md">Hướng dẫn sử dụng</h2>
                    <div className="w-full aspect-video">
                        <iframe
                            src="https://www.youtube.com/embed/oXXqOgMNYEo?autoplay=1"
                            title="Hướng dẫn sử dụng Gợi ý Từ khóa"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KeywordSuggestionStandalone;