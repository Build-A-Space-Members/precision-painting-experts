const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'services.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// Handle contact form submission
app.post('/contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  // In a real application, you would send an email or save to database
  console.log('Contact form submission:', { name, email, phone, message });
  res.redirect('/contact?success=true');
});

// Start server
app.listen(PORT, () => {
  console.log(`Precision Painting Experts website running on http://localhost:${PORT}`);
});
