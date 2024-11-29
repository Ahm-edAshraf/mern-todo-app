import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleDarkMode,
  toggleNotifications,
  setTheme,
  updateSettings
} from '../../store/slices/settingsSlice';
import {
  Container,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  TextField,
  MenuItem,
  Button
} from '@mui/material';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const Settings = () => {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.settings);

  const handleSaveSettings = () => {
    dispatch(updateSettings(settings))
      .unwrap()
      .then(() => toast.success('Settings updated successfully'))
      .catch((err) => toast.error(err.message));
  };

  return (
    <Container maxWidth="md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Settings
          </Typography>

          <Box sx={{ mt: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.darkMode}
                  onChange={() => dispatch(toggleDarkMode())}
                />
              }
              label="Dark Mode"
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notificationsEnabled}
                  onChange={() => dispatch(toggleNotifications())}
                />
              }
              label="Enable Notifications"
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <TextField
              select
              fullWidth
              label="Theme"
              value={settings.theme}
              onChange={(e) => dispatch(setTheme(e.target.value))}
            >
              <MenuItem value="purple">Purple</MenuItem>
              <MenuItem value="blue">Blue</MenuItem>
              <MenuItem value="green">Green</MenuItem>
              <MenuItem value="orange">Orange</MenuItem>
            </TextField>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              onClick={handleSaveSettings}
              fullWidth
            >
              Save Settings
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default Settings;
