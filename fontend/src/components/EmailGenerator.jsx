import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ipBE } from "../data/consts";

const EmailGenerator = () => {
    const [topic, setTopic] = useState("");
    const [recipient, setRecipient] = useState("");
    const [purpose, setPurpose] = useState("");
    const [tone, setTone] = useState("formal");
    const [language, setLanguage] = useState("vi");
    const [length, setLength] = useState(100);
    const [contactInfo, setContactInfo] = useState("");
    const [time, setTime] = useState("");
    const [location, setLocation] = useState("");
    const [loading, setLoading] = useState(false);
    const [requestId, setRequestId] = useState(null);
    const [generatedEmail, setGeneratedEmail] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [isProcessing, setIsProcessing] = useState(false); // Trạng thái chờ xử lý
    const [isDone, setIsDone] = useState(false); // Trạng thái hoàn tất
    const [diamonds, setDiamonds] = useState(0); // Thêm trạng thái kim cương
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user"))); // Kiểm tra user
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
        if (requestId && !generatedEmail) {
            setIsProcessing(true); // Chuyển sang trạng thái chờ xử lý
            const checkStatus = async () => {
                try {
                    const response = await axios.get(ipBE + `api/check-email-status?request_id=${requestId}`, {
                        withCredentials: true,
                    });
                    if (response.data.success && response.data.content) {
                        setGeneratedEmail(response.data.content);
                        setIsProcessing(false); // Tắt trạng thái chờ khi có email
                        setIsDone(true); // Bật trạng thái hoàn tất
                        setTimeout(() => setIsDone(false), 2000); // Ẩn thông báo sau 2 giây
                    }
                } catch (error) {
                    console.error("Lỗi kiểm tra trạng thái:", error);
                }
            };
            interval = setInterval(checkStatus, 5000);
        }

        // Lấy số kim cương khi component mount
        if (user) {
            fetchDiamonds(); // Chỉ gọi khi có user
        } else {
            setDiamonds(0); // Reset khi chưa đăng nhập
        }

        return () => clearInterval(interval);
    }, [requestId, generatedEmail, user]); // Dependency array phụ thuộc vào user

    const handleGenerateEmail = async (e) => {
        e.preventDefault();
        if (!topic || !recipient || !purpose || !length) {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
            return;
        }

        setLoading(true);

        try {
            if (!user || !user.email) {
                alert("Bạn chưa đăng nhập!");
                navigate("/login/user");
                return;
            }

            // Kiểm tra kim cương trước khi tạo email
            if (diamonds < 5) {
                alert("Số kim cương không đủ (cần ít nhất 5 kim cương)!");
                setLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append("topic", topic);
            formData.append("recipient", recipient);
            formData.append("purpose", purpose);
            formData.append("tone", tone);
            formData.append("language", language);
            formData.append("length", length);
            formData.append("user_email", user.email);
            formData.append("contact_info", contactInfo);
            formData.append("time", time);
            formData.append("location", location);

            const response = await axios.post(ipBE + "api/generate-email", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,
            });

            if (response.data.success) {
                setRequestId(response.data.request_id);
                if (response.data.content) {
                    setGeneratedEmail(response.data.content);
                    setLoading(false); // Tắt loading nếu có content ngay lập tức
                }
                // Cập nhật lại kim cương từ server
                await fetchDiamonds();
            } else {
                alert("Lỗi tạo email: " + response.data.message);
                setLoading(false);
            }
        } catch (error) {
            console.error("Lỗi khi tạo email:", error);
            alert("Lỗi khi tạo email: " + error.message);
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (generatedEmail) {
            navigator.clipboard.writeText(generatedEmail).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            }).catch(err => console.error("Lỗi khi sao chép:", err));
        }
    };

    const handleEdit = () => {
        if (generatedEmail) {
            setIsEditing(true);
            setEditContent(generatedEmail);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            setGeneratedEmail(editContent);
            setIsEditing(false);
        }
    };

    // Hiệu ứng loading dots
    const LoadingDots = () => {
        return (
            <div className="flex space-x-1 mt-2">
                <span className="animate-pulse">.</span>
                <span className="animate-pulse animation-delay-200">.</span>
                <span className="animate-pulse animation-delay-400">.</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6">
            <div className="w-full max-w-6xl bg-white shadow-xl rounded-xl p-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Cột bên trái - Tạo email */}
                    <div className="w-full md:w-1/2">
                        <h1 className="text-3xl font-semibold mb-6 text-gray-900 text-center">Tạo Email</h1>
                        <p className="text-gray-600 mb-6 text-center">Mỗi lần tạo email sẽ mất 5 kim cương. Số kim cương hiện tại: {diamonds}</p>
                        <form onSubmit={handleGenerateEmail} className="space-y-6">
                            <div>
                                <label className="block text-lg font-medium text-gray-800 mb-2">Chủ đề *</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 transition duration-200"
                                    placeholder="Nhập chủ đề email (ví dụ: lời mời họp)"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-medium text-gray-800 mb-2">Người nhận *</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 transition duration-200"
                                    placeholder="Nhập tên hoặc email người nhận (ví dụ: Anh Nguyễn)"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-medium text-gray-800 mb-2">Mục đích *</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 transition duration-200"
                                    placeholder="Nhập mục đích (ví dụ: mời họp, cảm ơn)"
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-medium text-gray-800 mb-2">Tông giọng</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 appearance-none bg-white"
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                >
                                    <option value="formal">Chính thức</option>
                                    <option value="casual">Thân mật</option>
                                    <option value="professional">Chuyên nghiệp</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-lg font-medium text-gray-800 mb-2">Ngôn ngữ *</label>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 appearance-none bg-white"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <option value="vi">Tiếng Việt</option>
                                    <option value="en">Tiếng Anh</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-lg font-medium text-gray-800 mb-2">Độ dài (từ) *</label>
                                <input
                                    type="number"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 transition duration-200"
                                    min="50"
                                    max="500"
                                    value={length}
                                    onChange={(e) => setLength(Math.max(50, Math.min(500, e.target.value)))}
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-medium text-gray-800 mb-2">Thông tin liên lạc</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 transition duration-200"
                                    placeholder="Nhập email hoặc số điện thoại (tùy chọn)"
                                    value={contactInfo}
                                    onChange={(e) => setContactInfo(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-medium text-gray-800 mb-2">Thời gian</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 transition duration-200"
                                    placeholder="Nhập thời gian (ví dụ: 10:00 AM, 23/07/2025)"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-medium text-gray-800 mb-2">Địa điểm</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 transition duration-200"
                                    placeholder="Nhập địa điểm (ví dụ: Phòng họp B)"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                disabled={loading || !topic || !recipient || !purpose || !length || diamonds < 5}
                            >
                                {loading ? "Đang tạo..." : "Tạo email"}
                            </button>
                        </form>
                    </div>

                    {/* Cột bên phải - Hướng dẫn sử dụng và kết quả email */}
                    <div className="w-full md:w-1/2">
                        <div className="mt-6 w-full max-w-2xl">
                            <h3 className="text-lg font-semibold text-indigo-700 mb-2 text-center bg-gradient-to-r from-indigo-100 to-white p-1 rounded-md shadow-sm">Hướng dẫn sử dụng</h3>
                            <div className="w-full aspect-video">
                                <iframe
                                    src="https://www.youtube.com/embed/JGKr1c9lVxg?autoplay=1"
                                    title="Hướng dẫn sử dụng Tạo Email"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full rounded-md shadow-md transform hover:scale-102 transition-transform duration-300"
                                ></iframe>
                            </div>
                        </div>
                        {generatedEmail && (
                            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg relative">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Email đã tạo:</h3>
                                {isEditing ? (
                                    <textarea
                                        className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 transition duration-200 resize-none"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        autoFocus
                                    />
                                ) : (
                                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{generatedEmail}</p>
                                )}
                                {!isEditing && (
                                    <>
                                        <button
                                            onClick={handleCopy}
                                            className={`absolute top-4 right-12 bg-gray-100 text-gray-600 p-1.5 rounded hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center w-8 h-8 ${isCopied ? 'opacity-50' : ''}`}
                                            title="Copy email"
                                            disabled={isCopied}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M7 9V7C7 5.89543 7.89543 5 9 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H17M7 9H5C3.89543 9 3 9.89543 3 11V21C3 22.1046 3.89543 23 5 23H15C16.1046 23 17 22.1046 17 21V19M7 9H15C16.1046 9 17 9.89543 17 11V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleEdit}
                                            className="absolute top-4 right-2 bg-gray-100 text-gray-600 p-1.5 rounded hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center w-8 h-8"
                                            title="Chỉnh sửa email"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M18.4142 6.41422L11.5 13.3284L9.5 15.3284L11.6716 13.1568C11.9116 12.9168 12.2284 12.75 12.5625 12.75C12.8966 12.75 13.2134 12.9168 13.4534 13.1568L20.5 20.2036V18.1716L18.4142 16.0858C18.0391 15.7107 17.5304 15.5 17 15.5C16.4696 15.5 15.9609 15.7107 15.5858 16.0858L13.5 18.1716L11.3284 16L18.2426 9.08579C18.6101 8.71829 18.9029 8.29744 19.1015 7.84141C19.3002 7.38538 19.3992 6.90179 19.3992 6.41422C19.3992 5.92664 19.3002 5.44305 19.1015 4.98702C18.9029 4.531 18.6101 4.1101 18.2426 3.74264C17.8751 3.37518 17.4543 3.08236 16.9982 2.88371C16.5422 2.68506 16.0586 2.58606 15.571 2.58606C15.0834 2.58606 14.5998 2.68506 14.1438 2.88371C13.6878 3.08236 13.2669 3.37518 12.8994 3.74264L6 10.6421" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                        {requestId && !generatedEmail && isProcessing && (
                            <p className="mt-4 text-center text-gray-600">Yêu cầu của bạn đang được xử lý. Request ID: {requestId}</p>
                        )}
                        {loading && (
                            <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                                    <p className="text-lg text-gray-900 font-medium">Email của bạn đang được xử lý</p>
                                    <LoadingDots />
                                </div>
                            </div>
                        )}
                        {isDone && (
                            <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                                    <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <p className="text-lg text-gray-900 font-medium mt-2">Đã tạo xong</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Hiệu ứng loading dots
const LoadingDots = () => {
    return (
        <div className="flex space-x-1 mt-2">
            <span className="animate-pulse">.</span>
            <span className="animate-pulse animation-delay-200">.</span>
            <span className="animate-pulse animation-delay-400">.</span>
        </div>
    );
};

export default EmailGenerator;