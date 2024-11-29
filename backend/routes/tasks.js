const router = require('express').Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Get all tasks for a user
router.get('/', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id }).sort({ position: 1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new task
router.post('/', auth, async (req, res) => {
    try {
        const lastTask = await Task.findOne({ user: req.user.id }).sort({ position: -1 });
        const position = lastTask ? lastTask.position + 1 : 0;

        const newTask = new Task({
            ...req.body,
            user: req.user.id,
            position
        });

        const savedTask = await newTask.save();
        res.json(savedTask);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a task
router.put('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        Object.assign(task, req.body);
        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a task
router.delete('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Reorder remaining tasks
        await Task.updateMany(
            { user: req.user.id, position: { $gt: task.position } },
            { $inc: { position: -1 } }
        );

        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Reorder tasks
router.put('/reorder', auth, async (req, res) => {
    try {
        const { taskId, newPosition } = req.body;
        const task = await Task.findOne({ _id: taskId, user: req.user.id });
        
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

        const tasks = await Task.find({ user: req.user.id }).sort({ position: 1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get task analytics
router.get('/analytics', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id });
        
        const analytics = {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'completed').length,
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length,
            byCategory: {},
            byPriority: {
                high: tasks.filter(t => t.priority === 'high').length,
                medium: tasks.filter(t => t.priority === 'medium').length,
                low: tasks.filter(t => t.priority === 'low').length
            }
        };

        // Group by category
        tasks.forEach(task => {
            if (task.category) {
                analytics.byCategory[task.category] = (analytics.byCategory[task.category] || 0) + 1;
            }
        });

        res.json(analytics);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
