import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { toast } from 'react-toastify'; // Import toast

const History = () => {
    const [history, setHistory] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [expandedItems, setExpandedItems] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            setError("");

            try {
                const user = JSON.parse(localStorage.getItem("user"));
                if (!user || !user.email) {
                    toast.error("Bạn chưa đăng nhập! Vui lòng đăng nhập để xem lịch sử.", { position: "top-center" });
                    navigate("/login/user");
                    return;
                }

                const historyResponse = await axios.get("http://localhost:5000/api/user-history", {
                    params: { user_email: user.email }
                });
                if (!historyResponse.data.success) throw new Error(historyResponse.data.message || "Lỗi khi lấy lịch sử");
                setHistory(historyResponse.data.history);

                const keywordResponse = await axios.get("http://localhost:5000/api/keyword-history", {
                    params: { user_email: user.email }
                });
                if (!keywordResponse.data.success) throw new Error(keywordResponse.data.message || "Lỗi khi lấy lịch sử từ khóa");
                setKeywords(keywordResponse.data.keywords);
            } catch (err) {
                console.error("❌ Lỗi khi lấy lịch sử:", err);
                setError("Không thể tải lịch sử! " + err.message);
            }

            setLoading(false);
        };

        fetchHistory();
    }, [navigate]);

    const toggleDetails = (id) => {
        setExpandedItems((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleKeywordClick = (keyword) => {
        // Hiển thị toast với nút "OK" để xác nhận
        toast.info(
            <div>
                <p>Bạn muốn tái sử dụng từ khóa: <strong>{keyword}</strong>?</p>
                <button
                    onClick={() => {
                        // Lưu từ khóa vào localStorage khi nhấp OK
                        localStorage.setItem("selectedKeyword", keyword);
                        toast.dismiss(); // Đóng toast
                        toast.success("Từ khóa đã được lưu để tái sử dụng!", { position: "top-center" });
                    }}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    OK
                </button>
            </div>,
            {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false,
            }
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Lịch sử nội dung và từ khóa</h1>

                {loading && (
                    <div className="text-center text-gray-600">
                        <p>Đang tải lịch sử...</p>
                    </div>
                )}
                {error && (
                    <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {history.length === 0 && !loading && !error && (
                    <div className="text-center text-gray-600 bg-white p-6 rounded-lg shadow">
                        Bạn chưa có nội dung nào trong lịch sử.
                    </div>
                )}

                {history.length > 0 && (
                    <div className="space-y-4">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                            >
                                <div
                                    className="flex justify-between items-center p-4 cursor-pointer"
                                    onClick={() => toggleDetails(item.id)}
                                >
                                    <div className="flex-1">
                                        <h2 className="text-lg font-semibold text-gray-800">{item.topic}</h2>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Lĩnh vực:</span> {item.category} |{" "}
                                            <span className="font-medium">Thời gian:</span>{" "}
                                            {new Date(item.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <button className="text-red-600 hover:text-red-800 flex items-center gap-1">
                                        {expandedItems[item.id] ? (
                                            <>
                                                <span>Thu gọn</span>
                                                <ChevronUpIcon className="h-5 w-5" />
                                            </>
                                        ) : (
                                            <>
                                                <span>Xem chi tiết</span>
                                                <ChevronDownIcon className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                {expandedItems[item.id] && (
                                    <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                                        <p className="text-sm text-gray-600 mb-2">
                                            <span className="font-medium">Ngôn ngữ:</span>{" "}
                                            {item.language === "vi" ? "Tiếng Việt" : "Tiếng Anh"}
                                        </p>
                                        <div className="mt-2 p-4 border rounded-lg bg-white shadow-sm">
                                            <p className="text-gray-800 whitespace-pre-wrap">{item.content}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {keywords.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg shadow-md p-4">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Lịch sử từ khóa</h2>
                        <div className="flex flex-wrap gap-2">
                            {keywords.map((keyword) => (
                                <span
                                    key={keyword.id}
                                    className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded hover:bg-blue-200 cursor-pointer"
                                    onClick={() => handleKeywordClick(keyword.keyword)}
                                >
                                    {keyword.keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;