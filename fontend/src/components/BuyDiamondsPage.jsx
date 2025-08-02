import React, { useState, useEffect } from "react";
import axios from "axios";

const BuyDiamondsPage = () => {
    const [diamonds, setDiamonds] = useState(0);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [selectedDiamonds, setSelectedDiamonds] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const fetchDiamonds = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token"); // Lấy token từ localStorage
                const response = await axios.get("http://localhost:5000/api/user-diamonds", {
                    withCredentials: true, // Gửi cookie
                    headers: {
                        Authorization: `Bearer ${token}`, // Gửi token trong header
                    },
                });
                setDiamonds(response.data.diamonds);
            } catch (err) {
                setError("Lỗi lấy kim cương: " + err.response?.data?.message || err.message);
                if (err.response?.data?.message === "Token đã hết hạn, vui lòng đăng nhập lại!") {
                    localStorage.removeItem("token"); // Xóa token hết hạn
                    window.location.href = "/login"; // Thay bằng route đăng nhập của bạn
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDiamonds();
    }, []);

    const buyDiamonds = async (amount, diamondsAmount) => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token"); // Lấy token từ localStorage
            const response = await axios.post(
                "http://localhost:5000/api/buy-diamonds",
                { amount },
                {
                    withCredentials: true, // Gửi cookie
                    headers: {
                        Authorization: `Bearer ${token}`, // Gửi token trong header
                    },
                }
            );
            if (response.data.success) {
                if (response.data.url) {
                    window.location.href = response.data.url; // Chuyển hướng đến VNPay
                } else if (response.data.message) {
                    // Trường hợp môi trường localhost, giao dịch hoàn tất ngay
                    setDiamonds(diamonds + diamondsAmount); // Cập nhật số kim cương ngay lập tức
                    setShowSuccessModal(true); // Hiển thị modal thành công
                    setTimeout(() => setShowSuccessModal(false), 3000); // Tự động đóng sau 3 giây
                }
            } else {
                throw new Error("Không nhận được URL thanh toán từ server");
            }
        } catch (err) {
            console.error("Lỗi thanh toán:", err.message, err.response?.data);
            setError(err.response?.data?.message || err.message || "Lỗi không xác định khi thanh toán");
            if (err.response?.data?.message === "Token đã hết hạn, vui lòng đăng nhập lại!") {
                localStorage.removeItem("token"); // Xóa token hết hạn
                window.location.href = "/login"; // Thay bằng route đăng nhập của bạn
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBuyClick = (amount, diamondsAmount) => {
        setSelectedAmount(amount);
        setSelectedDiamonds(diamondsAmount);
        setShowConfirmModal(true);
    };

    const handleConfirm = () => {
        setShowConfirmModal(false);
        buyDiamonds(selectedAmount, selectedDiamonds);
    };

    const handleClose = () => {
        setShowConfirmModal(false);
        setSelectedAmount(null);
        setSelectedDiamonds(null);
    };

    return (
        <div className="flex flex-col p-6 mt-28 max-w-4xl mx-auto bg-gradient-to-b from-gray-50 to-white shadow-2xl rounded-xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Mua Kim Cương</h1>

            {loading && !diamonds && (
                <p className="text-center text-blue-600 mb-4">Đang tải số kim cương...</p>
            )}
            {!loading && (
                <p className="text-gray-700 mb-8 text-center font-semibold">
                    Số kim cương còn lại: <span className="text-blue-600">{diamonds}</span> (~{Math.floor(diamonds / 5)}{" "}
                    lần sử dụng)
                </p>
            )}
            {error && <p className="text-red-500 mb-6 text-center">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gói Cơ Bản */}
                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-blue-500">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Gói Cơ Bản</h3>
                    <p className="text-3xl font-bold text-blue-600 mb-4 text-center">100.000 VND</p>
                    <p className="text-gray-600 mb-6 text-center">100 kim cương (~20 lần sử dụng)</p>
                    <ul className="text-gray-700 mb-6 space-y-2 text-center">
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Tạo nội dung</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Viết lại văn bản</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Tóm tắt văn bản</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Gợi ý từ khóa</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Viết Email</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Hỗ trợ cơ bản</li>
                    </ul>
                    <button
                        className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        onClick={() => handleBuyClick(100000, 100)}
                        disabled={loading}
                    >
                        {loading ? "Đang xử lý..." : "Thanh toán"}
                    </button>
                </div>

                {/* Gói Tiêu Chuẩn */}
                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-purple-500">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Gói Tiêu Chuẩn</h3>
                    <p className="text-3xl font-bold text-purple-600 mb-4 text-center">200.000 VND</p>
                    <p className="text-gray-600 mb-6 text-center">210 kim cương (~42 lần sử dụng)</p>
                    <ul className="text-gray-700 mb-6 space-y-2 text-center">
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Tạo nội dung</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Viết lại văn bản</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Tóm tắt văn bản</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Gợi ý từ khóa</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Viết Email</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Hỗ trợ ưu tiên</li>
                    </ul>
                    <button
                        className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        onClick={() => handleBuyClick(200000, 210)}
                        disabled={loading}
                    >
                        {loading ? "Đang xử lý..." : "Thanh toán"}
                    </button>
                </div>

                {/* Gói Cao Cấp */}
                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-l-4 border-green-500">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Gói Cao Cấp</h3>
                    <p className="text-3xl font-bold text-green-600 mb-4 text-center">500.000 VND</p>
                    <p className="text-gray-600 mb-6 text-center">550 kim cương (~110 lần sử dụng)</p>
                    <ul className="text-gray-700 mb-6 space-y-2 text-center">
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Tạo nội dung</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Viết lại văn bản</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Tóm tắt văn bản</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Gợi ý từ khóa</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Viết Email</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✔</span> Hỗ trợ 24/7</li>
                    </ul>
                    <button
                        className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        onClick={() => handleBuyClick(500000, 550)}
                        disabled={loading}
                    >
                        {loading ? "Đang xử lý..." : "Thanh toán"}
                    </button>
                </div>
            </div>

            {/* Modal Xác nhận */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md text-center">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Xác nhận mua gói</h2>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn mua gói {selectedAmount === 100000 ? "Cơ Bản" : selectedAmount === 200000 ? "Tiêu Chuẩn" : "Cao Cấp"} với giá{" "}
                            {selectedAmount.toLocaleString("vi-VN")} VND và nhận {selectedDiamonds} kim cương?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-all duration-300"
                                onClick={handleConfirm}
                                disabled={loading}
                            >
                                {loading ? "Đang xử lý..." : "Xác nhận"}
                            </button>
                            <button
                                className="bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400 transition-all duration-300"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Thành công */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md text-center">
                        <svg
                            className="w-16 h-16 text-green-500 mx-auto mb-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã mua gói thành công!</h2>
                        <p className="text-gray-600">Bạn đã nhận được {selectedDiamonds} kim cương.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuyDiamondsPage;