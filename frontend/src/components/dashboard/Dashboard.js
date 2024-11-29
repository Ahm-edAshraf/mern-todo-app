import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  reorderTasks,
  getTaskAnalytics
} from '../../store/slices/taskSlice';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Box,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { toast } from 'react-toastify';

const TaskDialog = React.memo(({ open, onClose, task, onSave }) => {
  const [localTask, setLocalTask] = useState(task || {});

  useEffect(() => {
    // Initialize with proper date formats
    if (task) {
      setLocalTask({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
        reminder: {
          ...task.reminder,
          time: task.reminder?.time ? new Date(task.reminder.time).toISOString().slice(0, 16) : ''
        }
      });
    } else {
      setLocalTask({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        dueDate: '',
        reminder: {
          enabled: false,
          time: '',
          sent: false
        }
      });
    }
  }, [task]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setLocalTask(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleDateChange = useCallback((e) => {
    const { name, value } = e.target;
    try {
      // Ensure the date is valid
      if (!value) {
        setLocalTask(prev => ({
          ...prev,
          [name]: ''
        }));
        return;
      }

      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }

      setLocalTask(prev => ({
        ...prev,
        [name]: value
      }));

      // If reminder is enabled and no reminder time is set, set it to due date
      if (name === 'dueDate' && localTask.reminder?.enabled && !localTask.reminder.time) {
        setLocalTask(prev => ({
          ...prev,
          reminder: {
            ...prev.reminder,
            time: value
          }
        }));
      }
    } catch (error) {
      console.error('Date parsing error:', error);
      toast.error('Please enter a valid date and time');
    }
  }, [localTask.reminder?.enabled]);

  const handleReminderChange = useCallback((e) => {
    const { checked } = e.target;
    setLocalTask(prev => ({
      ...prev,
      reminder: {
        ...prev.reminder,
        enabled: checked,
        time: checked ? prev.dueDate || '' : '',
        sent: false
      }
    }));
  }, []);

  const handleReminderTimeChange = useCallback((e) => {
    const { value } = e.target;
    try {
      // Ensure the date is valid
      if (!value) {
        setLocalTask(prev => ({
          ...prev,
          reminder: {
            ...prev.reminder,
            time: ''
          }
        }));
        return;
      }

      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }

      setLocalTask(prev => ({
        ...prev,
        reminder: {
          ...prev.reminder,
          time: value,
          sent: false
        }
      }));
    } catch (error) {
      console.error('Date parsing error:', error);
      toast.error('Please enter a valid date and time');
    }
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    try {
      // Validate dates before submitting
      const formData = {
        ...localTask,
        dueDate: localTask.dueDate ? new Date(localTask.dueDate).toISOString() : null,
        reminder: {
          ...localTask.reminder,
          time: localTask.reminder?.time ? new Date(localTask.reminder.time).toISOString() : null
        }
      };

      // Validate reminder time is not before current time
      if (formData.reminder.enabled && formData.reminder.time) {
        const reminderTime = new Date(formData.reminder.time);
        if (reminderTime < new Date()) {
          toast.error('Reminder time must be in the future');
          return;
        }
      }

      // Validate reminder time is not after due date
      if (formData.reminder.enabled && formData.reminder.time && formData.dueDate) {
        const reminderTime = new Date(formData.reminder.time);
        const dueDate = new Date(formData.dueDate);
        if (reminderTime > dueDate) {
          toast.error('Reminder time must be before or equal to the due date');
          return;
        }
      }

      onSave(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Please check the date and time fields');
    }
  }, [localTask, onSave]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task?._id ? 'Edit Task' : 'Add New Task'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Title"
            fullWidth
            value={localTask.title || ''}
            onChange={handleChange}
            required
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={localTask.description || ''}
            onChange={handleChange}
          />
          <TextField
            select
            margin="dense"
            name="priority"
            label="Priority"
            fullWidth
            value={localTask.priority || 'medium'}
            onChange={handleChange}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            name="category"
            label="Category"
            fullWidth
            value={localTask.category || ''}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            type="datetime-local"
            name="dueDate"
            label="Due Date"
            fullWidth
            value={localTask.dueDate || ''}
            onChange={handleDateChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={localTask.reminder?.enabled || false}
                onChange={handleReminderChange}
                name="reminderEnabled"
              />
            }
            label="Enable Email Reminder"
          />
          {localTask.reminder?.enabled && (
            <TextField
              margin="dense"
              type="datetime-local"
              name="reminderTime"
              label="Reminder Time"
              fullWidth
              value={localTask.reminder?.time || ''}
              onChange={handleReminderTimeChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {task?._id ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
});

const Dashboard = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { tasks, loading, analytics } = useSelector(state => state.tasks);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getTasks());
    dispatch(getTaskAnalytics());
  }, [dispatch]);

  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newPosition = result.destination.index;

    dispatch(reorderTasks({ taskId, newPosition }));
  }, [dispatch]);

  const handleSaveTask = useCallback((taskData) => {
    if (taskData._id) {
      dispatch(updateTask({ id: taskData._id, taskData }))
        .unwrap()
        .then(() => {
          setOpenDialog(false);
          toast.success('Task updated successfully');
        })
        .catch((err) => toast.error(err.message));
    } else {
      dispatch(addTask(taskData))
        .unwrap()
        .then(() => {
          setOpenDialog(false);
          toast.success('Task added successfully');
        })
        .catch((err) => toast.error(err.message));
    }
  }, [dispatch]);

  const handleDeleteTask = useCallback((id) => {
    dispatch(deleteTask(id))
      .unwrap()
      .then(() => toast.success('Task deleted successfully'))
      .catch((err) => toast.error(err.message));
  }, [dispatch]);

  const handleStatusChange = useCallback((id, status) => {
    dispatch(updateTask({ id, taskData: { status } }));
  }, [dispatch]);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setCurrentTask(null);
  }, []);

  const handleOpenDialog = useCallback((task = null) => {
    setCurrentTask(task);
    setOpenDialog(true);
  }, []);

  const filteredTasks = tasks
    .filter(task => task.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(task => filterStatus === 'all' ? true : task.status === filterStatus);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">Tasks</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Task
              </Button>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Search tasks"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Filter by status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tasks">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  <AnimatePresence>
                    {filteredTasks.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided) => (
                          <motion.div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Paper
                              sx={{
                                p: 2,
                                mb: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton
                                  onClick={() => handleStatusChange(
                                    task._id,
                                    task.status === 'completed' ? 'pending' : 'completed'
                                  )}
                                >
                                  {task.status === 'completed' ? (
                                    <CheckCircleIcon color="success" />
                                  ) : (
                                    <UncheckedIcon />
                                  )}
                                </IconButton>
                                <Box sx={{ ml: 2 }}>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                                    }}
                                  >
                                    {task.title}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {task.description}
                                  </Typography>
                                  <Box sx={{ mt: 1 }}>
                                    <Chip
                                      label={task.priority}
                                      size="small"
                                      color={
                                        task.priority === 'high'
                                          ? 'error'
                                          : task.priority === 'medium'
                                          ? 'warning'
                                          : 'success'
                                      }
                                      sx={{ mr: 1 }}
                                    />
                                    {task.category && (
                                      <Chip
                                        label={task.category}
                                        size="small"
                                        variant="outlined"
                                        sx={{ mr: 1 }}
                                      />
                                    )}
                                    {task.dueDate && (
                                      <Chip
                                        label={new Date(task.dueDate).toLocaleString()}
                                        size="small"
                                        color="info"
                                        sx={{ mr: 1 }}
                                      />
                                    )}
                                    {task.reminder?.enabled && (
                                      <Chip
                                        label={`Reminder: ${new Date(task.reminder.time).toLocaleString()}`}
                                        size="small"
                                        color="secondary"
                                        sx={{ mr: 1 }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                              <Box>
                                <IconButton onClick={() => handleOpenDialog(task)}>
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  onClick={() => handleDeleteTask(task._id)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </Paper>
                          </motion.div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </AnimatePresence>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Grid>
      </Grid>

      <TaskDialog
        open={openDialog}
        onClose={handleCloseDialog}
        task={currentTask}
        onSave={handleSaveTask}
      />
    </Container>
  );
};

export default React.memo(Dashboard);
