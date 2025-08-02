import React from "react";
import { Link } from "react-router-dom";

const NewsPage = () => {
    const articles = [
        {
            id: 1,
            title: "Top 18 công cụ AI viết content: Dành riêng cho dân viết lách!",
            description: `
        Trong bài này tôi sẽ không chỉ chia sẻ những công cụ AI viết content mà còn có cả các công cụ AI giúp nghiên cứu từ khóa (SEO AI),
         nghiên cứu ý tưởng nội dung, công cụ AI viết tiêu đề, tạo hình ảnh video…
      `,
            content: `
        Nội dung chi tiết:
        Tập TH BOOK được sản xuất từ chất liệu giấy cao cấp, đảm bảo không lem mực. 
        Ngoài ra, mẫu mã đa dạng từ dòng sản phẩm học sinh đến văn phòng, phù hợp với nhiều nhu cầu sử dụng.
        Đặc điểm nổi bật:
        - Chất lượng giấy trắng sáng, không gây mỏi mắt.
        - Giá thành hợp lý, phù hợp cho mọi đối tượng.
        - Sản phẩm thân thiện với môi trường.
      `,
            image: "https://ngocdenroi.com/wp-content/uploads/2023/04/cong-cu-ai-viet-content.png.webp",
        },
        {
            id: 2,
            title: "Blogger nên sử dụng AI như thế nào?",
            description: `
        2023 là năm của AI. Nhiều blogger cũng muốn sử dụng chúng để hỗ trợ viết bài nhanh hơn. Các câu hỏi như Blogger nên sử dụng AI như thế nào? Liên tục được đặt ra.
      `,
            content: `
        Giấy bìa cứng thường được sử dụng trong các công việc như đóng bìa tài liệu, làm thiệp chúc mừng và các dự án thủ công khác.
        Với sự đa dạng về kích thước, giấy bìa màu cung cấp nhiều lựa chọn cho người dùng, từ A4 đến khổ lớn hơn.
      `,
            image: "https://bizflyportal.mediacdn.vn/bizflyportal/images/blogger-nen-su-dung-ai-nhu-the-nao-bizfly-001-17055425194771.png",
        },
        {
            id: 3,
            title: "7 cách dùng AI viết content chuyên nghiệp, ấn tượng lên Top 100%",
            description: `
       Việc dùng AI viết content đang trở thành một xu hướng ngày càng phổ biến trong thời đại số hiện nay.
        Vậy làm thế nào để tận dụng sức mạnh của AI để tạo ra những nội dung chuyên nghiệp, ấn tượng và đạt hiệu quả SEO top 100%? Hãy cùng khám phá bài viết của SEONGON để tìm kiếm câu trả lời nhé!
      `,
            content: `
        Văn phòng phẩm làm từ thiện cần được đảm bảo :
         ♦ Giá rẻ.
         ♦ Hàng phổ thông nhưng chất lượng tốt. 
         ♦ Giấy trắng, không nhòe, không thấm mực.
         ♦ Đa dạng nhiều loại để lựa chọn: các loại vở ô ly, vở kẻ ngang, bút viết, thước kẻ, tẩy, hộp bút...
      `,
            image: "https://seongon.com/wp-content/uploads/2025/03/ai-tao-ra-noi-dung-bang-cach-phan-tich-va-rut-ra-kien-thuc-tu-luong-du-lieu-khong-lo.jpg",
        },
        {
            id: 4,
            title: "Viết Blog với AI: từ Lý thuyết đến Thực hành",
            description: `
        Bạn thắc mắc, và mong muốn có thể viết blog được như vậy (cho cá nhân hoặc cho doanh nghiệp của bạn).
      `,
            content: `
        Văn phòng phẩm DTM sẽ giúp các bậc phụ huynh thống kê những khoản cần chi cho năm học mới này.
      `,
            image: "https://th.bing.com/th/id/OIP.1idVOjTL5DYn64TRx_O53wHaEK?rs=1&pid=ImgDetMain",
        },
        {
            id: 5,
            title: "Cách Viết Bài Blog SEO dưới 10 phút (Với AI)",
            description: `
        Trong thế giới tiếp thị kỹ thuật số đầy tốc độ, tốc độ là yếu tố quan trọng. Viết bài blog nhanh chóng và hiệu quả có thể tạo ra sự khác biệt giữa việc dẫn đầu và tụt lại phía sau so với đối thủ cạnh tranh.
      `,
            content: `
        Ngoài ra, các loại đồ dùng học tập, văn phòng phẩm có mùi thơm khiến nhiều người hay bị nhạy cảm với mùi xuất hiện tình trạng dị ứng mùi không thể chịu nổi, nhẹ thì nổi mẩn ngứa, nặng hơn thì suy hô hấp ảnh hưởng nghiêm trọng đến tính mạng. Tuy nhiên, vẫn không ít phụ huynh và học sinh rất thích chúng mà không thể quan tâm nhà sản xuất đã sử dụng những loại hóa chất nào có ảnh hưởng gì đến sức khỏe không?
      `,
            image: "https://th.bing.com/th/id/OIP.hBeNJ1YcnnngaguAA2jKfwHaDt?rs=1&pid=ImgDetMain",
        },
        {
            id: 6,
            title: "Blog là gì? Cách viết blog cá nhân đơn giản cho người mới",
            description: `
        Blog là một trong những nền tảng được nhiều người quan tâm đến, đây là kênh để chia sẻ kiến thức, kinh nghiệm, xây dựng thương hiệu và kết nối cộng đồng một cách hiệu quả.
      `,
            content: `
        Thị trường kinh doanh văn phòng phẩm như một cuộc chạy đua âm thầm nhưng đầy cạnh tranh, bên cạnh các cửa hàng, đại lý văn phòng phẩm, nhà sách mới bắt đầu thâm nhập thị trường, nhiều cửa hàng cũ đã đầu tư mở rộng mặt bằng kinh doanh, sửa sang lại quầy hàng, tăng cường chủng loại, đa dạng mẫu mã hàng hóa... cũng như dịch vụ phục vụ để tăng tính cạnh tranh so với đối thủ.
      `,
            image: "https://gtvseo.com/wp-content/uploads/2024/05/blog-la-gi.jpg",
        },
    ];

    const truncateText = (text, limit) => {
        if (text.length > limit) {
            return text.slice(0, limit) + "...";
        }
        return text;
    };

    return (
        <div className="min-h-screen bg-gray-100 py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Tiêu đề trang */}
                <h2 className="text-4xl font-bold text-gray-800 mb-10 text-center">
                    TIN TỨC
                </h2>

                {/* Grid bài viết */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map((article) => (
                        <div
                            key={article.id}
                            className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-xl"
                        >
                            {/* Hình ảnh */}
                            <img
                                src={article.image}
                                alt={article.title}
                                className="w-full h-48 object-cover"
                            />

                            {/* Nội dung bài viết */}
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-800 mb-3 line-clamp-2">
                                    {article.title}
                                </h3>
                                <p className="text-gray-600 mb-4 line-clamp-3">
                                    {truncateText(article.description, 100)}
                                </p>
                                <Link
                                    to={`/news/${article.id}`}
                                    className="inline-block text-blue-600 font-medium hover:text-blue-800 transition-colors"
                                >
                                    Xem chi tiết →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NewsPage;