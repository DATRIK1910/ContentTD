const express = require('express');
const router = express.Router();
const SerpApi = require('serpapi');
const config = require('../configg'); // Import file config

// Đặt API Key từ file config
SerpApi.api_key = config.serpapi.apiKey;

router.get('/suggest-keywords', async (req, res) => {
    const topic = req.query.topic;
    console.log('Received topic:', topic);
    if (!topic) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập chủ đề!' });
    }

    try {
        const params = {
            engine: 'google',
            q: topic,
            num: 10,
            hl: 'vi',
            gl: 'vn',
            google_domain: 'google.com.vn'
        };

        console.log('Sending request to SerpAPI with params:', params);
        const response = await SerpApi.getJson(params);
        console.log('SerpAPI response:', response);
        const results = response.suggested_searches || [];
        const keywords = results.map(item => item.query || item.name).filter(Boolean).slice(0, 5);

        if (keywords.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy gợi ý từ khóa!' });
        }

        res.json({ success: true, keywords });
    } catch (error) {
        console.error('❌ Lỗi khi lấy gợi ý từ khóa:', error);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
    }
});

module.exports = router;