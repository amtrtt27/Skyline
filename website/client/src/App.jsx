import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { store } from './store/store.js';

import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Toast from './components/Toast.jsx';

import Landing from './pages/Landing.jsx';
import About from './pages/About.jsx';
import HowItWorks from './pages/HowItWorks.jsx';
import PublicProjects from './pages/PublicProjects.jsx';
import PublicProjectDetails from './pages/PublicProjectDetails.jsx';
import Contact from './pages/Contact.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

import AppHome from './pages/AppHome.jsx';
import AppProjects from './pages/AppProjects.jsx';
import AppProjectDetails from './pages/AppProjectDetails.jsx';
import ContractorBids from './pages/ContractorBids.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import NotFound from './pages/NotFound.jsx';

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
    </>
  );
}

function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main" id="main">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(store.state);
  const location = useLocation();

  useEffect(() => store.subscribe(setState), []);
  useEffect(() => {
    // Scroll to top on route change (nice for demos)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <>
      {state.toast && <Toast toast={state.toast} />}
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="about" element={<About />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="projects" element={<PublicProjects />} />
          <Route path="projects/:id" element={<PublicProjectDetails />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AppHome />} />
          <Route path="projects" element={<AppProjects />} />
          <Route path="projects/:id" element={<AppProjectDetails />} />
          <Route path="bids" element={<ProtectedRoute roles={['contractor', 'admin']}><ContractorBids /></ProtectedRoute>} />
          <Route path="admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  );
}
