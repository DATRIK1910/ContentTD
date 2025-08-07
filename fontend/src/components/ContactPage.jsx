import React, { useState } from "react";
import "./tailwind.css"
import { ipBE } from "../data/consts";
const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",

    });

    const [status, setStatus] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form data
        if (!formData.name || !formData.email || !formData.message) {
            setStatus("Vui lòng điền đầy đủ thông tin.");
            return;
        }
        if (!validateEmail(formData.email)) {
            setStatus("Email không hợp lệ.");
            return;
        }

        setIsSubmitting(true);
        setStatus(""); // Reset trạng thái trước khi gửi

        try {
            const response = await fetch(ipBE + "contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setStatus("Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.");
                setFormData({ name: "", email: "", message: "", _subject: "" }); // Reset form
            } else {
                const errorData = await response.json();
                setStatus(errorData.message || "Có lỗi xảy ra. Vui lòng thử lại.");
            }
        } catch (error) {
            setStatus("Không thể gửi liên hệ. Kiểm tra kết nối mạng.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({ name: "", email: "", message: "", _subject: "" });
        setStatus(""); // Reset trạng thái thông báo
    };

    return (
        <div className="min-h-screen bg-gray-800 py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
                <div className="text-white relative px-4 py-10 bg-indigo-400 shadow-lg sm:rounded-3xl sm:p-20">
                    <div className="text-center pb-6">
                        <h1 className="text-3xl">Liên hệ</h1>
                        <p className="text-gray-300">
                            Điền vào biểu mẫu bên dưới để gửi tin nhắn cho chúng tôi.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <input
                            className="shadow mb-4 appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="text"
                            placeholder="Tên"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

                        <input
                            className="shadow mb-4 appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="email"
                            placeholder="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />



                        <textarea
                            className="shadow mb-4 min-h-0 appearance-none border rounded h-64 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Nhập nội dung liên hệ tại đây..."
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            style={{ height: "121px" }}
                        ></textarea>

                        <div className="flex justify-between">
                            <button
                                type="submit"
                                className="shadow bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Đang gửi..." : "Gửi liên hệ ➤"}
                            </button>
                            <button
                                type="button"
                                className="shadow bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                onClick={handleReset}
                            >
                                Nhập lại
                            </button>
                        </div>
                    </form>

                    {status && <p className="text-center text-white mt-4">{status}</p>}
                </div>
            </div>


        </div>
    );
};

export default ContactPage;
