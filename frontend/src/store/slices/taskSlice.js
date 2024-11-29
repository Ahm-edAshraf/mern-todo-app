import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Get token from local storage and set axios defaults
const setAuthToken = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const getTasks = createAsyncThunk(
  'tasks/getTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/tasks`, setAuthToken());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const addTask = createAsyncThunk(
  'tasks/addTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/tasks`, taskData, setAuthToken());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, taskData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/tasks/${id}`, taskData, setAuthToken());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/tasks/${id}`, setAuthToken());
      return id;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const reorderTasks = createAsyncThunk(
  'tasks/reorderTasks',
  async ({ taskId, newPosition }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/tasks/reorder`,
        { taskId, newPosition },
        setAuthToken()
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

export const getTaskAnalytics = createAsyncThunk(
  'tasks/getAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/tasks/analytics`, setAuthToken());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

const initialState = {
  tasks: [],
  analytics: null,
  loading: false,
  error: null,
  currentTask: null
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setCurrentTask: (state, action) => {
      state.currentTask = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Tasks
      .addCase(getTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(getTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(getTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })
      // Add Task
      .addCase(addTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      // Update Task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      // Delete Task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(task => task._id !== action.payload);
      })
      // Reorder Tasks
      .addCase(reorderTasks.fulfilled, (state, action) => {
        state.tasks = action.payload;
      })
      // Get Analytics
      .addCase(getTaskAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      });
  }
});

export const { setCurrentTask, clearError } = taskSlice.actions;
export default taskSlice.reducer;
