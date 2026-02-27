
import express from 'express';
const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Simple Phase 1 Auth
  if (username === 'admin' && password === 'password') {
    res.json({ token: 'demo-token-123', user: { id: 1, username: 'admin', role: 'admin' } });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

export default router;
