import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faExchangeAlt, faCut, faFont, faEnvelope, faComment, faShieldAlt } from "@fortawesome/free-solid-svg-icons";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import ContentCutIcon from '@mui/icons-material/ContentCut';
import SummarizeIcon from '@mui/icons-material/Summarize';
import RedoIcon from '@mui/icons-material/Redo';

const illustrationUrl = "https://tse4.mm.bing.net/th/id/OIP.7gN5TegRceeQEpAQXX5jrgHaEK?rs=1&pid=ImgDetMain&o=7&rm=3";
const illustration2Url = "https://keydifferences.com/wp-content/uploads/2023/07/content-writing.jpg";


const Home = () => {
    const navigate = useNavigate();
    const [topSurveys, setTopSurveys] = useState([]);
    const [latestNews, setLatestNews] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [userId] = useState("user1"); // Thay bằng userId thực tế từ localStorage
    const ws = React.useRef(null);

    useEffect(() => {
        const fetchTopSurveys = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/top-surveys", {
                    withCredentials: true,
                });
                if (response.data.success) {
                    setTopSurveys(response.data.surveys.slice(0, 3));
                }
            } catch (error) {
                console.error("Lỗi khi lấy khảo sát hàng đầu:", error);
            }
        };

        const fetchLatestNews = async () => {
            const newsData = [
                {
                    id: 1,
                    title: "Top 18 công cụ AI viết content: Dành riêng cho dân viết lách!",
                    image: "https://ngocdenroi.com/wp-content/uploads/2023/04/cong-cu-ai-viet-content.png.webp",
                    date: "25/07/2025",
                },
                {
                    id: 2,
                    title: "Viết Blog với AI: từ Lý thuyết đến Thực hành",
                    image: "https://th.bing.com/th/id/OIP.1idVOjTL5DYn64TRx_O53wHaEK?rs=1&pid=ImgDetMain",
                    date: "24/07/2025",
                },
                {
                    id: 3,
                    title: "Blog là gì? Cách viết blog cá nhân đơn giản cho người mới",
                    image: "https://cdn.prod.website-files.com/65362103866e2bc3688c3ce3/68107414a2335a29501b66e6_AD_4nXdW1VZGQ0hySVsrR_2I2kxIh_bDUpumLKeZT7JFfKoq7cNpPZho1v5mDfFbTpLSMtybWHPEr8UhDKzZH7qj9OCkNbah4GxR1J7M765clhfOPSOPgKEU1oLtFdUOw7_8OcufIMT_lEUhKFJ3gC4mBhMUcj_P.jpeg",
                    date: "23/07/2025",
                },
            ];
            setLatestNews(newsData);
        };

        const fetchTopUsers = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/top-users", {
                    withCredentials: true,
                });
                if (response.data.success) {
                    setTopUsers(response.data.users.slice(0, 3)); // Lấy 3 người dùng hàng đầu
                }
            } catch (error) {
                console.error("Lỗi khi lấy top người dùng:", error);
            }
        };

        // Kết nối WebSocket với header userId
        ws.current = new W3CWebSocket("ws://localhost:5000", null, { headers: { "x-user-id": userId } });

        ws.current.onopen = () => {
            console.log("WebSocket connected for user:", userId);
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages((prev) => [...prev, data]);
            console.log("Received message:", data);
        };

        ws.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.current.onclose = () => {
            console.log("WebSocket disconnected");
        };

        fetchTopSurveys();
        fetchLatestNews();
        fetchTopUsers();

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [userId]);

    const sendMessage = () => {
        if (!ws.current) {
            console.error("WebSocket not initialized");
            return;
        }

        if (ws.current.readyState !== 1) {
            console.error("WebSocket not open, readyState:", ws.current.readyState);
            return;
        }

        if (!message.trim()) {
            console.error("Message is empty");
            return;
        }

        const data = {
            senderId: userId,
            receiverId: "admin",
            content: message,
        };
        console.log("Sending message:", data);
        ws.current.send(JSON.stringify(data));
        setMessages((prev) => [...prev, data]); // Cập nhật tin nhắn ngay lập tức
        setMessage(""); // Xóa ô input sau khi gửi
    };

    // Hàm xác định thứ hạng và icon dựa trên tổng tiền
    const getRankInfo = (totalAmount) => {
        if (totalAmount >= 510000) return { rank: "Vàng", iconColor: "text-yellow-500" };
        if (totalAmount >= 310000) return { rank: "Bạc", iconColor: "text-gray-400" };
        if (totalAmount >= 100000) return { rank: "Đồng", iconColor: "text-yellow-800" };
        return { rank: "Vô hạng", iconColor: "text-gray-500" };
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white font-sans pt-24">
            {/* Header - Hero Section */}
            <header className="bg-gradient-to-r from-blue-700 to-purple-300 text-white py-24 text-center relative overflow-hidden rounded-b-3xl shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noisy.png')] opacity-5"></div>
                <div className="relative z-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in">
                        Chào mừng đến với ContentDT
                    </h1>
                    <p className="text-lg md:text-xl mb-8 text-gray-100">
                        Công cụ AI viết nội dung thông minh và hiệu quả
                    </p>
                    <button
                        className="bg-white text-blue-700 font-bold py-3 px-10 rounded-lg text-lg shadow-lg hover:bg-gray-200 transition-all duration-300"
                        onClick={() => navigate("/login/user")}
                    >
                        Bắt đầu miễn phí
                    </button>
                </div>
            </header>

            {/* Section 1: Hãy để bộ não của bạn được nghỉ ngơi (hình phải) */}
            <section className="container mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="md:order-2">
                        <img
                            src={illustrationUrl}
                            alt="Content creation"
                            className="w-full max-w-md mx-auto rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
                        />
                    </div>
                    <div className="md:order-1">
                        <h2 className="text-4xl font-bold text-gray-800 mb-4">
                            Hãy để bộ não của bạn nghỉ ngơi
                        </h2>
                        <div className="w-16 h-1 bg-blue-700 mb-6"></div>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            ContentDT tự động viết lại văn bản tiếng Việt, biến nội dung cũ thành mới chỉ với một cú nhấp chuột. Không cần thuê chuyên gia hay mất thời gian – trải nghiệm miễn phí ngay!
                            <br /><br />
                            Viết từ đầu lên đến 10,000 từ, không giới hạn lượt sử dụng – nhanh, đơn giản, hiệu quả!
                        </p>
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-6 py-16 bg-gray-50 rounded-xl shadow-inner text-center">
                <h2 className="text-4xl font-bold text-gray-800 mb-8 text-left pl-6">
                    Chuyển đổi nội dung của bạn bằng các công cụ
                    dựa trên AI mạnh mẽ
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
                        <span className="text-5xl text-black-500 block mb-4">
                            <ContentCutIcon style={{ fontSize: '48px' }} />
                        </span>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                            Mở khóa tiềm năng của AI để tạo nội dung dễ dàng
                        </h3>
                        <p className="text-gray-600">
                            Làm theo các bước đơn giản sau để khai thác sức mạnh của AI cho nhu cầu nội dung của bạn.
                        </p>
                        <div className="flex justify-center mt-4">
                            <a href="/viet-bai-linh-hoat" className="text-black-500 hover:text-blue-600 transition-all duration-300 flex items-center">
                                Khám phá →
                            </a>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
                        <span className="text-5xl text-black-500 block mb-4">
                            <SummarizeIcon style={{ fontSize: '48px' }} />
                        </span>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                            Tóm tắt đoạn văn bản dài chỉ trong vài giây với trình tóm tắt của chúng tôi
                        </h3>
                        <p className="text-gray-600">
                            Nhận tóm tắt ngắn gọn nắm bắt được nội dung của bạn
                        </p>
                        <div className="flex justify-center mt-4">
                            <a href="/tomtatvanban" className="text-black-500 hover:text-blue-600 transition-all duration-300 flex items-center">
                                Khám phá →
                            </a>
                        </div>
                    </div>


                    <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
                        <span className="text-5xl text-black-500 block mb-4">
                            <RedoIcon style={{ fontSize: '48px' }} />
                        </span>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                            Tối ưu hóa chiến lược nội dung của bạn với Công cụ gợi ý từ khóa trực quan của chúng tôi
                        </h3>
                        <p className="text-gray-600">
                            Khám phá các từ khóa có liên quan đến chủ đề giúp nâng cao khả năng hiển thị của bạn.
                        </p>
                        <div className="flex justify-center mt-4">
                            <a href="/suggest-keywords" className="text-black-500 hover:text-blue-600 transition-all duration-300 flex items-center">
                                Khám phá →
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section: Các dịch vụ chúng tôi cung cấp */}
            <section className="container mx-auto px-6 py-16 bg-gray-50 rounded-xl shadow-inner text-center">
                <h2 className="text-4xl font-bold text-gray-800 mb-8">
                    Ở đây chúng tôi cung cấp các dịch vụ
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-700 to-purple-300 mx-auto mb-10"></div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-5xl mx-auto">
                    <a
                        href="/content-page"
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center text-black-700 hover:text-blue-500"
                    >
                        <FontAwesomeIcon icon={faBook} size="2x" className="mb-2" />
                        <span className="text-lg font-semibold">Tạo nội dung</span>
                    </a>
                    <a
                        href="/rewrite-text"
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center text-black-700 hover:text-blue-500"
                    >
                        <FontAwesomeIcon icon={faExchangeAlt} size="2x" className="mb-2" />
                        <span className="text-lg font-semibold">Viết lại văn bản</span>
                    </a>
                    <a
                        href="/tomtatvanban"
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center text-black-700 hover:text-blue-500"
                    >
                        <FontAwesomeIcon icon={faCut} size="2x" className="mb-2" />
                        <span className="text-lg font-semibold">Tóm tắt văn bản</span>
                    </a>
                    <a
                        href="/suggest-keywords"
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center text-black-700 hover:text-blue-500"
                    >
                        <FontAwesomeIcon icon={faFont} size="2x" className="mb-2" />
                        <span className="text-lg font-semibold">Gợi ý từ khóa</span>
                    </a>
                    <a
                        href="/email-generator"
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center text-black-700 hover:text-blue-500"
                    >
                        <FontAwesomeIcon icon={faEnvelope} size="2x" className="mb-2" />
                        <span className="text-lg font-semibold">Viết Email</span>
                    </a>
                </div>
            </section>



            {/* Section 2: Điều gì làm nên sự khác biệt (hình trái) */}
            <section className="container mx-auto px-6 py-16 bg-gray-50 rounded-xl shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <img
                            src={illustration2Url}
                            alt="ContentDT difference"
                            className="w-full max-w-md mx-auto rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
                        />
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-gray-800 mb-4">
                            Điều gì làm nên sự khác biệt?
                        </h2>
                        <div className="w-16 h-1 bg-blue-700 mb-6"></div>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            ContentDT sử dụng AI thông minh để nâng cấp nội dung, chọn từ khóa, ngắt câu hoàn hảo như biên tập viên chuyên nghiệp. Dù khuếch đại hay tái tạo, mọi thứ chỉ trong tích tắc!
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 4: Video Demo */}
            <section className="container mx-auto px-6 py-16 bg-gray-50 rounded-xl shadow-inner text-center">
                <h2 className="text-4xl font-bold text-gray-800 mb-6">
                    Xem cách ContentDT hoạt động
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-700 to-purple-300 mx-auto mb-8"></div>
                <div className="max-w-4xl mx-auto">
                    <iframe
                        width="100%"
                        height="400"
                        src="https://www.youtube.com/embed/eQTKtbELsM0"
                        title="ContentDT Demo"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-xl shadow-md"
                    ></iframe>
                    <p className="mt-4 text-gray-600 text-lg">
                        Khám phá cách ContentDT tiết kiệm thời gian và tạo nội dung chất lượng!
                    </p>
                </div>
            </section>

            {/* Section: Gói giá dịch vụ */}
            <section className="container mx-auto px-6 py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-2xl">
                <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
                    Chọn gói dịch vụ của bạn
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-700 to-purple-300 mx-auto mb-12"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Gói 1 */}
                    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-blue-500">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Gói Cơ Bản</h3>
                        <p className="text-3xl font-bold text-blue-600 mb-4 text-center">100.000 VND</p>
                        <p className="text-gray-600 mb-6 text-center">Tương đương 20 lần sử dụng</p>
                        <ul className="text-gray-700 mb-6 space-y-2">
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Tạo nội dung</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Viết lại văn bản</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Tóm tắt văn bản</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Gợi ý từ khóa</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Viết Email</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Hỗ trợ cơ bản</li>
                        </ul>
                        <button
                            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
                            onClick={() => navigate("/buy-diamonds")}
                        >
                            Tìm hiểu thêm
                        </button>
                    </div>

                    {/* Gói 2 */}
                    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-purple-500">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Gói Tiêu Chuẩn</h3>
                        <p className="text-3xl font-bold text-purple-600 mb-4 text-center">200.000 VND</p>
                        <p className="text-gray-600 mb-6 text-center">Tương đương 42 lần sử dụng</p>
                        <ul className="text-gray-700 mb-6 space-y-2">
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Tạo nội dung</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Viết lại văn bản</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Tóm tắt văn bản</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Gợi ý từ khóa</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Viết Email</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Hỗ trợ cơ bản</li>
                        </ul>
                        <button
                            className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-all duration-300 transform hover:scale-105"
                            onClick={() => navigate("/buy-diamonds")}
                        >
                            Tìm hiểu thêm
                        </button>
                    </div>

                    {/* Gói 3 */}
                    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-green-500">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Gói Cao Cấp</h3>
                        <p className="text-3xl font-bold text-green-600 mb-4 text-center">500.000 VND</p>
                        <p className="text-gray-600 mb-6 text-center">Tương đương 110 lần sử dụng</p>
                        <ul className="text-gray-700 mb-6 space-y-2">
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Tạo nội dung</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Viết lại văn bản</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Tóm tắt văn bản</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Gợi ý từ khóa</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Viết Email</li>
                            <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Hỗ trợ 24/7</li>
                        </ul>
                        <button
                            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105"
                            onClick={() => navigate("/buy-diamonds")}
                        >
                            Tìm hiểu thêm
                        </button>
                    </div>
                </div>
            </section>

            {/* Section 5: Top 3 Khảo sát hàng đầu */}
            <section className="container mx-auto px-6 py-16">
                <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
                    Top Khảo sát hàng đầu
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-700 to-purple-300 mx-auto mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {topSurveys.length > 0 ? (
                        topSurveys.map((survey, index) => (
                            <div
                                key={index}
                                className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-blue-700"
                            >
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Email: {survey.user_email}
                                </h3>
                                <p className="text-gray-600 mb-2">
                                    Nhận xét: {survey.comment || "Không có góp ý."}
                                </p>
                                <p className="text-gray-500 text-sm">
                                    Ngày nhận xét: {new Date(survey.created_at).toLocaleDateString("vi-VN")}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 text-lg">Không có khảo sát nào để hiển thị.</p>
                    )}
                </div>
            </section>

            {/* Section 6: Top Người dùng hàng đầu */}
            <section className="container mx-auto px-6 py-16 bg-gray-50 rounded-xl shadow-inner">
                <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
                    Top Người dùng hàng đầu
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-700 to-purple-300 mx-auto mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {topUsers.length > 0 ? (
                        topUsers.map((user, index) => {
                            const { rank, iconColor } = getRankInfo(user.totalPayment); // Sử dụng totalPayment từ API
                            return (
                                <div
                                    key={index}
                                    className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-green-700"
                                >
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                        Email: {user.email}
                                    </h3>
                                    <p className="text-gray-600 mb-2 flex items-center">
                                        <FontAwesomeIcon icon={faShieldAlt} className={`${iconColor} mr-2`} />
                                        {rank}
                                    </p>

                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 text-lg">Không có người dùng nào để hiển thị.</p>
                    )}
                </div>
            </section>

            {/* Section: Blog hoặc Tin tức nổi bật */}
            <section className="container mx-auto px-6 py-16 bg-gray-50 rounded-xl shadow-inner">
                <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
                    Blog hoặc Tin tức nổi bật
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-700 to-purple-300 mx-auto mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {latestNews.length > 0 ? (
                        latestNews.map((news) => (
                            <a
                                href="/tintuc"
                                key={news.id}
                                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                            >
                                <img
                                    src={news.image}
                                    alt={news.title}
                                    className="w-full h-40 object-cover"
                                />
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                        {news.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm">{news.date}</p>
                                </div>
                            </a>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 text-lg">Không có tin tức để hiển thị.</p>
                    )}
                </div>
                <div className="text-center mt-6">
                    <button
                        className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors duration-300"
                        onClick={() => navigate("/tintuc")}
                    >
                        Xem tất cả tin tức
                    </button>
                </div>
            </section>

            {/* Section 6: Câu hỏi thường gặp */}
            <section className="container mx-auto px-6 py-16 bg-gray-50 rounded-xl shadow-inner">
                <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
                    Câu hỏi thường gặp
                </h2>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-700 to-purple-300 mx-auto mb-8"></div>
                <div className="space-y-6 max-w-4xl mx-auto">
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            # ContentDT cung cấp các dịch vụ gì?
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            ContentDT hỗ trợ sáng tạo nội dung với:
                            <ul className="list-disc list-inside mt-2 space-y-2">
                                <li><span className="font-medium">Viết lại văn bản:</span> Chuyển đổi nội dung giữ nguyên ý nghĩa.</li>
                                <li><span className="font-medium">Kiểm tra đạo văn:</span> Phát hiện và loại bỏ sao chép.</li>
                                <li><span className="font-medium">Kiểm tra chính tả:</span> Sửa lỗi ngữ pháp và dấu câu.</li>
                            </ul>
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            # Công cụ này có miễn phí hay không?
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            Có cả phiên bản miễn phí và trả phí với tính năng nâng cao.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            # Làm thế nào để viết lại văn bản trên 200 từ/lượt?
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            Nâng cấp gói trả phí để xử lý văn bản dài hơn và không giới hạn lượt.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            # Làm thế nào để nâng cấp gói dịch vụ?
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            Vào phần 'Nâng cấp' trong tài khoản và làm theo hướng dẫn thanh toán.
                        </p>
                    </div>
                </div>
            </section>

            {/* Chat Button and Chatbox */}
            <div className="fixed bottom-6 right-6 z-50">
                {!isChatOpen && (
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-blue-600 transition-all duration-300"
                    >
                        <FontAwesomeIcon icon={faComment} size="lg" />
                    </button>
                )}
                {isChatOpen && (
                    <div className="bg-white rounded-lg shadow-lg p-4 w-80 h-96 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold">Hỗ trợ trực tuyến</h3>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto border p-2 mb-2">
                            {messages.map((msg, index) => (
                                <p key={index} className={msg.senderId === userId ? "text-right" : "text-left"}>
                                    <strong>{msg.senderId}: </strong>{msg.content}
                                </p>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="border p-2 flex-1 rounded"
                                placeholder="Nhập tin nhắn..."
                                onKeyPress={(e) => e.key === "Enter" && sendMessage()} // Gửi khi nhấn Enter
                            />
                            <button
                                onClick={sendMessage}
                                className="bg-blue-500 text-white px-4 rounded hover:bg-blue-600"
                            >
                                Gửi
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;