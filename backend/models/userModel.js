

const checkAndDeductDiamonds = async (userId, action) => {
    const [rows] = await db.query('SELECT diamonds FROM users WHERE id = ?', [userId]);
    if (!rows || rows.length === 0) {
        throw new Error("Không tìm thấy người dùng hoặc không đủ kim cương.");
    }
    const user = rows[0];
    if (user.diamonds < 5) {
        throw new Error("Không đủ kim cương. Vui lòng mua thêm!");
    }
    await db.query('UPDATE users SET diamonds = diamonds - 5 WHERE id = ?', [userId]);
    return true;
};

const addDiamonds = async (userId, diamonds) => {
    await db.query('UPDATE users SET diamonds = diamonds + ? WHERE id = ?', [diamonds, userId]);
};

const getUserDiamonds = async (userId) => {
    const [rows] = await db.query('SELECT diamonds FROM users WHERE id = ?', [userId]);
    if (!rows || rows.length === 0) {
        throw new Error("Không tìm thấy người dùng.");
    }
    return rows[0].diamonds;
};

module.exports = { checkAndDeductDiamonds, addDiamonds, getUserDiamonds };