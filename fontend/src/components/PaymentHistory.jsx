import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const PaymentHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false); // Modal nhập email
    const [showOtpModal, setShowOtpModal] = useState(false);     // Modal nhập OTP
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [reason, setReason] = useState("");
    const [otpEmail, setOtpEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPaymentHistory = async () => {
            setLoading(true);
            setError("");

            try {
                const user = JSON.parse(localStorage.getItem("user"));
                if (!user || !user.id) {
                    toast.error("Bạn chưa đăng nhập! Vui lòng đăng nhập để xem lịch sử thanh toán.", { position: "top-center" });
                    navigate("/login/user");
                    return;
                }

                const response = await axios.get("http://localhost:5000/api/payment-history", {
                    params: { user_id: user.id }
                });
                if (!response.data.success) throw new Error(response.data.message || "Lỗi khi lấy lịch sử thanh toán");
                setTransactions(response.data.transactions);
            } catch (err) {
                console.error("Lỗi khi lấy lịch sử thanh toán:", err);
                setError("Không thể tải lịch sử thanh toán! " + err.message);
            }

            setLoading(false);
        };

        fetchPaymentHistory();
    }, [navigate]);

    // Hàm xuất file Excel
    const exportToExcel = () => {
        if (transactions.length === 0) {
            toast.warning("Không có dữ liệu để xuất!", { position: "top-center" });
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(transactions.map(t => ({
            "Mã Giao Dịch": t.transaction_id,
            "Số Tiền (VND)": t.amount.toLocaleString(),
            "Số Diamonds": t.diamonds,
            "Trạng Thái": t.status === 'completed' ? 'Thành công' : t.status === 'pending' ? 'Chờ xử lý' : 'Thất bại',
            "Trạng Thái Hoàn Tiền": t.refund_status === 'PROCESSED' ? 'Đã hoàn tiền' : t.refund_status === 'PENDING' ? 'Đang chờ xử lý' : 'Chưa hoàn tiền',
            "Thời Gian": new Date(t.created_at).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Lịch Sử Thanh Toán");
        XLSX.writeFile(workbook, "Payment_History.xlsx");
        toast.success("Xuất file Excel thành công!", { position: "top-center" });
    };

    // Kiểm tra thời gian để hiển thị nút hoàn tiền
    const canRefund = (transaction) => {
        if (transaction.status !== 'completed' || transaction.refund_status === 'PROCESSED' || transaction.refund_status === 'PENDING') return false;
        const now = new Date();
        const createdAt = new Date(transaction.created_at);
        const diffMinutes = (now - createdAt) / (1000 * 60);
        return diffMinutes <= 60; // Chỉ hiển thị nếu trong 1 giờ
    };

    // Mở modal xác nhận
    const handleRefundClick = (transaction) => {
        setSelectedTransaction(transaction);
        setShowConfirmModal(true);
    };

    // Gửi yêu cầu hoàn tiền với lý do và email
    const handleConfirmRefund = async () => {
        if (!reason) {
            toast.error("Vui lòng nhập lý do hoàn tiền!", { position: "top-center" });
            return;
        }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Bạn chưa đăng nhập! Vui lòng đăng nhập để thực hiện hành động này.", { position: "top-center" });
                navigate("/login/user");
                return;
            }

            const response = await axios.post("http://localhost:5000/api/request-refund", {
                transaction_id: selectedTransaction.transaction_id,
                reason,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setShowConfirmModal(false);
                setShowEmailModal(true); // Chuyển sang nhập email
            }
        } catch (err) {
            toast.error("Lỗi khi gửi yêu cầu hoàn tiền: " + (err.response?.data?.message || err.message), { position: "top-center" });
        }
        setIsSubmitting(false);
    };

    // Gửi email để nhận OTP
    const handleEmailSubmit = async () => {
        if (!otpEmail) {
            toast.error("Vui lòng nhập email!", { position: "top-center" });
            return;
        }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post("http://localhost:5000/api/send-otp", {
                transaction_id: selectedTransaction.transaction_id,
                otp_email: otpEmail,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setShowEmailModal(false);
                setShowOtpModal(true); // Chuyển sang nhập OTP sau khi gửi email thành công
                toast.success("Mã OTP đã được gửi đến email của bạn!", { position: "top-center" });
            }
        } catch (err) {
            toast.error("Lỗi khi gửi email: " + (err.response?.data?.message || err.message), { position: "top-center" });
        }
        setIsSubmitting(false);
    };

    // Xác nhận OTP
    const handleOtpSubmit = async () => {
        if (!otp) {
            toast.error("Vui lòng nhập mã OTP!", { position: "top-center" });
            return;
        }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post("http://localhost:5000/api/verify-otp", {
                transaction_id: selectedTransaction.transaction_id,
                otp_email: otpEmail,
                otp,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setShowOtpModal(false);
                toast.success("Yêu cầu hoàn tiền đã được gửi đi, vui lòng chờ phản hồi!", { position: "top-center" });
                // Cập nhật trạng thái tạm thời trong frontend
                setTransactions(transactions.map(t =>
                    t.transaction_id === selectedTransaction.transaction_id
                        ? { ...t, refund_status: 'PENDING' }
                        : t
                ));
            }
        } catch (err) {
            toast.error("Lỗi khi xác nhận OTP: " + (err.response?.data?.message || err.message), { position: "top-center" });
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6" style={{ paddingTop: '100px' }}>
            <div className="max-w-5xl mx-auto relative">
                <button
                    onClick={exportToExcel}
                    className="absolute top-0 right-0 mt-4 mr-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Xuất Excel
                </button>

                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Lịch sử Thanh Toán</h1>

                {loading && (
                    <div className="text-center text-gray-600">
                        <p>Đang tải lịch sử thanh toán...</p>
                    </div>
                )}
                {error && (
                    <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {transactions.length === 0 && !loading && !error && (
                    <div className="text-center text-gray-600 bg-white p-6 rounded-lg shadow">
                        Bạn chưa có giao dịch nào.
                    </div>
                )}

                {transactions.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-700 bg-white shadow-md rounded-lg">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-3 px-4 border-b">Mã Giao Dịch</th>
                                    <th className="py-3 px-4 border-b">Số Tiền (VND)</th>
                                    <th className="py-3 px-4 border-b">Số Diamonds</th>
                                    <th className="py-3 px-4 border-b">Trạng Thái</th>
                                    <th className="py-3 px-4 border-b">Trạng Thái Hoàn Tiền</th>
                                    <th className="py-3 px-4 border-b">Thời Gian</th>
                                    <th className="py-3 px-4 border-b">Hành Động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => (
                                    <tr key={transaction.transaction_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 border-b">{transaction.transaction_id}</td>
                                        <td className="py-3 px-4 border-b">{transaction.amount.toLocaleString()}</td>
                                        <td className="py-3 px-4 border-b">{transaction.diamonds}</td>
                                        <td className="py-3 px-4 border-b">
                                            <span className={`px-2 py-1 rounded-full text-xs ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                {transaction.status === 'completed' ? 'Thành công' : transaction.status === 'pending' ? 'Chờ xử lý' : 'Thất bại'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 border-b">
                                            {transaction.refund_status === 'PROCESSED' ? (
                                                <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">Đã hoàn tiền</span>
                                            ) : transaction.refund_status === 'PENDING' ? (
                                                <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">Đang chờ xử lý</span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">Chưa hoàn tiền</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 border-b">
                                            {new Date(transaction.created_at).toLocaleString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="py-3 px-4 border-b">
                                            {canRefund(transaction) && (
                                                <button
                                                    onClick={() => handleRefundClick(transaction)}
                                                    className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
                                                >
                                                    Hoàn Tiền
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal xác nhận hoàn tiền */}
                {showConfirmModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Xác nhận hoàn tiền</h2>
                            <p className="text-gray-600 mb-4">Bạn có chắc chắn muốn hoàn tiền cho giao dịch <strong>{selectedTransaction.transaction_id}</strong>?</p>
                            <textarea
                                className="w-full p-2 border border-gray-300 rounded-md mb-4"
                                placeholder="Nhập lý do hoàn tiền"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                            <div className="flex justify-end gap-4">
                                <button
                                    className="bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400"
                                    onClick={() => setShowConfirmModal(false)}
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                                    onClick={handleConfirmRefund}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Đang gửi..." : "Xác nhận"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal nhập email */}
                {showEmailModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Nhập Email</h2>
                            <p className="text-gray-600 mb-4">Vui lòng nhập email để nhận mã OTP cho giao dịch <strong>{selectedTransaction.transaction_id}</strong>.</p>
                            <input
                                type="email"
                                className="w-full p-2 border border-gray-300 rounded-md mb-4"
                                placeholder="Nhập email để nhận OTP"
                                value={otpEmail}
                                onChange={(e) => setOtpEmail(e.target.value)}
                            />
                            <div className="flex justify-end gap-4">
                                <button
                                    className="bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400"
                                    onClick={() => setShowEmailModal(false)}
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                                    onClick={handleEmailSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Đang gửi..." : "Gửi OTP"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal nhập OTP */}
                {showOtpModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Xác nhận OTP</h2>
                            <p className="text-gray-600 mb-4">Vui lòng nhập mã OTP đã được gửi đến email <strong>{otpEmail}</strong> để xác nhận.</p>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-md mb-4"
                                placeholder="Nhập mã OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                            <div className="flex justify-end gap-4">
                                <button
                                    className="bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400"
                                    onClick={() => setShowOtpModal(false)}
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                                    onClick={handleOtpSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Đang xác nhận..." : "Xác nhận"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentHistory;