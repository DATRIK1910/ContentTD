import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import i18n from 'i18next';
import { setLanguage } from '../store/languageSlice';

const LanguageSync = () => {
    const dispatch = useDispatch();
    const currentLanguage = useSelector((state) => state.language.currentLanguage);

    useEffect(() => {
        // Đồng bộ ngôn ngữ từ i18next với Redux khi khởi tạo
        const savedLanguage = i18n.language || 'vi';
        dispatch(setLanguage(savedLanguage));
    }, [dispatch]);

    useEffect(() => {
        // Khi ngôn ngữ trong Redux thay đổi, cập nhật i18next
        i18n.changeLanguage(currentLanguage);
    }, [currentLanguage]);

    return null; // Không cần render gì
};

export default LanguageSync;