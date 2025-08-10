import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Cài đặt react-icons

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false); // Toggle cho mật khẩu mới
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Toggle cho xác nhận mật khẩu
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    // Kiểm tra điều kiện mật khẩu
    const checkPasswordConditions = (password) => {
        const lengthValid = password.length >= 8 && password.length <= 24;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasSpecial = /[@.]/.test(password);
        const hasNumber = /\d/.test(password);
        return { lengthValid, hasUpperCase, hasSpecial, hasNumber };
    };

    useEffect(() => {
        if (!token) {
            setError("Token không hợp lệ hoặc không tồn tại.");
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!newPassword || !confirmPassword) {
            setError("Vui lòng nhập mật khẩu mới và xác nhận mật khẩu!");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Mật khẩu mới và xác nhận mật khẩu không khớp!");
            return;
        }

        try {
            const response = await axios.post("http://localhost:5000/reset-password", {
                token,
                newPassword,
            });
            if (response.status === 200) {
                setMessage(response.data.message);
                setTimeout(() => navigate("/login/user"), 2000);
            }
        } catch (err) {
            console.error("Reset password error:", err.message, err.response?.data);
            setError(err.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại!");
        }
    };

    const { lengthValid, hasUpperCase, hasSpecial, hasNumber } = checkPasswordConditions(newPassword);

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 flex justify-center">
            <div className="max-w-screen-xl m-0 sm:m-10 bg-white shadow sm:rounded-lg flex justify-center flex-1">
                <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-12">
                    <div className="mt-12 flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-4">Đặt lại mật khẩu</h2>
                        {message && <p style={{ color: "green" }}>{message}</p>}
                        {error && <p style={{ color: "red" }}>{error}</p>}
                        <form onSubmit={handleSubmit} className="w-full flex-1 mt-8">
                            <div className="mx-auto max-w-xs">
                                <div className="relative mb-4">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Mật khẩu mới"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="w-full px-8 py-4 rounded-lg bg-gray-100 border border-gray-200 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                <div className="relative mb-4">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Xác nhận mật khẩu"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full px-8 py-4 rounded-lg bg-gray-100 border border-gray-200 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {/* Hiển thị điều kiện mật khẩu */}
                                <div className="text-sm text-gray-600 mb-4 space-y-2">
                                    <p>Độ dài (8-24 ký tự): {lengthValid ? "✓" : "✗"}</p>
                                    <p>Có ký tự hoa: {hasUpperCase ? "✓" : "✗"}</p>
                                    <p>Có ký tự @ hoặc .: {hasSpecial ? "✓" : "✗"}</p>
                                    <p>Có số: {hasNumber ? "✓" : "✗"}</p>
                                </div>
                                <button
                                    type="submit"
                                    className="mt-5 bg-blue-400 text-white w-full py-4 rounded-lg hover:bg-blue-700"
                                    disabled={!lengthValid || !hasUpperCase || !hasSpecial || !hasNumber}
                                >
                                    Đặt lại mật khẩu
                                </button>
                            </div>
                        </form>
                        <p className="mt-4 text-center text-gray-600">
                            <a href="/login/user" className="text-blue-600 hover:underline">
                                Quay lại đăng nhập
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;