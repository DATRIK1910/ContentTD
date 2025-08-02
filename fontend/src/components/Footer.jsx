import React, { useState } from "react";
import { FaFacebookF, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

const Footer = () => {
    const [showModal, setShowModal] = useState(false);

    const policyContent = `Chính sách thanh toán và bảo mật của Website ContentDT đã được thiết lập để bảo vệ thông tin cá nhân của quý khách khi truy cập vào trang web https://ContentDT.com Để hiểu rõ hơn về cách chúng tôi thu thập và sử dụng thông tin cá nhân của quý khách, xin vui lòng tham khảo chính sách bảo mật trước khi sử dụng trang web hoặc cung cấp bất kỳ thông tin nào cho chúng tôi.

    Chúng tôi cam kết rằng thỏa thuận này là không thể tách rời với điều khoản sử dụng của Website ContentDT. Bằng việc chấp nhận thỏa thuận này, quý khách hàng cam kết đã đọc kỹ, hiểu và tuân thủ đúng đắn các điều khoản sử dụng của trang web.

    Chính sách của chúng tôi là giữ kín thông tin cá nhân mà chúng tôi thu thập từ trang web hoàn toàn bảo mật và chỉ sử dụng cho mục đích nội bộ. Chúng tôi cam kết không chia sẻ thông tin cá nhân của quý khách với bất kỳ bên thứ ba nào.

    Vì vậy, khi truy cập và sử dụng Website ContentDT, quý khách đồng ý với các điều khoản và chính sách của chúng tôi. Chúng tôi cũng cam kết cập nhật và cải tiến chính sách bảo mật của mình để bảo vệ thông tin cá nhân của quý khách tốt hơn.`;

    return (
        <footer className="bg-gray-100 text-gray-700 py-8">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h2 className="text-xl font-bold text-indigo-800">Content DT</h2>
                        <p className="mt-2 text-sm">Công cụ hỗ trợ sáng tạo nội dung bằng trí tuệ nhân tạo tại Việt Nam.</p>
                        <div className="flex space-x-4 mt-3">
                            <a href="https://www.facebook.com/profile.php?id=100052839199457" className="text-gray-600 hover:text-indigo-600 text-xl">
                                <FaFacebookF />
                            </a>
                            <a href="https://www.youtube.com/@Datrikcntt" className="text-gray-600 hover:text-red-600 text-xl">
                                <FaYoutube />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-indigo-800">Thông tin</h2>
                        <ul className="mt-2 text-sm space-y-2">
                            <li>
                                <button onClick={() => setShowModal(true)} className="hover:text-indigo-600">› Chính sách bảo mật và thanh toán</button>
                            </li>
                            <li>
                                <button onClick={() => setShowModal(true)} className="hover:text-indigo-600">› Điều khoản và điều kiện</button>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-indigo-800">Liên hệ</h2>
                        <ul className="mt-2 text-sm space-y-2">
                            <li className="flex items-center space-x-2">
                                <FaPhone className="text-gray-600" /> <span>+84 363935141</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <FaEnvelope className="text-gray-600" /> <span>support@contentDT.com</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <FaMapMarkerAlt className="text-gray-600" />
                                <span>98/8 Nguyễn Phúc Chu Phường 15, Tân Bình, TPHCM</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-indigo-800">Công ty TNHH MTV Công Nghệ ĐạtG</h2>
                        <img src="https://contenteditor.net/images/bocongthuong.png" alt="Đã thông báo" className="w-32 mt-2" />
                    </div>
                </div>

                <div className="text-center text-gray-600 text-sm mt-6 border-t pt-4">
                    Copyright © {new Date().getFullYear()} <span className="font-bold">ContentDT.</span> All rights reserved.
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg w-11/12 md:w-1/2 lg:w-1/3">
                        <h2 className="text-lg font-bold mb-4">Chính sách bảo mật và thanh toán</h2>
                        <p className="text-sm text-gray-700">{policyContent}</p>
                        <button
                            onClick={() => setShowModal(false)}
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}


        </footer>

    );
};

export default Footer;