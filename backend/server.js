require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Task = require('./models/Task');
const auth = require('./middleware/auth');
const cache = require('./cache');
const taskEvents = require('./listeners'); // Registers task-created, task-deleted, and error listeners
const { validateTask, validateRegister, validateLogin } = require('./middleware/validate');
const { generateTaskDescription } = require('./aiService');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task_manager_24cs048';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_24cs048_manav_practical10';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const CACHE_TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS || '60', 10);



// ==========================================
// 1. Connect to MongoDB using Mongoose
// ==========================================
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log(`=========================================`);
    console.log(`MongoDB connected successfully`);
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`=========================================`);
    await seedDemoUserAndTasks();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

// Seed default demo student user & tasks for instant verification
async function seedDemoUserAndTasks() {
  try {
    let demoUser = await User.findOne({ email: '24cs048@charusat.edu.in' });
    if (!demoUser) {
      console.log('Creating default demo user for Practical 7...');
      demoUser = await User.create({
        name: 'Manav Lathiya',
        email: '24cs048@charusat.edu.in',
        password: 'password123',
      });
      console.log('Demo user created: 24cs048@charusat.edu.in / password123');
    }

    const taskCount = await Task.countDocuments({ user: demoUser._id });
    if (taskCount === 0) {
      console.log('Seeding initial authenticated tasks...');
      await Task.insertMany([
        {
          title: 'Implement JWT Authentication & User Model',
          description: 'Hash passwords with bcrypt and sign JWT tokens with 1h expiration',
          completed: true,
          priority: 'high',
          category: 'Practical 7',
          user: demoUser._id,
        },
        {
          title: 'Protect Task Routes with Auth Middleware',
          description: 'Verify Authorization Bearer token and inject req.user into request context',
          completed: true,
          priority: 'high',
          category: 'Practical 7',
          user: demoUser._id,
        },
        {
          title: 'Add Server-Side Input Validation Pipeline',
          description: 'Intercept malformed payloads before database operations',
          completed: false,
          priority: 'medium',
          category: 'Validation',
          user: demoUser._id,
        },
      ]);
      console.log('Authenticated tasks seeded successfully!');
    }
  } catch (err) {
    console.error('Error seeding demo user/tasks:', err.message);
  }
}

// ==========================================
// 2. Global Middleware Pipeline
// ==========================================
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Route-specific ObjectId validator
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format: Expected 24-character hexadecimal MongoDB ObjectId',
    });
  }
  next();
};

// ==========================================
// 3. Authentication Routes
// ==========================================

// POST /register - Register a new user with hashed password
app.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Registration Error: An account with this email already exists',
      });
    }

    // User.create automatically hashes password via pre-save hook
    const user = await User.create({ name, email, password });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
});

// POST /login - Authenticate user, compare bcrypt password hash, and return JWT
app.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Credentials: No account found with this email',
      });
    }

    // Compare plain password against bcrypt hash in database
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Credentials: Password is incorrect',
      });
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
});

// GET /me - Supplementary Problem 1: Return currently logged-in user details
app.get('/me', auth, async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized user profile retrieved from decoded JWT',
    user: req.user,
  });
});

// ==========================================
// 4. Protected Task Routes with In-Memory Caching (Practical 9)
// ==========================================

// Helper: Helper to invalidate all cached queries for a user
function invalidateUserTasksCache(userId, taskId = null) {
  const allKeys = cache.keys();
  const keysToDelete = allKeys.filter(
    (k) => k.startsWith(`tasks_${userId}`) || k === 'all_tasks'
  );

  if (taskId) {
    keysToDelete.push(`task_${taskId}`);
  }

  if (keysToDelete.length > 0) {
    cache.del(keysToDelete);
    console.log(`[Cache Invalidation] Cleared ${keysToDelete.length} key(s):`, keysToDelete);
  }
}

// GET /tasks/cache-stats - Supplementary Problem 2: Debug endpoint exposing cache hits/misses
app.get('/tasks/cache-stats', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Node-cache in-memory statistics (Practical 9)',
    stats: cache.getStats(),
  });
});

// POST /tasks/cache-flush - Clear in-memory cache for benchmarking
app.post('/tasks/cache-flush', (req, res) => {
  cache.flush();
  res.status(200).json({
    success: true,
    message: 'In-memory cache flushed successfully',
    stats: cache.getStats(),
  });
});

