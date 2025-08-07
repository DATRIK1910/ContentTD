import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid"; // Thêm MagnifyingGlassIcon
import { toast } from 'react-toastify'; // Import toast
import { ipBE } from "../data/consts";

const History = () => {
    const [history, setHistory] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [expandedItems, setExpandedItems] = useState({});
    const [searchTerm, setSearchTerm] = useState(""); // Thêm state cho từ khóa tìm kiếm
    const [filter, setFilter] = useState("all"); // State cho bộ lọc thời gian
    const [startDate, setStartDate] = useState(""); // State cho ngày bắt đầu (tùy chỉnh)
    const [endDate, setEndDate] = useState(""); // State cho ngày kết thúc (tùy chỉnh)
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

                const historyResponse = await axios.get(ipBE + "api/user-history", {
                    params: { user_email: user.email }
                });
                if (!historyResponse.data.success) throw new Error(historyResponse.data.message || "Lỗi khi lấy lịch sử");
                setHistory(historyResponse.data.history);

                const keywordResponse = await axios.get(ipBE + "api/keyword-history", {
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

    // Lọc lịch sử dựa trên từ khóa tìm kiếm và thời gian
    const filteredHistory = history.filter(item => {
        const itemDate = new Date(item.created_at);
        const now = new Date();
        let isDateInRange = true;

        switch (filter) {
            case "today":
                isDateInRange = itemDate.toDateString() === now.toDateString();
                break;
            case "week":
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                isDateInRange = itemDate >= startOfWeek && itemDate <= now;
                break;
            case "month":
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                isDateInRange = itemDate >= startOfMonth && itemDate <= now;
                break;
            case "custom":
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                if (start && end) {
                    isDateInRange = itemDate >= start && itemDate <= end;
                } else if (start) {
                    isDateInRange = itemDate >= start;
                } else if (end) {
                    isDateInRange = itemDate <= end;
                }
                break;
            default:
                isDateInRange = true;
        }

        return (
            isDateInRange &&
            (item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.content && item.content.toLowerCase().includes(searchTerm.toLowerCase())))
        );
    });

    // Xử lý áp dụng bộ lọc tùy chỉnh
    const applyCustomFilter = () => {
        if (filter === "custom" && (!startDate || !endDate)) {
            toast.error("Vui lòng chọn cả ngày bắt đầu và ngày kết thúc!", { position: "top-center" });
            return;
        }
        // Không cần làm gì thêm vì filter đã được áp dụng ngay lập tức
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6" style={{ paddingTop: '100px' }}> {/* Thêm padding-top để tránh bị che */}
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Lịch sử nội dung và từ khóa</h1>

                {/* Thanh tìm kiếm với icon */}
                <div className="mb-6 relative">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo chủ đề, lĩnh vực hoặc nội dung..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-4 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <MagnifyingGlassIcon
                        className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                        onClick={() => { }} // Có thể thêm chức năng bổ sung nếu cần
                    />
                </div>

                {/* Bộ lọc thời gian (góc phải) */}
                <div className="mb-6 flex justify-end">
                    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300 w-72">
                        <h2 className="text-md font-semibold text-gray-700 mb-2">Bộ lọc thời gian</h2>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full p-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        >
                            <option value="all">Tất cả</option>
                            <option value="today">Hôm nay</option>
                            <option value="week">Tuần này</option>
                            <option value="month">Tháng này</option>
                            <option value="custom">Tùy chỉnh</option>
                        </select>
                        {filter === "custom" && (
                            <div className="flex flex-col gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                />
                                <button
                                    onClick={applyCustomFilter}
                                    className="mt-2 w-full bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors duration-300 text-sm"
                                >
                                    Áp dụng
                                </button>
                            </div>
                        )}
                    </div>
                </div>

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

                {filteredHistory.length === 0 && !loading && !error && (
                    <div className="text-center text-gray-600 bg-white p-6 rounded-lg shadow">
                        Không tìm thấy nội dung nào trong lịch sử.
                    </div>
                )}

                {filteredHistory.length > 0 && (
                    <div className="space-y-4">
                        {filteredHistory.map((item) => (
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