import React from "react";
import { useNavigate } from "react-router-dom";

const ContentCreationPage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center p-6 mt-24">
            <h1 className="text-2xl font-bold mb-6">Tạo nội dung</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-md text-center">
                    <h2 className="text-lg font-semibold">Viết bài linh hoạt</h2>
                    <p className="text-gray-600">
                        Viết bài theo đa dạng chủ đề, từ khóa, thể loại (quảng cáo, blog,...).
                    </p>
                    <button
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        onClick={() => navigate("/viet-bai-linh-hoat")}
                    >
                        Bắt đầu
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ContentCreationPage;
