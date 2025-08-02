import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState: {
        user: null, // Lưu trữ thông tin người dùng
    },
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload; // Cập nhật thông tin người dùng từ action
        },
        clearUser: (state) => {
            state.user = null; // Xóa thông tin người dùng khi logout
        },
    },
});

export const { setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;
