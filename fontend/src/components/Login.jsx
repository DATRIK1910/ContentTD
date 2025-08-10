import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";

const clientId = "241737379741-c8obrgkfg4j8047rg6m0vq6bmv1tnd9f.apps.googleusercontent.com";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Xử lý đăng nhập bằng email & password
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password.trim()) {
            setError("Vui lòng nhập email và mật khẩu!");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/login/user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                localStorage.setItem("user", JSON.stringify({ id: data.user.id, email: data.user.email, name: data.user.name, role: data.user.role }));
                localStorage.setItem("token", data.token);

                const diamondsResponse = await axios.get("http://localhost:5000/api/user-diamonds", {
                    headers: { Authorization: `Bearer ${data.token}` },
                });
                localStorage.setItem("diamonds", diamondsResponse.data.diamonds);

                window.dispatchEvent(new CustomEvent("loginSuccess", { detail: { user: data.user, token: data.token, diamonds: diamondsResponse.data.diamonds } }));

                if (data.user.role === "admin") {
                    navigate("/admin");
                } else {
                    navigate("/");
                }
                window.location.reload();
            } else {
                setError(data.message || "Email hoặc mật khẩu không đúng");
            }
        } catch (err) {
            console.error("Login error:", err.message, err.stack);
            setError("Đã xảy ra lỗi, vui lòng thử lại! " + err.message);
        }
    };

    // Xử lý khi đăng nhập bằng Google thành công
    const handleGoogleSuccess = async (response) => {
        try {
            setError("");
            const googleToken = response.credential;
            const res = await fetch("http://localhost:5000/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: googleToken }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
            }

            const data = await res.json();
            if (data.success) {
                localStorage.setItem("user", JSON.stringify({ id: data.user.id, email: data.user.email, name: data.user.name, role: data.user.role }));
                localStorage.setItem("token", data.token || "dummy-token");

                const diamondsResponse = await axios.get("http://localhost:5000/api/user-diamonds", {
                    headers: { Authorization: `Bearer ${data.token}` },
                });
                localStorage.setItem("diamonds", diamondsResponse.data.diamonds);

                window.dispatchEvent(new CustomEvent("loginSuccess", { detail: { user: data.user, token: data.token, diamonds: diamondsResponse.data.diamonds } }));

                if (data.user.role === "admin") {
                    navigate("/admin");
                } else {
                    navigate("/");
                }
                window.location.reload();
            } else {
                setError(data.message || "Không thể xác thực tài khoản Google!");
            }
        } catch (err) {
            console.error("Google login error:", err.message, err.stack);
            setError("Đăng nhập bằng Google thất bại! " + err.message);
        }
    };

    // Xử lý khi nhấp vào liên kết quên mật khẩu
    const handleForgotPassword = () => {
        navigate("/forgot-password"); // Chuyển hướng đến trang quên mật khẩu
    };

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="min-h-screen bg-gray-100 text-gray-900 flex justify-center">
                <div className="max-w-screen-xl m-0 sm:m-10 bg-white shadow sm:rounded-lg flex justify-center flex-1">
                    <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-12">
                        <div className="mt-12 flex flex-col items-center">
                            <h2 className="text-2xl font-bold mb-4">Đăng nhập</h2>
                            {error && <p style={{ color: "red" }}>{error}</p>}
                            <form onSubmit={handleSubmit} className="w-full flex-1 mt-8">
                                <div className="mx-auto max-w-xs">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-8 py-4 rounded-lg bg-gray-100 border border-gray-200"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Mật khẩu"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-8 py-4 rounded-lg bg-gray-100 border border-gray-200 mt-5"
                                    />
                                    <button
                                        type="submit"
                                        className="mt-5 bg-green-400 text-white w-full py-4 rounded-lg hover:bg-green-700"
                                    >
                                        Đăng nhập
                                    </button>
                                </div>
                            </form>
                            <p className="mt-4 text-center text-gray-600">
                                Bạn chưa có tài khoản?{" "}
                                <a href="/register" className="text-blue-600 hover:underline">
                                    Đăng ký ngay
                                </a>
                            </p>
                            <p className="mt-2 text-center text-gray-600">
                                <a href="#" onClick={handleForgotPassword} className="text-blue-600 hover:underline">
                                    Quên mật khẩu?
                                </a>
                            </p>

                            <div className="mt-5">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError("Google Login thất bại")}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default Login;