import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!email.trim()) {
            setError("Vui lòng nhập email!");
            return;
        }

        try {
            const response = await axios.post("http://localhost:5000/forgot-password", { email });
            if (response.status === 200) {
                setMessage(response.data.message);
            }
        } catch (err) {
            console.error("Forgot password error:", err.message, err.response?.data);
            setError(err.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại!");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 flex justify-center">
            <div className="max-w-screen-xl m-0 sm:m-10 bg-white shadow sm:rounded-lg flex justify-center flex-1">
                <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-12">
                    <div className="mt-12 flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-4">Quên mật khẩu</h2>
                        {message && <p style={{ color: "green" }}>{message}</p>}
                        {error && <p style={{ color: "red" }}>{error}</p>}
                        <form onSubmit={handleSubmit} className="w-full flex-1 mt-8">
                            <div className="mx-auto max-w-xs">
                                <input
                                    type="email"
                                    placeholder="Nhập email của bạn"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-8 py-4 rounded-lg bg-gray-100 border border-gray-200"
                                />
                                <button
                                    type="submit"
                                    className="mt-5 bg-blue-400 text-white w-full py-4 rounded-lg hover:bg-blue-700"
                                >
                                    Gửi yêu cầu
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

export default ForgotPassword;