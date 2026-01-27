import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { store } from '../store/store.js';

export default function ProtectedRoute({ roles, children }) {
  const [state, setState] = useState(store.state);
  useEffect(() => store.subscribe(setState), []);

  if (!state.user) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0 && !roles.includes(state.user.role)) {
    return <Navigate to="/app" replace />;
  }
  return children;
}
