import React, { useState } from 'react';

export default function Contact() {
  const [state, setState] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 2500);
    setState({ name: '', email: '', message: '' });
  };

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Contact</h1>
        <p className="muted">Send a message to the LifeLines team. (This form is a mock submit in this MVP.)</p>

        <form className="form" onSubmit={submit}>
          <div className="row2">
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" className="input" value={state.name} onChange={(e) => setState(s => ({ ...s, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" className="input" type="email" value={state.email} onChange={(e) => setState(s => ({ ...s, email: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="msg">Message</label>
            <textarea id="msg" className="textarea" value={state.message} onChange={(e) => setState(s => ({ ...s, message: e.target.value }))} required />
          </div>
          <button className="btn btnPrimary" type="submit">Send</button>
          {sent ? <div className="success">Message sent (mock).</div> : null}
        </form>
      </div>
    </div>
  );
}
