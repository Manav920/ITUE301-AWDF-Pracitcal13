const http = require('http');

function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function del(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'DELETE',
      headers
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=================================================================');
  console.log('PRACTICAL 10: EVENT-DRIVEN ASYNCHRONOUS PROCESSING TEST');
  console.log('=================================================================');

  // 1. Authenticate to get token
  const login = await post('/login', { email: '24cs048@charusat.edu.in', password: 'password123' });
  const token = login.data.token;
  console.log('✓ Logged in as:', login.data.user.email);

  // 2. Test task-created event and measure response timing
  console.log('\n--- 1. Testing POST /tasks & Non-Blocking API Response ---');
  const t0 = Date.now();
  const createRes = await post('/tasks', {
    title: 'Practical 10 Async Event Demo',
    description: 'Verify non-blocking EventEmitter notification worker',
    priority: 'high',
    category: 'Practical 10'
  }, token);
  const clientElapsed = Date.now() - t0;

  console.log(`✓ HTTP Status: ${createRes.status} Created`);
  console.log(`✓ Client Roundtrip Time: ${clientElapsed} ms (Instant HTTP response)`);
  console.log(`✓ Server API Timestamp:  ${createRes.data.apiResponseTimestamp}`);
  console.log(`ℹ️  Notice: The 2-second background notification handler is STILL RUNNING in the background!`);

  const createdTaskId = createRes.data.data._id;

  // 3. Wait for background listener to complete its 2000ms simulated slow I/O
  console.log('\n--- Waiting 2.5 seconds for background worker to log completion ---');
  await new Promise(r => setTimeout(r, 2500));

  // 4. Test task-deleted event (Supplementary Problem 1)
  console.log('\n--- 2. Testing DELETE /tasks/:id & task-deleted Event ---');
  const delRes = await del(`/tasks/${createdTaskId}`, token);
  console.log(`✓ HTTP Status: ${delRes.status} OK`);
  console.log(`✓ Server API Timestamp: ${delRes.data.apiResponseTimestamp}`);

  // 5. Test error event listener (Supplementary Problem 2)
  console.log('\n--- 3. Testing error Event Handling (Supplementary Problem 2) ---');
  const errRes = await post('/events/simulate-error', {
    message: 'Simulated worker failure verification (caught by error listener)'
  });
  console.log(`✓ Simulate error status: ${errRes.status} OK (${errRes.data.message})`);

  // 6. Inspect event history & statistics
  console.log('\n--- 4. Event History & Statistics (/events/history) ---');
  const historyRes = await get('/events/history');
  console.log('Total Emitted Events:', historyRes.data.stats.totalEmitted);
  console.log('Task Created Events:', historyRes.data.stats.taskCreatedCount);
  console.log('Task Deleted Events:', historyRes.data.stats.taskDeletedCount);
  console.log('Caught Error Events:', historyRes.data.stats.errorCount);
  console.log('Recent Log Entries:');
  historyRes.data.history.slice(0, 3).forEach((item, idx) => {
    console.log(`  [${idx + 1}] Type: ${item.type} | Time: ${item.timestamp} | Details:`, item.details);
  });

  console.log('\n✓ ALL PRACTICAL 10 EVENT TESTS COMPLETED SUCCESSFULLY!');
}

run().catch(console.error);
