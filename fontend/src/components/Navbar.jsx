import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, XMarkIcon, DocumentTextIcon, ArrowPathIcon, ScissorsIcon, TagIcon, EnvelopeIcon } from "@heroicons/react/24/solid";
import axios from "axios"; // Thêm axios để gọi API
import { ipBE } from "../data/consts";

const Navbar = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isOpen, setIsOpen] = useState(false); // Trạng thái menu mobile
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false); // Trạng thái dropdown Công cụ
    const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState(false); // Trạng thái dropdown Lịch sử
    const [diamonds, setDiamonds] = useState(0); // Thêm trạng thái cho kim cương

    useEffect(() => {
        // Lấy thông tin người dùng từ localStorage
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) {
            setUser(storedUser);
            // Lấy số kim cương khi có user
            fetchDiamonds();
        } else {
            setUser(null);
            setDiamonds(0); // Reset kim cương nếu không có user
        }
    }, []);

    // Hàm lấy số kim cương từ API
    const fetchDiamonds = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setDiamonds(0);
                return;
            }
            const response = await axios.get(ipBE + "api/user-diamonds", {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setDiamonds(response.data.diamonds);
        } catch (error) {
            console.error("Lỗi lấy kim cương:", error);
            setDiamonds(0); // Đặt mặc định 0 nếu có lỗi
        }
    };

    // Xử lý đăng xuất
    const handleLogout = () => {
        localStorage.clear(); // Xóa toàn bộ localStorage khi đăng xuất
        setUser(null);
        setDiamonds(0); // Reset kim cương khi đăng xuất
        navigate("/");
    };

    // Toggle menu mobile
    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                {/* Logo */}
                <div
                    className="text-3xl font-bold text-red-600 tracking-wide cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    ContentDT
                </div>

                {/* Menu chính - Desktop */}
                <ul className="hidden md:flex space-x-8 items-center">
                    <li
                        className="text-gray-700 text-lg font-medium hover:text-red-600 transition-colors duration-300 cursor-pointer"
                        onClick={() => navigate("/")}
                    >
                        Giới Thiệu
                    </li>
                    <li
                        className="relative group"
                        onMouseEnter={() => setIsProductDropdownOpen(true)}
                        onMouseLeave={() => setIsProductDropdownOpen(false)}
                    >
                        <span className="text-gray-700 text-lg font-medium hover:text-red-600 transition-colors duration-300 flex items-center">
                            Công cụ
                            <svg
                                className={`w-4 h-4 ml-1 transition-transform duration-300 ${isProductDropdownOpen ? "rotate-180" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </span>
                        <ul
                            className={`absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl transition-all duration-300 transform ${isProductDropdownOpen
                                ? "opacity-100 visible translate-y-0"
                                : "opacity-0 invisible translate-y-2"
                                }`}
                        >
                            <li
                                className="px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-t-lg cursor-pointer flex items-center"
                                onClick={() => navigate("/content-page")}
                            >
                                <DocumentTextIcon className="h-5 w-5 mr-2" />
                                Tạo nội dung
                            </li>
                            <li
                                className="px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 cursor-pointer flex items-center"
                                onClick={() => navigate("/tomtatvanban")}
                            >
                                <ScissorsIcon className="h-5 w-5 mr-2" />
                                Tóm tắt văn bản
                            </li>
                            <li
                                className="px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 cursor-pointer flex items-center"
                                onClick={() => navigate("/rewrite-text")}
                            >
                                <ArrowPathIcon className="h-5 w-5 mr-2" />
                                Viết lại văn bản
                            </li>
                            <li
                                className="px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 cursor-pointer flex items-center"
                                onClick={() => navigate("/suggest-keywords")}
                            >
                                <TagIcon className="h-5 w-5 mr-2" />
                                Gợi ý từ khóa
                            </li>
                            <li
                                className="px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-b-lg cursor-pointer flex items-center"
                                onClick={() => navigate("/email-generator")}
                            >
                                <EnvelopeIcon className="h-5 w-5 mr-2" />
                                Viết Email
                            </li>
                        </ul>
                    </li>
                    <li
                        className="relative group"
                        onMouseEnter={() => setIsHistoryDropdownOpen(true)}
                        onMouseLeave={() => setIsHistoryDropdownOpen(false)}
                    >
                        <span className="text-gray-700 text-lg font-medium hover:text-red-600 transition-colors duration-300 flex items-center">
                            Lịch sử
                            <svg
                                className={`w-4 h-4 ml-1 transition-transform duration-300 ${isHistoryDropdownOpen ? "rotate-180" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </span>
                        <ul
                            className={`absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl transition-all duration-300 transform ${isHistoryDropdownOpen
                                ? "opacity-100 visible translate-y-0"
                                : "opacity-0 invisible translate-y-2"
                                }`}
                        >
                            <li
                                className="px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-t-lg cursor-pointer"
                                onClick={() => navigate("/history")}
                            >
                                Lịch sử hoạt động
                            </li>
                            <li
                                className="px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-b-lg cursor-pointer"
                                onClick={() => navigate("/payment-history")}
                            >
                                Lịch sử thanh toán
                            </li>
                        </ul>
                    </li>
                    <li
                        className="text-gray-700 text-lg font-medium hover:text-red-600 transition-colors duration-300 cursor-pointer"
                        onClick={() => navigate("/buy-diamonds")}
                    >
                        Mua gói
                    </li>
                    <li
                        className="text-gray-700 text-lg font-medium hover:text-red-600 transition-colors duration-300 cursor-pointer"
                        onClick={() => navigate("/tintuc")}
                    >
                        Tin Tức
                    </li>
                    <li
                        className="text-gray-700 text-lg font-medium hover:text-red-600 transition-colors duration-300 cursor-pointer"
                        onClick={() => navigate("/contact")}
                    >
                        Liên hệ
                    </li>
                </ul>

                {/* Nút đăng nhập/đăng xuất và kim cương - Desktop */}
                <div className="hidden md:flex items-center space-x-4">
                    {user ? (
                        <>
                            <div className="flex items-center space-x-1 text-sm">
                                <span className="text-gray-700 font-medium">{diamonds}</span>
                                <svg
                                    className="w-4 h-4 text-yellow-500"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 512 512"
                                >
                                    <path d="M116.7 33.8c4.5-6.1 11.7-9.8 19.3-9.8l240 0c7.6 0 14.8 3.6 19.3 9.8l112 152c6.8 9.2 6.1 21.9-1.5 30.4l-232 256c-4.5 5-11 7.9-17.8 7.9s-13.2-2.9-17.8-7.9l-232-256c-7.7-8.5-8.3-21.2-1.5-30.4l112-152zm38.5 39.8c-3.3 2.5-4.2 7-2.1 10.5L210.5 179.8 63.3 192c-4.1 .3-7.3 3.8-7.3 8s3.2 7.6 7.3 8l192 16c.4 0 .9 0 1.3 0l192-16c4.1-.3 7.3-3.8 7.3-8s-3.2-7.6-7.3-8l-147.2-12.3 57.4-95.6c2.1-3.5 1.2-8.1-2.1-10.5s-7.9-2-10.7 1L256 172.2 165.9 74.6c-2.8-3-7.4-3.4-10.7-1z" />
                                </svg>
                            </div>
                            <span className="text-gray-700 font-medium truncate max-w-[150px]">
                                Xin chào, {user.name}
                            </span>
                            <button
                                className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors duration-300"
                                onClick={handleLogout}
                            >
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <button
                            className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors duration-300"
                            onClick={() => navigate("/login/user")}
                        >
                            Bắt đầu ngay
                        </button>
                    )}
                </div>

                {/* Menu Hamburger - Mobile */}
                <div className="md:hidden flex items-center">
                    <button onClick={toggleMenu} className="text-gray-700 focus:outline-none">
                        {isOpen ? (
                            <XMarkIcon className="h-8 w-8" />
                        ) : (
                            <Bars3Icon className="h-8 w-8" />
                        )}
                    </button>
                </div>
            </div>

            {/* Menu Mobile */}
            {isOpen && (
                <div className="md:hidden bg-white shadow-lg">
                    <ul className="flex flex-col space-y-4 px-6 py-4">
                        <li
                            className="text-gray-700 text-lg font-medium hover:text-red-600 transition-colors duration-300 cursor-pointer"
                            onClick={() => {
                                navigate("/");
                                toggleMenu();
                            }}
                        >
                            Giới Thiệu
                        </li>
                        <li className="relative">
                            <span className="text-gray-700 text-lg font-medium hover:text-red-600 transition-colors duration-300">
                                Công cụ
                            </span>
                            <ul className="mt-2 space-y-2 pl-4">
                                <li
                                    className="text-gray-600 hover:text-red-600 cursor-pointer flex items-center"
                                    onClick={() => {
                                        navigate("/content-page");
                                        toggleMenu();
                                    }}
                                >
                                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                                    Tạo nội dung
                                </li>
                                <li
                                    className="text-gray-600 hover:text-red-600 cursor-pointer flex items-center"
                                    onClick={() => {
                                        navigate("/tomtatvanban");
                                        toggleMenu();
                                    }}
                                >
                                    <ScissorsIcon className="h-5 w-5 mr-2" />
                                    Tóm tắt văn bản
                                </li>
                                <li
                                    className="text-gray-600 hover:text-red-600 cursor-pointer flex items-center"
                                    onClick={() => {
                                        navigate("/rewrite-text");
                                        toggleMenu();
                                    }}
                                >
                                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                                    Viết lại văn bản
                                </li>
                                <li
                                    className="text-gray-600 hover:text-red-600 cursor-pointer flex items-center"
                                    onClick={() => {
                                        navigate("/suggest-keywords");
                                        toggleMenu();
                                    }}
                                >
                                    <TagIcon className="h-5 w-5 mr-2" />
                                    Gợi ý từ khóa
                                </li>
                                <li
                                    className="text-gray-600 hover:text-red-600 cursor-pointer flex items-center"
                                    onClick={() => {
                                        navigate("/email-generator");
                                        toggleMenu();
                                    }}
                                >
                                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                                    Viết Email
                                </li>
                            </ul>
                        </li>
                        <li className="relative">
                            <span className="text-gray-700 text-lg font-medium hover:text-red-600 transition-colors duration-300">
                                Lịch sử
                            </span>
                            <ul className="mt-2 space-y-2 pl-4">
                                <li
                                    className="text-gray-600 hover:text-red-600 cursor-pointer"
                                    onClick={() => {
                                        navigate("/history");
                                        toggleMenu();
                                    }}
                                >
                                    Lịch sử hoạt động
                                </li>
                                <li
                                    className="text-gray-600 hover:text-red-600 cursor-pointer"
                                    onClick={() => {
                                        navigate("/payment-history");
                                        toggleMenu();
                                    }}
                                >
                                    Lịch sử thanh toán
                                </li>
                            </ul>
                        </li>
                        <li
                            className="text-gray-700 text-lg font-medium hover:text-red-600 transition-colors duration-300 cursor-pointer"
                            onClick={() => {
                                navigate("/tintuc");
                                toggleMenu();
                            }}
                        >
                            Tin Tức
                        </li>
                        <li
                            className="text-gray-700 text-lg font-medium hover:text-red-600 transition-colors duration-300 cursor-pointer"
                            onClick={() => {
                                navigate("/contact");
                                toggleMenu();
                            }}
                        >
                            Liên hệ
                        </li>
                        <li>
                            {user ? (
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center space-x-1 text-sm">
                                        <span className="text-gray-700 font-medium">{diamonds}</span>
                                        <svg
                                            className="w-4 h-4 text-yellow-500"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 512 512"
                                        >
                                            <path d="M116.7 33.8c4.5-6.1 11.7-9.8 19.3-9.8l240 0c7.6 0 14.8 3.6 19.3 9.8l112 152c6.8 9.2 6.1 21.9-1.5 30.4l-232 256c-4.5 5-11 7.9-17.8 7.9s-13.2-2.9-17.8-7.9l-232-256c-7.7-8.5-8.3-21.2-1.5-30.4l112-152zm38.5 39.8c-3.3 2.5-4.2 7-2.1 10.5L210.5 179.8 63.3 192c-4.1 .3-7.3 3.8-7.3 8s3.2 7.6 7.3 8l192 16c.4 0 .9 0 1.3 0l192-16c4.1-.3 7.3-3.8 7.3-8s-3.2-7.6-7.3-8l-147.2-12.3 57.4-95.6c2.1-3.5 1.2-8.1-2.1-10.5s-7.9-2-10.7 1L256 172.2 165.9 74.6c-2.8-3-7.4-3.4-10.7-1z" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700 font-medium truncate">
                                        Xin chào, {user.name}
                                    </span>
                                    <button
                                        className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors duration-300 w-full text-center"
                                        onClick={() => {
                                            handleLogout();
                                            toggleMenu();
                                        }}
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors duration-300 w-full text-center"
                                    onClick={() => {
                                        navigate("/login");
                                        toggleMenu();
                                    }}
                                >
                                    Bắt đầu ngay
                                </button>
                            )}
                        </li>
                    </ul>
                </div>
            )}
        </nav>
    );
};

export default Navbar;