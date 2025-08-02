import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    vi: {
        translation: {
            welcome: "Xin chào, Hải Đăng",
            history: "Lịch sử",
            create_content: "Tạo nội dung",
            rewrite_text: "Viết lại văn bản",
            summarize_text: "Tóm tắt văn bản",
            pending_content: "Xét duyệt nội dung",
            logout: "Đăng xuất",
            view_details: "Xem chi tiết",
        },
    },
    en: {
        translation: {
            welcome: "Hello, Hai Dang",
            history: "History",
            create_content: "Create Content",
            rewrite_text: "Rewrite Text",
            summarize_text: "Summarize Text",
            pending_content: "Review Content",
            logout: "Logout",
            view_details: "View Details",
        },
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'vi',
        supportedLngs: ['vi', 'en'],
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;