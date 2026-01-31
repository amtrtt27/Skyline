import React from 'react';

/**
 * DecisionConsequencePreview - Shows the impact of approving or rejecting a decision
 * before it's made, preventing accidental gridlock and bad calls.
 */
export default function DecisionConsequencePreview({ decision, onApprove, onReject, onCancel }) {
  const { consequences, dependencies = [], type, description } = decision || {};
  
  if (!decision || !consequences) {
    return null;
  }

  const { ifApproved = {}, ifRejected = {} } = consequences;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <h2 style={{ marginTop: 0 }}>Decision Consequence Preview</h2>
        
        <div style={{ 
          padding: '1rem', 
          background: 'var(--bg-secondary)', 
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <strong>Decision Type:</strong> {type}<br/>
          <strong>Description:</strong> {description || 'N/A'}
        </div>

        {dependencies.length > 0 && (
          <div style={{ 
            padding: '1rem', 
            background: 'var(--warning-bg)', 
            border: '1px solid var(--warning-border)',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <strong style={{ color: 'var(--warning-text)' }}> This decision depends on:</strong>
            <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
              {dependencies.map((dep, i) => (
                <li key={i}>{dep}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* If Approved */}
          <div style={{ 
            border: '2px solid var(--success-color)', 
            borderRadius: '8px', 
            padding: '1rem',
            background: 'var(--success-bg)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--success-color)' }}> If Approved</h3>
            
            {ifApproved.tasksUnblocked > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>{ifApproved.tasksUnblocked}</strong> downstream tasks unblocked
              </div>
            )}
            
            {ifApproved.debrisReuseAllowed && (
              <div style={{ marginBottom: '0.75rem' }}>
                 Debris reuse allowed
              </div>
            )}
            
            {ifApproved.additionalApprovalsRequired > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                Requires <strong>{ifApproved.additionalApprovalsRequired}</strong> additional approvals
              </div>
            )}
            
            {ifApproved.resourcesReleased && ifApproved.resourcesReleased.length > 0 && (
              <div>
                <strong>Resources Released:</strong>
                <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.5rem', fontSize: '0.9em' }}>
                  {ifApproved.resourcesReleased.slice(0, 5).map((res, i) => (
                    <li key={i}>{res}</li>
                  ))}
                  {ifApproved.resourcesReleased.length > 5 && (
                    <li>...and {ifApproved.resourcesReleased.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            {ifApproved.customMessages && ifApproved.customMessages.length > 0 && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                {ifApproved.customMessages.map((msg, i) => (
                  <div key={i}> {msg}</div>
                ))}
              </div>
            )}
          </div>

          {/* If Rejected */}
          <div style={{ 
            border: '2px solid var(--danger-color)', 
            borderRadius: '8px', 
            padding: '1rem',
            background: 'var(--danger-bg)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--danger-color)' }}> If Rejected</h3>
            
            {ifRejected.hospitalReopeningDelayed && (
              <div style={{ marginBottom: '0.75rem' }}>
                 Hospital reopening delayed
              </div>
            )}
            
            {ifRejected.debrisClearancePaused && (
              <div style={{ marginBottom: '0.75rem' }}>
                 Debris clearance paused
              </div>
            )}
            
            {ifRejected.projectDelayDays > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                Project delayed by <strong>{ifRejected.projectDelayDays}</strong> days
              </div>
            )}

            {ifRejected.blockedTasks && ifRejected.blockedTasks.length > 0 && (
              <div>
                <strong>Blocked Tasks:</strong>
                <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.5rem', fontSize: '0.9em' }}>
                  {ifRejected.blockedTasks.slice(0, 5).map((task, i) => (
                    <li key={i}>{task}</li>
                  ))}
                  {ifRejected.blockedTasks.length > 5 && (
                    <li>...and {ifRejected.blockedTasks.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            {ifRejected.customMessages && ifRejected.customMessages.length > 0 && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                {ifRejected.customMessages.map((msg, i) => (
                  <div key={i}> {msg}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          padding: '1rem', 
          background: 'var(--info-bg)', 
          border: '1px solid var(--info-border)',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          fontSize: '0.9em'
        }}>
          <strong>Why this matters:</strong> Understanding the full impact of your decision prevents 
          accidental gridlock and helps make informed choices under pressure.
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button 
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            onClick={onReject}
            className="btn"
            style={{ 
              background: 'var(--danger-color)', 
              color: 'white',
              border: 'none'
            }}
          >
            Reject Decision
          </button>
          <button 
            onClick={onApprove}
            className="btn btn-primary"
          >
            Approve Decision
          </button>
        </div>
      </div>
    </div>
  );
}
