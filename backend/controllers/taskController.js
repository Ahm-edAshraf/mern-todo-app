const Task = require('../models/Task');
const { scheduleReminder } = require('../services/emailService');

// Get all tasks for a user
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id })
      .sort({ position: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new task
exports.createTask = async (req, res) => {
  try {
    console.log('\n📝 Creating new task:', req.body);

    // Ensure reminder time is set if reminder is enabled
    if (req.body.reminder?.enabled && !req.body.reminder?.time) {
      // Default to 1 hour before due date if no specific time is set
      const dueDate = new Date(req.body.dueDate);
      const reminderTime = new Date(dueDate.getTime() - 60 * 60 * 1000); // 1 hour before
      req.body.reminder.time = reminderTime;
      console.log('⏰ Set default reminder time:', reminderTime.toLocaleString());
    }

    const count = await Task.countDocuments({ user: req.user.id });
    const task = new Task({
      ...req.body,
      user: req.user.id,
      position: count
    });

    const savedTask = await task.save();
    console.log('💾 Task saved successfully:', {
      id: savedTask._id,
      title: savedTask.title,
      reminderEnabled: savedTask.reminder?.enabled,
      reminderTime: savedTask.reminder?.time
    });

    // Schedule reminder if enabled
    if (savedTask.reminder?.enabled) {
      console.log('🔔 Reminder enabled, scheduling...');
      await scheduleReminder(savedTask);
    } else {
      console.log('⏭️ No reminder to schedule');
    }

    res.status(201).json(savedTask);
  } catch (error) {
    console.error('❌ Error creating task:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update task fields
    Object.keys(req.body).forEach(key => {
      task[key] = req.body[key];
    });

    // If reminder is being updated, reset sent status
    if (req.body.reminder) {
      task.reminder.sent = false;
    }

    const updatedTask = await task.save();

    // Schedule reminder if enabled
    if (updatedTask.reminder && updatedTask.reminder.enabled) {
      await scheduleReminder(updatedTask);
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update positions of remaining tasks
    await Task.updateMany(
      { 
        user: req.user.id,
        position: { $gt: task.position }
      },
      { $inc: { position: -1 } }
    );

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reorder tasks
exports.reorderTasks = async (req, res) => {
  try {
    const { taskId, newPosition } = req.body;
    
    const task = await Task.findOne({
      _id: taskId,
      user: req.user.id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const oldPosition = task.position;

    if (newPosition > oldPosition) {
      await Task.updateMany(
        {
          user: req.user.id,
          position: { $gt: oldPosition, $lte: newPosition }
        },
        { $inc: { position: -1 } }
      );
    } else {
      await Task.updateMany(
        {
          user: req.user.id,
          position: { $gte: newPosition, $lt: oldPosition }
        },
        { $inc: { position: 1 } }
      );
    }

    task.position = newPosition;
    await task.save();

    const tasks = await Task.find({ user: req.user.id })
      .sort({ position: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
