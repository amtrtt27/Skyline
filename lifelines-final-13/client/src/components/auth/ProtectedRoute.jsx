import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/DataStore.jsx';

export default function ProtectedRoute({ children, roles }) {
  const { auth } = useStore();
  const loc = useLocation();

  if (!auth.user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;

  if (roles && roles.length && !roles.includes(auth.user.role)) {
    return <Navigate to="/app" replace />;
  }

  return children;
}
