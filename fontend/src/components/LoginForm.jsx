import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Sử dụng để chuyển hướng
import "./tailwind.css"
const LoginForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate(); // Dùng để chuyển hướng

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (data.success) {
                // Đăng nhập thành công, chuyển hướng đến trang admin
                navigate("/admin");
            } else {
                setError(data.message || "Email hoặc mật khẩu không đúng");
            }
        } catch (err) {
            console.error(err);
            setError("Đã xảy ra lỗi, vui lòng thử lại!");
        }
    };

    return (
        <div className="flex justify-center items-center h-screen p-10">
            <div className="grid md:grid-cols-2 grid-cols-1 border rounded-3xl">
                {/* Phần form đăng nhập */}
                <div className="flex justify-center items-center p-5">
                    <form onSubmit={handleSubmit}>
                        <h1 className="text-center mb-10 font-bold text-4xl">Login Admin</h1>
                        {error && <p className="text-center text-red-500 mb-4">{error}</p>}
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-gray-100 border outline-none rounded-md py-3 w-full px-4 mb-3"
                            placeholder="Email"
                            required
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-gray-100 border outline-none rounded-md py-3 w-full px-4 mb-3"
                            placeholder="Password"
                            required
                        />
                        <button
                            type="submit"
                            className="bg-yellow-400 hover:bg-yellow-500 border outline-none rounded-md py-3 w-full px-4 font-semibold text-white"
                        >
                            Xác nhận
                        </button>
                    </form>
                </div>
                {/* Phần hình ảnh */}
                <div>
                    <img
                        src="https://vanphong-pham.com/wp-content/uploads/2022/05/van-phong-pham-quan-12.jpg"
                        className="rounded-3xl"
                        alt="Background"
                    />
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
