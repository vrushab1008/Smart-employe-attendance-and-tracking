import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import EmployeeDashboard from './components/EmployeeDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import Verification from './components/Verification';
import Toast from './components/Toast';
import { getDB, saveDB } from './db';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [db, setDb] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [currentView, setCurrentView] = useState('employee'); // 'employee' | 'manager'
  
  // Verification states
  const [showVerification, setShowVerification] = useState(false);
  const [verificationAction, setVerificationAction] = useState('Clock In'); // 'Clock In' | 'Clock Out'
  
  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  // 1. Initial database load
  useEffect(() => {
    const loadedDb = getDB();
    setDb(loadedDb);
    // Default logged-in employee: Alex Chen (EMP002) for simulation testing
    const defaultEmp = loadedDb.employees.find(e => e.id === "EMP002") || loadedDb.employees[0];
    setCurrentEmployee(defaultEmp);
  }, []);

  if (!db || !currentEmployee) {
    return (
      <div className="loading-viewport">
        <div className="loader-pulse"></div>
        <span>Initializing Secure Attendance Database...</span>
      </div>
    );
  }

  // 2. Notification Helper
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 3. Database Sync Helper
  const updateDBState = (updatedDb) => {
    setDb(updatedDb);
    saveDB(updatedDb);
  };

  // 4. Employee Actions
  const handleClockInTrigger = () => {
    setVerificationAction('Clock In');
    setShowVerification(true);
  };

  const handleClockOutTrigger = () => {
    setVerificationAction('Clock Out');
    setShowVerification(true);
  };

  const handleVerificationSuccess = (verificationResult) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowStr = new Date().toISOString();
    
    const updatedEmployees = db.employees.map(emp => {
      if (emp.id === currentEmployee.id) {
        const nextStatus = verificationAction === 'Clock In' ? 'Present' : 'Absent';
        const updated = { ...emp, status: nextStatus };
        // Sync active employee selection
        setCurrentEmployee(updated);
        return updated;
      }
      return emp;
    });

    let updatedLogs = [...db.logs];

    if (verificationAction === 'Clock In') {
      // Check if log already exists for today (e.g. manual edit done before)
      const existingLogIdx = updatedLogs.findIndex(l => l.empId === currentEmployee.id && l.date === todayStr);
      
      const inHour = new Date().getHours();
      const inMinute = new Date().getMinutes();
      const isLate = (inHour > 9) || (inHour === 9 && inMinute > 0); // Late after 09:00 AM

      const newLog = {
        id: `LOG_${todayStr}_${currentEmployee.id}`,
        empId: currentEmployee.id,
        empName: currentEmployee.name,
        date: todayStr,
        checkIn: nowStr,
        checkOut: null,
        status: isLate ? 'Late' : 'On Time',
        location: verificationResult.location,
        device: verificationResult.device,
        verification: verificationResult.verification
      };

      if (existingLogIdx > -1) {
        updatedLogs[existingLogIdx] = newLog;
      } else {
        updatedLogs.push(newLog);
      }
      
      addToast(`Clock-In verified. Welcome, ${currentEmployee.name}!`, 'success');
    } else {
      // Clock Out: Find today's check-in log
      const logIdx = updatedLogs.findIndex(l => l.empId === currentEmployee.id && l.date === todayStr);
      if (logIdx > -1) {
        updatedLogs[logIdx] = {
          ...updatedLogs[logIdx],
          checkOut: nowStr
        };
        addToast(`Clock-Out verified. Have a safe evening!`, 'success');
      } else {
        // Fallback log if checked in through other mechanisms
        updatedLogs.push({
          id: `LOG_${todayStr}_${currentEmployee.id}`,
          empId: currentEmployee.id,
          empName: currentEmployee.name,
          date: todayStr,
          checkIn: new Date(new Date().setHours(9,0,0)).toISOString(),
          checkOut: nowStr,
          status: 'On Time',
          location: verificationResult.location,
          device: verificationResult.device,
          verification: verificationResult.verification
        });
        addToast(`Clock-Out verified. Log created.`, 'success');
      }
    }

    updateDBState({
      ...db,
      employees: updatedEmployees,
      logs: updatedLogs
    });

    setShowVerification(false);
  };

  const handleToggleBreak = (action) => {
    const nextStatus = action === 'start' ? 'On Break' : 'Present';
    
    const updatedEmployees = db.employees.map(emp => {
      if (emp.id === currentEmployee.id) {
        const updated = { ...emp, status: nextStatus };
        setCurrentEmployee(updated);
        return updated;
      }
      return emp;
    });

    updateDBState({
      ...db,
      employees: updatedEmployees
    });

    if (action === 'start') {
      addToast("Status updated to On Break.", "warning");
    } else {
      addToast("Status updated to Present. Resumed work.", "success");
    }
  };

  const handleSubmitLeave = (leaveDetails) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newLeaveId = `LV${String(db.leaves.length + 1).padStart(3, '0')}`;
    
    const newLeave = {
      id: newLeaveId,
      empId: currentEmployee.id,
      empName: currentEmployee.name,
      type: leaveDetails.type,
      startDate: leaveDetails.startDate,
      endDate: leaveDetails.endDate,
      days: leaveDetails.days,
      reason: leaveDetails.reason,
      status: 'Pending',
      appliedOn: todayStr,
      notes: ''
    };

    updateDBState({
      ...db,
      leaves: [newLeave, ...db.leaves]
    });

    addToast("Leave request filed. Awaiting manager approval.", "info");
  };

  // 5. Manager Actions
  const handleApproveLeave = (leaveId, managerNotes) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    let targetEmpId = '';
    let isLeaveToday = false;

    const updatedLeaves = db.leaves.map(lv => {
      if (lv.id === leaveId) {
        targetEmpId = lv.empId;
        // Check if today falls in the leave dates range
        const start = new Date(lv.startDate);
        const end = new Date(lv.endDate);
        const today = new Date(todayStr);
        isLeaveToday = today >= start && today <= end;
        
        return { ...lv, status: 'Approved', notes: managerNotes };
      }
      return lv;
    });

    // If leave overlaps with today, update employee status to "On Leave"
    const updatedEmployees = db.employees.map(emp => {
      if (emp.id === targetEmpId && isLeaveToday) {
        // If they were selected in employee view, sync their visual card
        const updated = { ...emp, status: 'On Leave' };
        if (currentEmployee.id === targetEmpId) {
          setCurrentEmployee(updated);
        }
        return updated;
      }
      return emp;
    });

    updateDBState({
      ...db,
      leaves: updatedLeaves,
      employees: updatedEmployees
    });

    addToast("Leave request approved successfully.", "success");
  };

  const handleRejectLeave = (leaveId, managerNotes) => {
    const updatedLeaves = db.leaves.map(lv => {
      if (lv.id === leaveId) {
        return { ...lv, status: 'Rejected', notes: managerNotes };
      }
      return lv;
    });

    updateDBState({
      ...db,
      leaves: updatedLeaves
    });

    addToast("Leave request rejected.", "info");
  };

  const handleManualAdjustment = (params) => {
    const { empId, date, checkInTime, checkOutTime, location, status } = params;
    
    let updatedLogs = [...db.logs];
    const logIndex = updatedLogs.findIndex(l => l.empId === empId && l.date === date);

    const empObj = db.employees.find(e => e.id === empId);

    let nextStatus = 'Absent';
    if (checkInTime && !checkOutTime) {
      nextStatus = 'Present';
    } else if (checkInTime && checkOutTime) {
      nextStatus = 'Absent'; // Clocked out
    }

    const updatedEmployees = db.employees.map(emp => {
      if (emp.id === empId) {
        const updated = { ...emp, status: nextStatus };
        if (currentEmployee.id === empId) {
          setCurrentEmployee(updated);
        }
        return updated;
      }
      return emp;
    });

    const newLog = {
      id: logIndex > -1 ? updatedLogs[logIndex].id : `LOG_${date}_${empId}`,
      empId: empId,
      empName: empObj.name,
      date: date,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      status: status,
      location: location,
      device: 'Manual Entry (Override)',
      verification: ['Admin Override']
    };

    if (logIndex > -1) {
      // Edit
      if (!checkInTime && !checkOutTime) {
        // Delete record
        updatedLogs.splice(logIndex, 1);
      } else {
        updatedLogs[logIndex] = newLog;
      }
    } else {
      // Add
      if (checkInTime || checkOutTime) {
        updatedLogs.push(newLog);
      }
    }

    updateDBState({
      ...db,
      employees: updatedEmployees,
      logs: updatedLogs
    });

    addToast(`Logs adjusted for ${empObj.name}`, "success");
  };

  return (
    <div className="chronos-app-viewport">
      
      {/* NAVBAR */}
      <Navbar 
        employees={db.employees}
        currentEmployee={currentEmployee}
        setCurrentEmployee={(emp) => {
          setCurrentEmployee(emp);
          addToast(`Simulating login as: ${emp.name}`, "info");
        }}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* DASHBOARDS RENDER */}
      <main className="main-content-section">
        {currentView === 'employee' ? (
          <EmployeeDashboard 
            employee={currentEmployee}
            logs={db.logs}
            leaves={db.leaves}
            onClockInTrigger={handleClockInTrigger}
            onClockOutTrigger={handleClockOutTrigger}
            onToggleBreak={handleToggleBreak}
            onSubmitLeave={handleSubmitLeave}
            addToast={addToast}
          />
        ) : (
          <ManagerDashboard 
            employees={db.employees}
            logs={db.logs}
            leaves={db.leaves}
            onApproveLeave={handleApproveLeave}
            onRejectLeave={handleRejectLeave}
            onManualAdjustment={handleManualAdjustment}
            addToast={addToast}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="main-footer-credits">
        <div className="credits-left">
          <ShieldCheck size={14} className="success-icon-glow" />
          <span>Chronos Attendance System v1.4.0 (Protected)</span>
        </div>
        <div className="credits-right">
          <span>DAY 12 React Web Application Assignment</span>
        </div>
      </footer>

      {/* SMART MULTI-FACTOR VERIFICATION PORTAL */}
      {showVerification && (
        <Verification 
          actionType={verificationAction}
          employee={currentEmployee}
          onSuccess={handleVerificationSuccess}
          onCancel={() => setShowVerification(false)}
        />
      )}

      {/* TOAST CONTAINER */}
      <div className="toast-notifications-container">
        {toasts.map(toast => (
          <Toast 
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

    </div>
  );
}
