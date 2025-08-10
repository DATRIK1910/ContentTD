import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Cài đặt react-icons để dùng icon

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false); // State để toggle hiển thị mật khẩu
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    // Kiểm tra điều kiện mật khẩu
    const checkPasswordConditions = (password) => {
        const lengthValid = password.length >= 8 && password.length <= 24;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasSpecial = /[@.]/.test(password);
        const hasNumber = /\d/.test(password);
        return { lengthValid, hasUpperCase, hasSpecial, hasNumber };
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            const response = await fetch("http://localhost:5000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage("✅ Đăng ký thành công! Chuyển đến trang đăng nhập...");
                setTimeout(() => navigate("/login/user"), 5000);
            } else {
                setMessage(`❌ ${data.message}`);
            }
        } catch (error) {
            console.error("Register error:", error);
            setMessage("❌ Lỗi kết nối server!");
        }
    };

    const { lengthValid, hasUpperCase, hasSpecial, hasNumber } = checkPasswordConditions(password);

    return (
        <div className="min-h-screen flex bg-gray-100">
            <div className="flex-1 hidden md:flex flex-col justify-center items-center bg-blue-50">
                <h1 className="text-4xl font-bold text-red-600">ContentDT</h1>
            </div>
            <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Đăng ký tài khoản</h2>

                    {message && (
                        <p className={`text-sm text-center mb-4 p-2 rounded ${message.includes("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {message}
                        </p>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-gray-600 mb-1">
                                Họ và tên
                            </label>
                            <input
                                type="text"
                                id="name"
                                placeholder="Nhập họ và tên"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-gray-600 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                placeholder="tungvu@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-gray-600 mb-1">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="********"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            {/* Hiển thị điều kiện mật khẩu */}
                            <div className="text-sm text-gray-600 mt-2 space-y-1">
                                <p>Độ dài (8-24 ký tự): {lengthValid ? "✓" : "✗"}</p>
                                <p>Có ký tự hoa: {hasUpperCase ? "✓" : "✗"}</p>
                                <p>Có ký tự @ hoặc .: {hasSpecial ? "✓" : "✗"}</p>
                                <p>Có số: {hasNumber ? "✓" : "✗"}</p>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
                            disabled={!lengthValid || !hasUpperCase || !hasSpecial || !hasNumber}
                        >
                            Đăng ký
                        </button>
                    </form>
                    <p className="mt-4 text-center text-gray-600">
                        Đã có tài khoản?{" "}
                        <a href="/login/user" className="text-blue-600 hover:underline">
                            Đăng nhập ngay
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;