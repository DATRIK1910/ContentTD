import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa"; // Cài đặt: npm install react-icons

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    // Lấy thông tin người dùng từ localStorage
    const user = JSON.parse(localStorage.getItem("user")) || {};

    useEffect(() => {
        if (!user.id && !user.email) {
            navigate("/login/user");
            return;
        }

        axios
            .post("http://localhost:5000/api/profile", {
                userId: user.id,
                email: user.email,
            })
            .then((response) => {
                if (response.data.success) {
                    setProfile(response.data.profile);
                } else {
                    setError("Không thể tải thông tin hồ sơ.");
                }
            })
            .catch((err) => {
                console.error("Profile fetch error:", err);
                setError("Đã xảy ra lỗi, vui lòng thử lại! " + err.message);
            });
    }, [user.id, user.email, navigate]);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Mật khẩu mới và xác nhận không khớp!");
            return;
        }

        try {
            const response = await axios.post("http://localhost:5000/api/profile/change-password", {
                userId: user.id,
                email: user.email,
                currentPassword,
                newPassword,
            });
            if (response.data.success) {
                setMessage(response.data.message);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setShowChangePassword(false); // Ẩn form sau khi thành công
            } else {
                setError(response.data.message || "Thay đổi mật khẩu thất bại");
            }
        } catch (err) {
            console.error("Change password error:", err);
            setError("Đã xảy ra lỗi, vui lòng thử lại! " + err.message);
        }
    };

    // Kiểm tra điều kiện mật khẩu mới
    const checkPasswordConditions = (password) => {
        const lengthValid = password.length >= 8 && password.length <= 24;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasSpecial = /[@.]/.test(password);
        const hasNumber = /\d/.test(password);
        return { lengthValid, hasUpperCase, hasSpecial, hasNumber };
    };

    const { lengthValid, hasUpperCase, hasSpecial, hasNumber } = checkPasswordConditions(newPassword);

    if (!profile) return <div className="min-h-screen bg-gray-100 flex justify-center items-center">Đang tải...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900 flex justify-center items-center">
            <div className="max-w-2xl w-full mx-auto p-6 sm:p-10 bg-white rounded-xl shadow-2xl transform transition-all duration-300 hover:shadow-3xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-indigo-700 mb-2">Hồ sơ cá nhân</h1>
                    <p className="text-gray-500">Quản lý thông tin và bảo mật tài khoản của bạn</p>
                </div>

                {error && <p className="text-red-600 text-center mb-4 bg-red-100 p-2 rounded-lg">{error}</p>}
                {message && <p className="text-green-600 text-center mb-4 bg-green-100 p-2 rounded-lg">{message}</p>}

                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                            <span className="text-indigo-600 mr-2">👤</span>
                            <p><strong>Tên:</strong> {profile.name}</p>
                        </div>
                        <div className="flex items-center">
                            <span className="text-indigo-600 mr-2">📧</span>
                            <p><strong>Email:</strong> {profile.email}</p>
                        </div>
                        <div className="flex items-center">
                            <span className="text-indigo-600 mr-2">💰</span>
                            <p><strong>Tổng tiền chi:</strong> {profile.totalPayment.toLocaleString()} VND</p>
                        </div>
                        <div className="flex items-center">
                            <span className="text-indigo-600 mr-2">🏆</span>
                            <p><strong>Thứ hạng:</strong> {profile.rank}</p>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        onClick={() => setShowChangePassword(!showChangePassword)}
                        className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300 shadow-md hover:shadow-lg"
                    >
                        <FaLock className="mr-2" />
                        {showChangePassword ? "Ẩn thay đổi mật khẩu" : "Thay đổi mật khẩu"}
                    </button>
                </div>

                {showChangePassword && (
                    <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-inner animate-fade-in">
                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="Mật khẩu hiện tại"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Mật khẩu mới"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Xác nhận mật khẩu mới"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            {/* Hiển thị điều kiện mật khẩu như ResetPassword */}
                            <div className="text-sm text-gray-600 space-y-2">
                                <p>Độ dài (8-24 ký tự): {lengthValid ? "✓" : "✗"}</p>
                                <p>Có ký tự hoa: {hasUpperCase ? "✓" : "✗"}</p>
                                <p>Có ký tự @ hoặc .: {hasSpecial ? "✓" : "✗"}</p>
                                <p>Có số: {hasNumber ? "✓" : "✗"}</p>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 shadow-md hover:shadow-lg"
                                disabled={!lengthValid || !hasUpperCase || !hasSpecial || !hasNumber}
                            >
                                Xác nhận thay đổi
                            </button>
                        </form>
                    </div>
                )}

                <p className="mt-6 text-center text-gray-600">
                    <a href="/" className="text-indigo-600 hover:underline font-medium">
                        Quay lại trang chủ
                    </a>
                </p>
            </div>
        </div>
    );
};

// Animation fade-in
const styles = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .animate-fade-in {
        animation: fadeIn 0.3s ease-in-out;
    }
`;
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default Profile;