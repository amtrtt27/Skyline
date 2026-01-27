import React, { useState } from 'react';
import { store } from '../store/store.js';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [done, setDone] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    // Mock submit
    setDone(true);
    store.setToast('Message sent (mock). Thanks!', 'info');
  };

  if (done) {
    return (
      <div className="container" style={{ paddingTop: 22 }}>
        <h2>Contact</h2>
        <div className="card">
          Thanks! We received your message and will respond soon.
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 22 }}>
      <h2>Contact</h2>
      <p className="subtle">This form is a mock for the MVP—no external services required.</p>

      <div className="card" style={{ maxWidth: 720 }}>
        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="c_name">Name</label>
            <input id="c_name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="c_email">Email</label>
            <input id="c_email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="c_msg">Message</label>
            <textarea id="c_msg" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          </div>
          <button className="btn" type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
