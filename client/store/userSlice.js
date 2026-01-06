import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    name: "",
    role: "",
    roomId: "",
    joined: false
  },
  reducers: {
    setUser(state, action) {
      state.name = action.payload.name;
      state.role = action.payload.role;
      state.roomId = action.payload.roomId;
      state.joined = true;
    },
    resetUser(state) {
      state.name = "";
      state.role = "";
      state.roomId = "";
      state.joined = false;
    }
  }
});

export const { setUser, resetUser } = userSlice.actions;
export default userSlice.reducer;
