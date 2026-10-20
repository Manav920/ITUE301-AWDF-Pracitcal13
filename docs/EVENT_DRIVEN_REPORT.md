# Event-Driven Architecture & Async Processing Report: Practical 10

**Student**: Manav Lathiya (24CS048)  
**Course**: ITUE301 - Advanced Web Development Frameworks  
**Institution**: CSPIT, CHARUSAT  

---

## 1. Console Log Execution Evidence

```text
=================================================================
[TaskEvents] All listeners registered: (task-created, task-deleted, error)
Server listening on port 5000
API URL: http://localhost:5000
=================================================================
[API Response] Task created & HTTP 201 sent to client at: 2026-10-17T11:45:00.120Z
[Event Dispatched] 'task-created' event received by listener at: 2026-10-17T11:45:00.122Z
=================================================================
[Notification Worker] ✉️  Notification email dispatched for task: "Practical 10 Async Event Demo"
[Notification Worker] ⏱️  Background job completed at: 2026-10-17T11:45:02.125Z
[Non-Blocking Proof]  API response was sent ~2000ms PRIOR to this log!
=================================================================
[API Response] Task deleted & HTTP 200 sent to client at: 2026-10-17T11:45:04.500Z
[Audit Log Worker] 🗑️  Task "Practical 10 Async Event Demo" (ID: 6ad3184...) permanently removed from database at 2026-10-17T11:45:04.502Z
=================================================================
[Event Error Handler] ⚠️  Caught background event error at 2026-10-17T11:45:06.100Z:
[Event Error Handler] Message: Simulated worker failure verification (caught by error listener)
[Event Error Handler] Server process protected from crash by error listener.
=================================================================
```

---

## 2. Event Loop Sequence Breakdown

1. **Request Reception**: Express receives HTTP `POST /tasks`.
2. **Synchronous/I/O Execution**: Task saved to MongoDB via Mongoose; cache invalidated.
3. **Response Dispatch**: `res.status(201).json(...)` serializes payload and flushes HTTP socket to client.
4. **Event Emission**: `taskEvents.emit('task-created', task)` invokes listener callbacks.
5. **Timer Registration**: Inside listener, `setTimeout(..., 2000)` registers a timer with libuv.
6. **Main Thread Freed**: Route handler exits immediately. The client connection closes with HTTP 201.
7. **Background Worker Execution**: 2000ms later, the timer fires during the timers phase of the event loop, logging the notification.
