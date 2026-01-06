import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    name: "",
    role: "",
    joined: false
  },
  reducers: {
    setUser(state, action) {
      state.name = action.payload.name;
      state.role = action.payload.role;
      state.joined = true;
    },
    resetUser(state) {
      state.name = "";
      state.role = "";
      state.joined = false;
    }
  }
});

export const { setUser, resetUser } = userSlice.actions;
export default userSlice.reducer;
