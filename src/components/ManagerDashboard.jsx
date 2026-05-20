import React, { useState } from 'react';
import { Users, UserCheck, Coffee, UserX, Check, X, Edit, Download, AlertCircle, MapPin, Laptop, ShieldAlert } from 'lucide-react';
import { AttendanceDistributionChart } from './CustomCharts';

export default function ManagerDashboard({
  employees,
  logs,
  leaves,
  onApproveLeave,
  onRejectLeave,
  onManualAdjustment,
  addToast
}) {
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  
  // Adjustment Form States
  const [adjustCheckIn, setAdjustCheckIn] = useState('');
  const [adjustCheckOut, setAdjustCheckOut] = useState('');
  const [adjustLocation, setAdjustLocation] = useState('HQ Office');
  const [adjustStatus, setAdjustStatus] = useState('On Time');

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper stats
  const totalCount = employees.length;
  const presentCount = employees.filter(e => e.status === "Present").length;
  const breakCount = employees.filter(e => e.status === "On Break").length;
  const absentCount = employees.filter(e => e.status === "Absent").length;
  const leaveCount = employees.filter(e => e.status === "On Leave").length;

  const pendingLeaves = leaves.filter(lv => lv.status === "Pending");

  // Format Check-In Time helper
  const getTodayCheckIn = (empId) => {
    const log = logs.find(l => l.empId === empId && l.date === todayStr);
    if (!log) return null;
    return new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTodayCheckOut = (empId) => {
    const log = logs.find(l => l.empId === empId && l.date === todayStr);
    if (!log || !log.checkOut) return null;
    return new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTodayLog = (empId) => {
    return logs.find(l => l.empId === empId && l.date === todayStr);
  };

  const handleOpenAdjustModal = (emp) => {
    setSelectedEmp(emp);
    const existingLog = getTodayLog(emp.id);
    
    if (existingLog) {
      // Set to existing values
      setAdjustCheckIn(existingLog.checkIn ? existingLog.checkIn.substring(11, 16) : '09:00');
      setAdjustCheckOut(existingLog.checkOut ? existingLog.checkOut.substring(11, 16) : '17:00');
      setAdjustLocation(existingLog.location || 'HQ Office');
      setAdjustStatus(existingLog.status || 'On Time');
    } else {
      // Set defaults
      setAdjustCheckIn('09:00');
      setAdjustCheckOut('17:00');
      setAdjustLocation('HQ Office');
      setAdjustStatus('On Time');
    }
    
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = (e) => {
    e.preventDefault();
    if (!selectedEmp) return;

    onManualAdjustment({
      empId: selectedEmp.id,
      date: todayStr,
      checkInTime: adjustCheckIn ? `${todayStr}T${adjustCheckIn}:00` : null,
      checkOutTime: adjustCheckOut ? `${todayStr}T${adjustCheckOut}:00` : null,
      location: adjustLocation,
      status: adjustStatus
    });

    setShowAdjustModal(false);
    setSelectedEmp(null);
  };

  const exportCSVReport = () => {
    // Generate simple CSV structure of today's attendance
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Employee ID,Name,Department,Role,Status,Check-In,Check-Out,Location,Device\n";

    employees.forEach(emp => {
      const log = getTodayLog(emp.id);
      const inTime = log ? log.checkIn || "" : "";
      const outTime = log ? log.checkOut || "" : "";
      const loc = log ? log.location || "" : "";
      const dev = log ? log.device || "" : "";
      
      csvContent += `"${emp.id}","${emp.name}","${emp.dept}","${emp.role}","${emp.status}","${inTime}","${outTime}","${loc}","${dev}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Chronos_Attendance_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast("Exported today's attendance report to CSV", "success");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present': return <span className="status-badge present"><span className="pulse-dot"></span>Present</span>;
      case 'On Break': return <span className="status-badge break">On Break</span>;
      case 'Absent': return <span className="status-badge absent">Absent</span>;
      case 'On Leave': return <span className="status-badge leave">On Leave</span>;
      default: return <span className="status-badge absent">{status}</span>;
    }
  };

  return (
    <div className="manager-dashboard-layout">
      
      {/* 1. TOP CARDS / KPI METRICS */}
      <div className="manager-kpi-grid">
        <div className="glass-container kpi-card">
          <div className="kpi-icon-box bg-purple">
            <Users size={22} />
          </div>
          <div className="kpi-values">
            <span className="kpi-label">Total Staff</span>
            <span className="kpi-num">{totalCount}</span>
          </div>
        </div>
        
        <div className="glass-container kpi-card">
          <div className="kpi-icon-box bg-green">
            <UserCheck size={22} />
          </div>
          <div className="kpi-values">
            <span className="kpi-label">Checked In</span>
            <span className="kpi-num">{presentCount}</span>
          </div>
        </div>

        <div className="glass-container kpi-card">
          <div className="kpi-icon-box bg-warning">
            <Coffee size={22} />
          </div>
          <div className="kpi-values">
            <span className="kpi-label">On Break</span>
            <span className="kpi-num">{breakCount}</span>
          </div>
        </div>

        <div className="glass-container kpi-card">
          <div className="kpi-icon-box bg-rose">
            <UserX size={22} />
          </div>
          <div className="kpi-values">
            <span className="kpi-label">Out / Leaves</span>
            <span className="kpi-num">{absentCount + leaveCount}</span>
          </div>
        </div>
      </div>

      {/* 2. CHARTS & REVIEWS ROWS */}
      <div className="manager-grid-middle">
        
        {/* Doughnut Chart Box */}
        <div className="glass-container visual-analytics-card">
          <AttendanceDistributionChart employees={employees} />
        </div>

        {/* Pending Leaves Panel */}
        <div className="glass-container pending-leaves-panel">
          <div className="panel-header-row">
            <h3 className="panel-title">Pending Leave Requests</h3>
            <span className="count-tag">{pendingLeaves.length} Pending</span>
          </div>

          <div className="pending-leaves-list">
            {pendingLeaves.length === 0 ? (
              <div className="empty-pending-leaves">
                <Check size={28} className="success-icon-glow" />
                <p>All leave applications reviewed</p>
              </div>
            ) : (
              pendingLeaves.map((lv) => {
                let notesInput = '';
                return (
                  <div key={lv.id} className="pending-leave-card">
                    <div className="leave-card-row">
                      <div className="leave-card-user">
                        <strong>{lv.empName}</strong>
                        <span className="role-subtext">{lv.type}</span>
                      </div>
                      <div className="leave-card-days">
                        <span>{lv.days} {lv.days === 1 ? 'Day' : 'Days'}</span>
                        <small>{lv.startDate} to {lv.endDate}</small>
                      </div>
                    </div>
                    
                    <p className="leave-reason-text">"{lv.reason}"</p>
                    
                    <div className="leave-notes-field">
                      <input 
                        type="text" 
                        placeholder="Manager review notes (optional)..."
                        onChange={(e) => { notesInput = e.target.value; }}
                        className="leave-notes-input"
                      />
                    </div>

                    <div className="leave-card-actions">
                      <button 
                        className="btn-success-small"
                        onClick={() => onApproveLeave(lv.id, notesInput)}
                      >
                        <Check size={14} />
                        <span>Approve</span>
                      </button>
                      <button 
                        className="btn-danger-small"
                        onClick={() => onRejectLeave(lv.id, notesInput)}
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* 3. REALTIME EMPLOYEE STATUS BOARD */}
      <div className="glass-container manager-table-card">
        <div className="table-header-row">
          <div className="title-section">
            <h3 className="table-header-title">Live Attendance Board</h3>
            <p className="table-header-subtitle">Real-time status updates of all employees for today</p>
          </div>
          <button className="btn-primary" onClick={exportCSVReport}>
            <Download size={14} />
            <span>Export CSV Report</span>
          </button>
        </div>

        <div className="table-responsive-wrapper">
          <table className="custom-dashboard-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Location</th>
                <th>Device Platform</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const todayLog = getTodayLog(emp.id);
                return (
                  <tr key={emp.id}>
                    <td>
                      <div className="table-employee-profile">
                        <div className="emp-avatar" style={{ backgroundColor: emp.color }}>
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="emp-meta">
                          <span className="emp-name-text">{emp.name}</span>
                          <span className="emp-id-text">{emp.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>{emp.dept}</td>
                    <td>{getStatusBadge(emp.status)}</td>
                    <td>{getTodayCheckIn(emp.id) || '--:--'}</td>
                    <td>{getTodayCheckOut(emp.id) || '--:--'}</td>
                    <td>
                      {todayLog ? (
                        <div className="location-cell">
                          <MapPin size={12} className="location-pin-icon" />
                          <span>{todayLog.location}</span>
                        </div>
                      ) : '--'}
                    </td>
                    <td>
                      {todayLog ? (
                        <div className="device-cell">
                          <Laptop size={12} className="device-icon" />
                          <span>{todayLog.device}</span>
                        </div>
                      ) : '--'}
                    </td>
                    <td>
                      <button 
                        className="btn-edit-action"
                        onClick={() => handleOpenAdjustModal(emp)}
                        title="Adjust Attendance Record"
                      >
                        <Edit size={14} />
                        <span>Adjust Log</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MANUAL ADJUSTMENT MODAL */}
      {showAdjustModal && selectedEmp && (
        <div className="verification-overlay">
          <div className="verification-modal adjust-modal glass-container">
            <div className="stepper-header">
              <div className="stepper-step-indicator">
                <span className="stepper-title">Manual Log Adjustment</span>
                <span className="stepper-subtitle">Overriding record for {selectedEmp.name}</span>
              </div>
              <button className="close-modal-x" onClick={() => { setShowAdjustModal(false); setSelectedEmp(null); }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="modal-adjust-form">
              <div className="warning-panel">
                <ShieldAlert size={18} className="warn-icon" />
                <p>Auditing: Manual edits will overwrite today's clock records for this user and log the transaction.</p>
              </div>

              <div className="form-double-group">
                <div className="form-group-field">
                  <label>Check-In Time</label>
                  <input 
                    type="time" 
                    value={adjustCheckIn}
                    onChange={(e) => setAdjustCheckIn(e.target.value)}
                    className="form-input-element"
                  />
                </div>
                <div className="form-group-field">
                  <label>Check-Out Time</label>
                  <input 
                    type="time" 
                    value={adjustCheckOut}
                    onChange={(e) => setAdjustCheckOut(e.target.value)}
                    className="form-input-element"
                  />
                </div>
              </div>

              <div className="form-double-group">
                <div className="form-group-field">
                  <label>Work Location</label>
                  <select 
                    value={adjustLocation}
                    onChange={(e) => setAdjustLocation(e.target.value)}
                    className="form-input-element"
                  >
                    <option value="HQ Office">HQ Office</option>
                    <option value="Remote">Remote</option>
                    <option value="Client Site">Client Site</option>
                  </select>
                </div>

                <div className="form-group-field">
                  <label>Attendance Status</label>
                  <select 
                    value={adjustStatus}
                    onChange={(e) => setAdjustStatus(e.target.value)}
                    className="form-input-element"
                  >
                    <option value="On Time">On Time</option>
                    <option value="Late">Late</option>
                    <option value="Excused">Excused</option>
                  </select>
                </div>
              </div>

              <div className="step-actions">
                <button type="button" className="btn-text" onClick={() => { setShowAdjustModal(false); setSelectedEmp(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Apply Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
