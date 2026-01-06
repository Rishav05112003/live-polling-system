import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  poll: null,
  viewState: "WAITING", // WAITING | VOTING | RESULTS | KICKED
  timer: 0,
  liveResults: [],
  hasSubmitted: false,
};

const pollSlice = createSlice({
  name: "poll",
  initialState,
  reducers: {
    setActivePoll: (state, action) => {
      state.poll = action.payload.poll;
      state.timer = action.payload.timer;
      state.viewState = "VOTING";
      state.liveResults = [];
      state.hasSubmitted = false;
    },

    setTimer: (state, action) => {
      state.timer = action.payload;
    },

    updateResults: (state, action) => {
      state.liveResults = action.payload;
      state.viewState = "RESULTS";
    },

    markSubmitted: (state) => {
      state.hasSubmitted = true;
      state.viewState = "RESULTS";
    },

    endPoll: (state) => {
      state.poll = null;
      state.viewState = "WAITING";
      state.timer = 0;
      state.liveResults = [];
      state.hasSubmitted = false;
    },
  },
});

export const {
  setActivePoll,
  updateResults,
  setTimer,
  endPoll,
  markSubmitted,
} = pollSlice.actions;

export default pollSlice.reducer;
