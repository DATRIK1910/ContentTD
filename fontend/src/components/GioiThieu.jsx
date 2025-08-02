import React from "react";
import "./tailwind.css"

const Introduction = () => {
    return (
        <section className="bg-gray-100">
            <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
                    {/* Phần giới thiệu bên trái */}
                    <div className="max-w-lg">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">GIỚI THIỆU</h2>
                        <p className="mt-4 text-gray-600 text-lg">
                            Cửa hàng <strong>VĂN PHÒNG PHẨM HGM</strong> được thành lập bằng niềm đam mê của tuổi trẻ, nghị lực và quyết tâm mang đến cho những khách hàng của mình những sản phẩm văn phòng phẩm giá rẻ cùng với chất lượng được đảm bảo tốt nhất. Có thể nói đó là mục tiêu và cũng là kết quả đã làm được của văn phòng phẩm HGM.
                        </p>
                        <p className="mt-4 text-gray-600 text-lg">
                            Một trong những nguyên nhân giúp Văn phòng phẩm HGM lớn mạnh như hiện nay đó chính là những hiểu biết chuyên sâu về môi trường văn phòng, công sở.
                        </p>
                        <p className="mt-4 text-gray-600 text-lg">
                            Xuất phát từ một nhân viên văn phòng, người sáng lập ra Văn phòng phẩm HGM thấu hiểu mọi yêu cầu và mong muốn về các dụng cụ văn phòng phẩm tiện ích và chất lượng tốt.
                        </p>
                        <p className="mt-4 text-indigo-700 font-bold text-lg">
                            “<span className="highlight">NHANH NHẤT – CHẤT LƯỢNG NHẤT – TIẾT KIỆM NHẤT</span>”.
                        </p>
                        <p className="mt-4 text-gray-600 text-lg">
                            Với triết lý kinh doanh này, <strong>HGM</strong> đã trở thành địa chỉ cung ứng văn phòng phẩm trực tiếp với giá cả rẻ nhất cùng chất lượng tốt trong lĩnh vực văn phòng phẩm giá rẻ tại Tp.HCM.
                        </p>
                        <div className="mt-8">
                            <a href="#" className="text-blue-500 hover:text-blue-600 font-medium">
                                Tìm hiểu thêm về chúng tôi <span className="ml-2">&#8594;</span>
                            </a>
                        </div>
                    </div>

                    {/* Phần hình ảnh bên phải */}
                    <div className="mt-12 md:mt-0">
                        <img
                            src="https://images.unsplash.com/photo-1531973576160-7125cd663d86"
                            alt="Về chúng tôi"
                            className="object-cover rounded-lg shadow-md"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Introduction;