// GET /tasks - Fetch user's tasks with in-memory caching (60s TTL)
app.get('/tasks', auth, async (req, res, next) => {
  const startTime = process.hrtime.bigint();
  try {
    const { completed, priority, search } = req.query;
    
    // Stable cache key incorporating user ID and query parameters
    const queryString = Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : 'all';
    const cacheKey = `tasks_${req.user._id}_${queryString}`;

    // 1. Check in-memory cache first (node-cache)
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);

      return res.status(200).json({
        ...cachedData,
        cacheStatus: 'HIT',
        responseTimeMs: parseFloat(durationMs.toFixed(2)),
        ttlRemainingSeconds: CACHE_TTL_SECONDS,
      });
    }

    // 2. Cache MISS -> Query MongoDB database
    const filter = { user: req.user._id };

    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }

    if (priority) {
      filter.priority = priority.toLowerCase();
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    const responsePayload = {
      success: true,
      count: tasks.length,
      data: tasks,
    };

    // 3. Store query result in cache with 60-second TTL
    cache.set(cacheKey, responsePayload, CACHE_TTL_SECONDS);

    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);

    res.status(200).json({
      ...responsePayload,
      cacheStatus: 'MISS',
      responseTimeMs: parseFloat(durationMs.toFixed(2)),
      ttlRemainingSeconds: CACHE_TTL_SECONDS,
    });
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id - Supplementary Problem 1: Cache single-task endpoint separately
app.get('/tasks/:id', auth, validateObjectId, async (req, res, next) => {
  const startTime = process.hrtime.bigint();
  try {
    const singleCacheKey = `task_${req.params.id}`;

    // Check cache for single task
    const cachedTask = cache.get(singleCacheKey);
    if (cachedTask) {
      const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);

      return res.status(200).json({
        success: true,
        data: cachedTask,
        cacheStatus: 'HIT',
        responseTimeMs: parseFloat(durationMs.toFixed(2)),
      });
    }

    // Cache MISS -> Query MongoDB
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task not found with ID ${req.params.id}`,
      });
    }

    // Store in cache
    cache.set(singleCacheKey, task, CACHE_TTL_SECONDS);

    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);

    res.status(200).json({
      success: true,
      data: task,
      cacheStatus: 'MISS',
      responseTimeMs: parseFloat(durationMs.toFixed(2)),
    });
  } catch (err) {
    next(err);
  }
});

// POST /tasks - Create task & emit task-created event asynchronously (Practical 10)
app.post('/tasks', auth, validateTask, async (req, res, next) => {
  try {
    const newTask = await Task.create({
      ...req.body,
      user: req.user._id,
    });

    // Invalidate cached task lists so stale data is never returned
    invalidateUserTasksCache(req.user._id);

    // Record response timestamp
    const apiResponseTimestamp = new Date().toISOString();
    console.log(`[API Response] Task created & HTTP 201 sent to client at: ${apiResponseTimestamp}`);

    // Respond immediately to the client BEFORE the background listener finishes executing!
    res.status(201).json({
      success: true,
      message: 'Task created successfully in MongoDB (HTTP 201 returned immediately)',
      data: newTask,
      apiResponseTimestamp,
    });

    // Emit event asynchronously to background notification worker
    // Notice: emit() is placed after the response logic is queued/sent
    taskEvents.emit('task-created', newTask);
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:id - Update task & invalidate cache
app.put('/tasks/:id', auth, validateObjectId, async (req, res, next) => {
  try {
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        error: `Task not found with ID ${req.params.id}`,
      });
    }

    // Invalidate both the single-task cache and list cache
    invalidateUserTasksCache(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully (Cache invalidated)',
      data: updatedTask,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id - Delete task & emit task-deleted event (Supplementary Problem 1)
app.delete('/tasks/:id', auth, validateObjectId, async (req, res, next) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        error: `Task not found with ID ${req.params.id}`,
      });
    }

    // Invalidate both the single-task cache and list cache
    invalidateUserTasksCache(req.user._id, req.params.id);

    const apiResponseTimestamp = new Date().toISOString();
    console.log(`[API Response] Task deleted & HTTP 200 sent to client at: ${apiResponseTimestamp}`);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully from MongoDB',
      data: deletedTask,
      apiResponseTimestamp,
    });

    // Emit task-deleted event to audit listener
    taskEvents.emit('task-deleted', deletedTask);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 5. EventEmitter Debug & Observability Routes (Practical 10)
// ==========================================

// GET /events/history - Expose event log stream for testing and frontend dashboard
app.get('/events/history', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EventEmitter event history (Practical 10)',
    history: taskEvents.getHistory(),
    stats: taskEvents.getStats(),
  });
});

// GET /events/stats - Expose event statistics
app.get('/events/stats', (req, res) => {
  res.status(200).json({
    success: true,
    stats: taskEvents.getStats(),
  });
});

// POST /events/simulate-error - Supplementary Problem 2 test trigger
app.post('/events/simulate-error', (req, res) => {
  const errorMsg = req.body.message || 'Simulated background listener exception for testing';
  taskEvents.emit('error', new Error(errorMsg));
  res.status(200).json({
    success: true,
    message: 'Error event emitted and caught by error listener without crashing server',
  });
});

// ==========================================
// Practical 13: AI API Integration Route
// Google Gemini API with Graceful Degradation
// ==========================================

const handleAIGenerate = async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Task title is required to generate AI suggestion',
    });
  }

  // Rate limiting key: custom client ID, authenticated user ID, or client IP
  const clientId = req.headers['x-client-id']
    || (req.headers['authorization'] ? req.headers['authorization'].slice(-12) : null)
    || req.ip
    || 'client-ip';

  try {
    const aiResponse = await generateTaskDescription(title, clientId);
    if (aiResponse.rateLimited) {
      return res.status(429).json(aiResponse);
    }
    // Return 200 with AI output or graceful fallback
    return res.status(200).json(aiResponse);
  } catch (err) {
    console.error('[AI Route Error]', err.message);
    // Graceful degradation: never crash, return fallback template
    return res.status(200).json({
      success: true,
      title: title.trim(),
      description: `[Template] Plan and execute the implementation of: ${title}. Verify test cases and document progress.`,
      suggestedPriority: 'medium',
      estimatedTime: '1-2 days',
      provider: 'Server Local Fallback (Graceful Degradation)',
      isAIGenerated: false,
      fallback: true,
      error: err.message,
      disclaimer: 'Offline template suggestion. The AI service is currently degraded, but task creation remains fully operational.',
    });
  }
};

// Route as prescribed in syllabus Step 3
app.post('/api/ai/generate-description', handleAIGenerate);
// Route alias for task manager
app.post('/tasks/ai-generate', handleAIGenerate);

// GET /health - Container Health Check Endpoint
app.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'task_manager_backend',
    aiIntegration: {
      provider: 'Google Gemini AI',
      model: 'gemini-1.5-flash',
      isKeyConfigured: hasGeminiKey,
      gracefulDegradation: 'ACTIVE (Fallback heuristic engine enabled if API fails)',
      rateLimiter: '30s sliding window per user',
    },
    database: {
      status: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
      host: mongoose.connection.host,
      database: mongoose.connection.name,
      isDockerNetwork: MONGO_URI.includes('mongodb:27017') || MONGO_URI.includes('mongodb://mongodb'),
    },
  });
});

// Root route - API overview & Practical 13 AI Architecture
app.get('/', (req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  res.status(200).json({
    message: 'ITUE301 Practical 13: AI API Integration into a Web Application API',
    student: 'Manav Lathiya (24CS048)',
    aiService: {
      engine: 'Google Gemini API (gemini-1.5-flash)',
      keyStatus: hasGeminiKey ? 'CONFIGURED' : 'UNCONFIGURED (Graceful Degradation Active)',
      endpoint: 'POST /api/ai/generate-description',
      aliasEndpoint: 'POST /tasks/ai-generate',
      rateLimiter: 'Max 1 request per task per 30 seconds',
      gracefulDegradation: 'Automatic heuristic fallback on quota/offline/invalid key',
    },
    healthEndpoint: 'GET /health',
    eventArchitecture: 'Node.js Native EventEmitter (task-created, task-deleted, error)',
    cachingEngine: 'node-cache (stdTTL: 60s, Auto Write-Invalidation)',
    endpoints: {
      aiGenerate: 'POST /api/ai/generate-description',
      health: 'GET /health',
      eventHistory: 'GET /events/history',
      eventStats: 'GET /events/stats',
      simulateError: 'POST /events/simulate-error',
      cacheStats: 'GET /tasks/cache-stats',
      cacheFlush: 'POST /tasks/cache-flush',
      register: 'POST /register',
      login: 'POST /login',
      getProfile: 'GET /me (Protected)',
      getTasks: 'GET /tasks (Cached, Protected)',
      getTaskById: 'GET /tasks/:id (Protected)',
      createTask: 'POST /tasks (Protected)',
      updateTask: 'PUT /tasks/:id (Protected)',
      deleteTask: 'DELETE /tasks/:id (Protected)',
    },
    demoCredentials: {
      email: '24cs048@charusat.edu.in',
      password: 'password123',
    },
  });
});



// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Error Handler] ${err.name}: ${err.message}`);

  if (err.name === 'ValidationError') {
    const formattedErrors = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
    return res.status(400).json({
      success: false,
      error: 'Schema Validation Error',
      validationErrors: formattedErrors,
    });
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    statusCode,
  });
});

// Server Listener (skip auto-listen during automated testing to avoid port collisions)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}`);
    console.log(`JWT Auth Active (Expiry: ${JWT_EXPIRES_IN})`);
  });
}

module.exports = app;
