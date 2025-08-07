import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { ipBE } from "../data/consts";

const PaymentHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
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

                const response = await axios.get(ipBE + "api/payment-history", {
                    params: { user_id: user.id }
                });
                if (!response.data.success) throw new Error(response.data.message || "Lỗi khi lấy lịch sử thanh toán");
                setTransactions(response.data.transactions);
            } catch (err) {
                console.error(" Lỗi khi lấy lịch sử thanh toán:", err);
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
                                    <th className="py-3 px-4 border-b">Thời Gian</th>
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
                                            {new Date(transaction.created_at).toLocaleString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentHistory;