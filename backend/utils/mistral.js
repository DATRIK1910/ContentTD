const axios = require("axios");
const config = require("../configg");
const configg = require("../configg");

async function generateContent(prompt, maxTokens) {
    const response = await axios.post(
        "https://api.mistral.ai/v1/chat/completions",
        {
            model: "mistral-small",
            messages: [{ role: "system", content: prompt }],
            max_tokens: maxTokens,
            temperature: 0.7,
        },
        { headers: { Authorization: `Bearer ${configg.mistral.apiKey}` }, timeout: 30000 }
    );
    return response.data.choices[0].message.content.trim();
}

async function rewriteText(text, language = "vi") {
    const languagePrompt = language === "vi" ? "Viết lại bằng tiếng Việt tự nhiên:" : "Rewrite in natural English:";
    const prompt = `${languagePrompt}\n\n${text}`;
    const response = await axios.post(
        "https://api.mistral.ai/v1/chat/completions",
        {
            model: "mistral-small",
            messages: [{ role: "system", content: prompt }],
            max_tokens: 1000,
            temperature: 0.7,
        },
        { headers: { Authorization: `Bearer ${configg.mistral.apiKey}` }, timeout: 30000 }
    );
    return response.data.choices[0].message.content.trim();
}

async function summarizeText(text) {
    const prompt = `
    Tóm tắt đoạn văn bản sau bằng tiếng Việt thành 3-5 câu, giữ lại ý chính và loại bỏ chi tiết không cần thiết.
    Văn bản: "${text}"
  `;
    const response = await axios.post(
        "https://api.mistral.ai/v1/chat/completions",
        {
            model: "mistral-small",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
            temperature: 0.7,
        },
        { headers: { Authorization: `Bearer ${configg.mistral.apiKey}` }, timeout: 60000 }
    );
    return response.data.choices[0].message.content.trim();
}

module.exports = { generateContent, rewriteText, summarizeText };