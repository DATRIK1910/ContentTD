const axios = require("axios");
const config = require("../config");  // Đảm bảo đường dẫn đúng

console.log("AI Key from controller:", config.AI21_API_KEY);

const callJambaAI = async (req, res) => {
    try {
        const response = await axios.post(
            "https://api.ai21.com/studio/v1/jamba-instruct/complete",
            {
                prompt: "Viết một đoạn mô tả sản phẩm hấp dẫn về laptop gaming.",
                numResults: 1,
                maxTokens: 150,
                temperature: 0.7,
                topP: 1,
            },
            {
                headers: {
                    Authorization: `Bearer 7LZDatvcoRIhUDxAhgJdVNmtkm6U0T14`,
                    "Content-Type": "application/json",
                },
            }
        );

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { callJambaAI };
