const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const Task = require('../models/Task');
const User = require('../models/User');

// Create a transporter using Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send reminder email
const sendReminderEmail = async (task, user) => {
  try {
    console.log('🔄 Attempting to send reminder email:', {
      taskTitle: task.title,
      userEmail: user.email,
      dueDate: task.dueDate
    });

    const transporter = createTransporter();
    const mailOptions = {
      from: `"Todo App" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: `Reminder: ${task.title} - Due Soon`,
      html: `
        <h2>Task Reminder</h2>
        <p>This is a reminder for your task:</p>
        <h3>${task.title}</h3>
        <p><strong>Description:</strong> ${task.description || 'No description'}</p>
        <p><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date'}</p>
        <p><strong>Priority:</strong> ${task.priority}</p>
        <p><strong>Category:</strong> ${task.category || 'No category'}</p>
        <p>Please complete this task before the due date.</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      response: info.response
    });

    // Update reminder sent status
    await Task.findByIdAndUpdate(task._id, {
      'reminder.sent': true
    });
    console.log('✅ Reminder marked as sent in database');

    return true; // Email sent successfully
  } catch (error) {
    console.error('❌ Error sending reminder email:', {
      error: error.message,
      code: error.code,
      command: error.command
    });
    return false; // Email failed to send
  }
};

// Check and schedule reminders
const checkAndScheduleReminders = async () => {
  try {
    console.log('\n⏰ Checking for pending reminders...');

    // Find tasks with reminders enabled but not sent
    const tasks = await Task.find({
      'reminder.enabled': true,
      'reminder.sent': false,
      'reminder.time': { $exists: true }
    }).populate('user');

    if (tasks.length > 0) {
      console.log(`📋 Found ${tasks.length} tasks with pending reminders`);
      
      for (const task of tasks) {
        const reminderTime = new Date(task.reminder.time);
        const now = new Date();
        
        // If reminder time is within the next 10 seconds
        if (reminderTime > now && reminderTime <= new Date(now.getTime() + 10000)) {
          console.log(`⏰ Processing reminder for task: ${task.title}`);
          const sent = await sendReminderEmail(task, task.user);
          if (sent) {
            console.log(`✅ Reminder successfully processed for: ${task.title}`);
          } else {
            console.log(`❌ Failed to process reminder for: ${task.title}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking reminders:', error);
  }
};

// Initialize reminder system
const initializeReminders = async () => {
  console.log('🚀 Initializing reminder system...');
  
  try {
    // Test email configuration
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration verified successfully');
    
    // Start checking for reminders
    checkAndScheduleReminders();
    setInterval(checkAndScheduleReminders, 10000);
    
    console.log('✅ Reminder system initialized - checking every 10 seconds');
  } catch (error) {
    console.error('❌ Failed to initialize reminder system:', error);
  }
};

module.exports = {
  initializeReminders,
  sendReminderEmail
};
