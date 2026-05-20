import React, { useState, useEffect } from 'react';
import { Clock, Play, Coffee, LogOut, FileText, History, BarChart3, Send, Calendar, CheckSquare } from 'lucide-react';
import { WeeklyHoursChart } from './CustomCharts';

export default function EmployeeDashboard({ 
  employee, 
  logs, 
  leaves, 
  onClockInTrigger, 
  onClockOutTrigger, 
  onToggleBreak,
  onSubmitLeave,
  addToast 
}) {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' or 'leaves'
  
  // Leave Form state
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Live Timer for clocked-in duration
  const [workedTime, setWorkedTime] = useState('00:00:00');
  
  // Find current day's log for this employee
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(l => l.empId === employee.id && l.date === todayStr);

  useEffect(() => {
    let timer;
    if (employee.status === "Present" && todayLog && todayLog.checkIn) {
      const updateTimer = () => {
        const checkInTime = new Date(todayLog.checkIn);
        const now = new Date();
        const diffMs = now - checkInTime;
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        setWorkedTime(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      };
      
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    } else {
      setWorkedTime('00:00:00');
    }
    
    return () => clearInterval(timer);
  }, [employee.status, todayLog]);

  // Filter logs for this employee
  const personalLogs = logs
    .filter(l => l.empId === employee.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Filter leaves for this employee
  const personalLeaves = leaves
    .filter(lv => lv.empId === employee.id)
    .sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));

  // Calculate statistics
  const totalCompletedHours = logs
    .filter(l => l.empId === employee.id && l.checkOut)
    .reduce((sum, log) => {
      const inTime = new Date(log.checkIn);
      const outTime = new Date(log.checkOut);
      return sum + (outTime - inTime) / (1000 * 60 * 60);
    }, 0);
  
  const lateCount = logs.filter(l => l.empId === employee.id && l.status === "Late").length;
  const attendanceRate = personalLogs.length > 0 
    ? Math.round(((personalLogs.length - lateCount * 0.2) / personalLogs.length) * 100) 
    : 100;

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      addToast("Please fill in all leave details", "error");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      addToast("End Date cannot be before Start Date", "error");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    onSubmitLeave({
      type: leaveType,
      startDate,
      endDate,
      days: diffDays,
      reason
    });

    // Reset Form
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const formatClockTime = (timeString) => {
    if (!timeString) return '--:--';
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'On Time': return 'badge-success';
      case 'Late': return 'badge-warning';
      case 'Absent': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  return (
    <div className="employee-dashboard-grid">
      
      {/* LEFT COLUMN - ACTION & STATS */}
      <div className="dashboard-sidebar-column">
        
        {/* Status Clock Card */}
        <div className="glass-container clock-action-card">
          <span className="section-subtitle">Real-time Portal</span>
          <h2 className="card-headline">Clock Center</h2>

          <div className="clock-status-display">
            <div className={`status-indicator-ring status-${employee.status.toLowerCase().replace(' ', '-')}`}>
              <div className="status-dot-core"></div>
              <Clock size={36} className="ticking-clock-icon" />
            </div>
            <div className="clock-status-details">
              <span className="status-label-value">Status: {employee.status}</span>
              {employee.status === "Present" && (
                <span className="live-duration-ticking">{workedTime}</span>
              )}
              {employee.status === "On Break" && (
                <span className="break-duration-ticking">Currently on Break</span>
              )}
              {employee.status === "Absent" && (
                <span className="checkout-duration-ticking">Not Clocked In</span>
              )}
              {employee.status === "On Leave" && (
                <span className="leave-duration-ticking">Authorized Leave</span>
              )}
            </div>
          </div>

          <div className="clock-control-actions">
            {employee.status === "Absent" ? (
              <button className="btn-primary flex-fill btn-lg" onClick={onClockInTrigger}>
                <Play size={18} fill="currentColor" />
                <span>Clock In</span>
              </button>
            ) : (
              <>
                {employee.status === "Present" ? (
                  <button className="btn-warning flex-fill" onClick={() => onToggleBreak('start')}>
                    <Coffee size={16} />
                    <span>Break</span>
                  </button>
                ) : employee.status === "On Break" ? (
                  <button className="btn-success flex-fill" onClick={() => onToggleBreak('end')}>
                    <Play size={16} fill="currentColor" />
                    <span>Resume</span>
                  </button>
                ) : null}
                
                <button 
                  className="btn-danger flex-fill" 
                  disabled={employee.status === "On Leave"}
                  onClick={onClockOutTrigger}
                >
                  <LogOut size={16} />
                  <span>Clock Out</span>
                </button>
              </>
            )}
          </div>

          <div className="today-timetable-logs">
            <div className="timetable-row">
              <span className="label">Check In:</span>
              <span className="value">{todayLog ? formatClockTime(todayLog.checkIn) : '--:--'}</span>
            </div>
            <div className="timetable-row">
              <span className="label">Check Out:</span>
              <span className="value">{todayLog && todayLog.checkOut ? formatClockTime(todayLog.checkOut) : '--:--'}</span>
            </div>
          </div>
        </div>

        {/* Short Personal Stats */}
        <div className="employee-stats-cards-grid">
          <div className="glass-container stat-mini-card">
            <BarChart3 className="icon-purple" size={18} />
            <span className="stat-label">Hours (Month)</span>
            <span className="stat-value">{Math.round(totalCompletedHours * 10) / 10}h</span>
          </div>
          <div className="glass-container stat-mini-card">
            <CheckSquare className="icon-green" size={18} />
            <span className="stat-label">Attendance</span>
            <span className="stat-value">{attendanceRate}%</span>
          </div>
          <div className="glass-container stat-mini-card">
            <Clock className="icon-warning" size={18} />
            <span className="stat-label">Late Logins</span>
            <span className="stat-value">{lateCount}</span>
          </div>
          <div className="glass-container stat-mini-card">
            <Calendar className="icon-cyan" size={18} />
            <span className="stat-label">Leaves Left</span>
            <span className="stat-value">12 Days</span>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN - CONTENT PANELS (Tabs) */}
      <div className="dashboard-content-column">
        
        {/* Tab Selection */}
        <div className="tab-menu-header glass-container">
          <button 
            className={`tab-menu-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <History size={16} />
            <span>Attendance Records</span>
          </button>
          <button 
            className={`tab-menu-btn ${activeTab === 'leaves' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaves')}
          >
            <FileText size={16} />
            <span>Leave Management</span>
          </button>
        </div>

        {/* TAB 1: ATTENDANCE RECORDS */}
        {activeTab === 'attendance' && (
          <div className="tab-content-panel fade-in">
            {/* Hour charts */}
            <div className="glass-container chart-box-outer">
              <WeeklyHoursChart logs={logs} employeeId={employee.id} />
            </div>

            {/* Past Logs Table */}
            <div className="glass-container table-outer-container">
              <div className="table-header-row">
                <h3 className="table-header-title">Recent Activity History</h3>
              </div>
              <div className="table-responsive-wrapper">
                <table className="custom-dashboard-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Device</th>
                      <th>Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personalLogs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="table-empty-row">No attendance records found for this employee.</td>
                      </tr>
                    ) : (
                      personalLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{log.date}</td>
                          <td>{formatClockTime(log.checkIn)}</td>
                          <td>{log.checkOut ? formatClockTime(log.checkOut) : <span className="text-pulse-active">Working...</span>}</td>
                          <td>
                            <span className={`table-badge ${getStatusBadgeClass(log.status)}`}>
                              {log.status}
                            </span>
                          </td>
                          <td>{log.location}</td>
                          <td className="text-secondary">{log.device}</td>
                          <td>
                            <div className="verification-pills-row">
                              {log.verification && log.verification.map((v, i) => (
                                <span key={i} className="tiny-verif-pill" title={`${v} Verified`}>
                                  {v[0]}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LEAVE MANAGEMENT */}
        {activeTab === 'leaves' && (
          <div className="tab-content-panel leave-panel-outer fade-in">
            
            {/* Leave Request Form */}
            <div className="glass-container leave-form-box">
              <h3 className="panel-title">Request Time Off</h3>
              <form onSubmit={handleLeaveSubmit} className="grid-form-layout">
                <div className="form-group-field">
                  <label>Leave Category</label>
                  <select 
                    value={leaveType} 
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="form-input-element"
                  >
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Unpaid Leave">Unpaid Leave</option>
                  </select>
                </div>

                <div className="form-double-group">
                  <div className="form-group-field">
                    <label>Start Date</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      className="form-input-element"
                    />
                  </div>
                  <div className="form-group-field">
                    <label>End Date</label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      className="form-input-element"
                    />
                  </div>
                </div>

                <div className="form-group-field col-span-all">
                  <label>Reason / Description</label>
                  <textarea 
                    rows="3" 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide details about your leave request..."
                    className="form-input-element"
                  ></textarea>
                </div>

                <div className="form-actions-submit col-span-all">
                  <button type="submit" className="btn-primary">
                    <Send size={14} />
                    <span>Submit Leave Request</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Leave Request Table */}
            <div className="glass-container table-outer-container">
              <div className="table-header-row">
                <h3 className="table-header-title">My Leave Applications</h3>
              </div>
              <div className="table-responsive-wrapper">
                <table className="custom-dashboard-table">
                  <thead>
                    <tr>
                      <th>Applied On</th>
                      <th>Leave Type</th>
                      <th>Duration</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Admin Feedback / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personalLeaves.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="table-empty-row">No leave applications found.</td>
                      </tr>
                    ) : (
                      personalLeaves.map((lv) => (
                        <tr key={lv.id}>
                          <td>{lv.appliedOn}</td>
                          <td><strong>{lv.type}</strong></td>
                          <td>{lv.startDate} to {lv.endDate} <small className="text-secondary">({lv.days} {lv.days === 1 ? 'day' : 'days'})</small></td>
                          <td className="text-max-width" title={lv.reason}>{lv.reason}</td>
                          <td>
                            <span className={`table-badge ${
                              lv.status === 'Approved' ? 'badge-success' : 
                              lv.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                            }`}>
                              {lv.status}
                            </span>
                          </td>
                          <td className="text-secondary italic-text">{lv.notes || '--'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
