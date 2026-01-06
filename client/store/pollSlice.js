import { createSlice } from "@reduxjs/toolkit";

const pollSlice = createSlice({
  name: "poll",
  initialState: {
    poll: null,
    liveResults: [],
    viewState: "WAITING",
    timer: 0
  },
  reducers: {
    setActivePoll(state, action) {
      state.poll = action.payload.poll;
      state.timer = action.payload.timer;
      state.viewState = "VOTING";
      state.liveResults = [];
    },
    updateResults(state, action) {
      state.liveResults = action.payload;
      state.viewState = "RESULTS";
    },
    setTimer(state, action) {
      state.timer = action.payload;
    },
    endPoll(state) {
      state.poll = null;
      state.viewState = "WAITING";
      state.liveResults = [];
    }
  }
});

export const { 
  setActivePoll,
  updateResults,
  setTimer,
  endPoll
} = pollSlice.actions;

export default pollSlice.reducer;
