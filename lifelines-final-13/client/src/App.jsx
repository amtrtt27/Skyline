import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

import Landing from './pages/public/Landing.jsx';
import About from './pages/public/About.jsx';
import HowItWorks from './pages/public/HowItWorks.jsx';
import PublicProjects from './pages/public/PublicProjects.jsx';
import PublicProjectDetail from './pages/public/PublicProjectDetail.jsx';
import Contact from './pages/public/Contact.jsx';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

import AppHome from './pages/app/AppHome.jsx';
import ProjectsList from './pages/app/ProjectsList.jsx';
import ProjectDetail from './pages/app/ProjectDetail.jsx';
import BidsHub from './pages/app/BidsHub.jsx';
import ResourcesOntology from './pages/app/ResourcesOntology.jsx';
import Statistics from './pages/app/Statistics.jsx';
import AdminPanel from './pages/app/AdminPanel.jsx';
import Settings from './pages/app/Settings.jsx';

import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/projects" element={<PublicProjects />} />
        <Route path="/projects/:id" element={<PublicProjectDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* App */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AppHome />} />
        <Route path="projects" element={<ProjectsList />} />
        <Route path="projects/:id/*" element={<ProjectDetail />} />
        <Route path="bids" element={<BidsHub />} />
        <Route path="resources" element={<ResourcesOntology />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
