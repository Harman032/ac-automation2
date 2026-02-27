
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import complianceRoutes from './routes/compliance.js';
import statementRoutes from './routes/statements.js';
import dashboardRoutes from './routes/dashboard.js';
import accountantRoutes from './routes/accountants.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/statements', statementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/accountants', accountantRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
