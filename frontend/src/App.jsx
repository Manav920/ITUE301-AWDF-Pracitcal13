import React, { useState, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import RouteLoadingFallback from './components/RouteLoadingFallback';
import { lazyWithMinDelay } from './utils/lazyWithDelay';
import './App.css';

// =======================================================================
// PRACTICAL 8: ROUTE-BASED CODE SPLITTING (React.lazy + Suspense)
// Instead of bundling all page components into a single massive bundle,
// each route is downloaded on-demand as a separate JavaScript chunk.
// =======================================================================

// Minimum 300ms delay avoids flickering loading spinner on fast local connections (Lab Manual Supplementary 2)
const Home = lazyWithMinDelay(() => import('./components/Home'), 300);
const TaskManager = lazyWithMinDelay(() => import('./components/TaskManager'), 300);
const Projects = lazyWithMinDelay(() => import('./components/Projects'), 300);
const Contact = lazyWithMinDelay(() => import('./components/Contact'), 300);
const NotFound = lazyWithMinDelay(() => import('./components/NotFound'), 300);

function App() {
  // useState variable for dark/light mode theme toggle across entire application
  const [darkMode, setDarkMode] = useState(false);

  // Student and academic portfolio data
  const studentInfo = {
    name: 'Manav Lathiya',
    id: '24CS048',
    department: 'Department of Computer Science and Engineering',
    institution: 'Chandubhai S Patel Institute of Technology (CSPIT), CHARUSAT',
    academicYear: '2025-26',
    email: '24cs048@charusat.edu.in',
    githubUrl: 'https://github.com/24CS048Manav',
    bio: 'Third-year B.Tech Computer Science and Engineering student at CSPIT, Charusat. Passionate about modern web architecture, component-driven design, and building scalable full-stack web applications. Currently mastering React, Vite, Node.js, and advanced development frameworks through hands-on coursework.',
  };

  // Skills array passed to Home -> Skills component via props
  const skills = [
    'Google Gemini AI API',
    'Prompt Engineering & Heuristics',
    'Graceful Degradation Architecture',
    'API Rate Limiting & Cooldowns',
    'GitHub Actions CI/CD',
    'Automated Testing (Jest & Supertest)',
    'Docker & Docker Compose',
    'Node.js Native EventEmitter',
    'In-Memory Caching (node-cache)',
    'Route-based Code Splitting (React.lazy)',
    'JWT Authentication & Middleware Pipeline',
    'Node.js & Express REST APIs',
    'MongoDB & Mongoose ODM',
  ];

  // Connected projects list maintaining thread across practicals
  const projects = [
    {
      title: 'Practical 1: Student Portfolio Platform',
      description: 'Component-based static portfolio built using Vite and React, demonstrating modular architecture and dynamic prop passing.',
      tech: ['React', 'Vite', 'CSS3', 'JSX'],
      status: 'Completed (Prac 1)',
    },
    {
      title: 'Practical 2: SPA Routing & State Management',
      description: 'Multi-page single-page application with client-side routing (React Router v6), controlled form inputs, dynamic state toggling, and live previews.',
      tech: ['React Router v6', 'useState', 'SPA Navigation', 'Controlled Forms'],
      status: 'Completed (Prac 2)',
    },
    {
      title: 'Practical 3-7: Full-Stack MERN Platform',
      description: 'Progressive architecture with GitHub API integration, Express backend, persistent MongoDB storage, and secure JWT authentication pipeline.',
      tech: ['MERN Stack', 'JWT Auth', 'Bcrypt', 'MongoDB', 'Mongoose'],
      status: 'Completed (Pracs 3-7)',
    },
    {
      title: 'Practical 8: Performance Optimization & Lazy Loading',
      description: 'Route-based code splitting, dynamic component lazy loading, Suspense fallbacks, and bundle profiling with DevTools.',
      tech: ['React.lazy()', 'Suspense', 'Code Splitting', 'Vite Chunks', 'DevTools Profiler'],
      status: 'Completed (Prac 8)',
    },
    {
      title: 'Practical 9: In-Memory Caching & Query Optimization',
      description: 'Server-side caching with node-cache, 60s TTL, automatic write-invalidation on POST/PUT/DELETE, and cache hit/miss observability.',
      tech: ['node-cache', 'In-Memory Caching', 'Query Optimization', 'Cache Invalidation', 'Express.js'],
      status: 'Completed (Prac 9)',
    },
    {
      title: 'Practical 10: Asynchronous Event-Driven Architecture',
      description: 'Decoupled background processing using Node.js native EventEmitter, non-blocking 2s notification worker, task-deleted audit logging, and error listener.',
      tech: ['EventEmitter', 'Node.js Events', 'Async Decoupling', 'Non-blocking I/O', 'Express.js'],
      status: 'Completed (Prac 10)',
    },
    {
      title: 'Practical 11: Containerization with Docker and Docker Compose',
      description: 'Multi-container orchestration with Docker Compose: React (multi-stage build), Node/Express backend, and official MongoDB container on bridge network with volume persistence.',
      tech: ['Docker', 'Docker Compose', 'Multi-Stage Build', 'Bridge Network', 'Named Volumes'],
      status: 'Completed (Prac 11)',
    },
    {
      title: 'Practical 12: CI/CD Pipeline with GitHub Actions',
      description: 'Automated Continuous Integration pipeline with GitHub Actions: multi-job workflow executing code quality linting and automated Jest/Supertest suite on push and pull requests.',
      tech: ['GitHub Actions', 'CI/CD', 'Jest', 'Supertest', 'Workflow YAML', 'Status Badges'],
      status: 'Completed (Prac 12)',
    },
    {
      title: 'Practical 13: AI API Integration into a Web Application',
      description: 'Server-side Google Gemini AI integration for intelligent task generation, graceful degradation on failure/missing key, rate limiting, and responsible AI governance.',
      tech: ['Google Gemini API', 'Express Backend', 'Graceful Degradation', 'Rate Limiting', 'Responsible AI'],
      status: 'Current (Prac 13)',
    },
  ];

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`portfolio-app ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Navigation bar with route Links and theme toggle */}
      <NavBar darkMode={darkMode} onToggleTheme={toggleDarkMode} />

      {/* Main Single Page Application Route Outlet with Route-Level Suspense */}
      <main className="portfolio-container">
        {/* Practical 13 AI API Integration Status Banner */}
        <div className="optimization-banner" role="region" aria-label="AI Integration Status">
          <div className="opt-info-text">
            <span className="opt-badge-pill" style={{ background: 'linear-gradient(135deg, #f43f5e, #8b5cf6)' }}>🤖 Practical 13 AI Integration Active</span>
            <span>Server-Side <strong>Google Gemini API</strong>: Auto-Description + Graceful Degradation + Rate Limiting</span>
          </div>
          <div className="opt-chunks-info">
            <span className="opt-chunk-tag">Gemini 1.5 Flash</span>
            <span className="opt-chunk-tag">Backend-Only Key (.env)</span>
            <span className="opt-chunk-tag">Graceful Fallback</span>
            <span className="opt-chunk-tag">30s Rate Limiter</span>
          </div>
        </div>




        {/* Suspense boundary wrapped strictly around Routes as guided by syllabus */}
        <Suspense fallback={<RouteLoadingFallback message="Loading route module..." />}>
          <Routes>
            <Route path="/" element={<Home studentInfo={studentInfo} skills={skills} />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/projects" element={<Projects projectList={projects} />} />
            <Route path="/contact" element={<Contact studentInfo={studentInfo} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      {/* Academic Footer */}
      <Footer
        studentId={studentInfo.id}
        academicYear={studentInfo.academicYear}
        email={studentInfo.email}
        githubUrl={studentInfo.githubUrl}
      />
    </div>
  );
}

export default App;

