const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function getTokenFromHeader(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

function authenticateUser(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.get('/api/health', async (req, res) => {
  try {
    await prisma.user.count();
    res.json({
      message: 'DailyFlow API is running',
      status: 'ok',
    });
  } catch (error) {
    res.json({
      message: 'DailyFlow API is running',
      status: 'ok',
      warning: 'Database not migrated yet',
    });
  }
});

//Endpoint for sign up a new user
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: 'Name, email, and password are required' });
  }
  const existUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existUser) {
    return res
      .status(400)
      .json({ message: 'User with this email already exists' });
  }
  const hasgedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hasgedPassword,
    },
  });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

//Endpoint for login in
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const findUser = await prisma.user.findUnique({
    where: { email },
  });
  if (!findUser)
    return res.status(400).json({ message: 'Invalid email or password' });

  const isValidPassword = await bcrypt.compare(password, findUser.password);

  if (!isValidPassword) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: findUser.id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  return res.status(200).json({
    token,
    user: {
      id: findUser.id,
      name: findUser.name,
      email: findUser.email,
    },
  });
});

//Post /api/tasks endpoint
app.post('/api/tasks', authenticateUser, async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      userId: req.user.id,
    },
  });
  res.status(201).json({ task });
});

//GET /api/task endpoint
app.get('/api/tasks', authenticateUser, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

//PUT /api/tasks/:id endpoint
app.put('/api/tasks/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { title, description, completed } = req.body;

  const existingTask = await prisma.task.findUnique({
    where: { id },
  });

  if (!existingTask || existingTask.userId !== req.user.id) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      title,
      description,
      completed,
    },
  });
  res.json({ task: updatedTask });
});

//DELETE /api/tasks/:id endpoint
app.delete('/api/tasks/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;

  const existingTask = await prisma.task.findUnique({
    where: { id },
  });

  if (!existingTask || existingTask.userId !== req.user.id) {
    return res.status(404).json({ message: 'Task not found' });
  }
  await prisma.task.delete({
    where: { id },
  });

  res.json({ message: 'Task deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`DailyFlow server running on http://localhost:${PORT}`);
});
