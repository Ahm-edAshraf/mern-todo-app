const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get user settings
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('settings');
        res.json(user.settings);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user settings
router.put('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.settings = { ...user.settings, ...req.body };
        await user.save();
        res.json(user.settings);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
