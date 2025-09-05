require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const employeeRoutes = require('./routes/employees');
const taskRoutes = require('./routes/tasks');
const resultRoutes = require('./routes/results');
const orgRoutes = require('./routes/orgStructure');
const processRoutes = require('./routes/processes');
const instructionRoutes = require('./routes/instructions');
const telegramRoutes = require('./routes/telegram');

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/companies', companyRoutes);
app.use('/companies/:companyId/employees', employeeRoutes);
app.use('/companies/:companyId/tasks', taskRoutes);
app.use('/companies/:companyId/results', resultRoutes);
app.use('/companies/:companyId/org-structure', orgRoutes);
app.use('/processes', processRoutes);
app.use('/instructions', instructionRoutes);
app.use('/telegram', telegramRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
