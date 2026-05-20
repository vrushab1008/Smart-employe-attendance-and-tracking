import React, { useState, useEffect } from 'react';
import { Calendar, Users, Eye, LogOut, Clock, ArrowRightLeft } from 'lucide-react';

export default function Navbar({ 
  employees, 
  currentEmployee, 
  setCurrentEmployee, 
  currentView, 
  setCurrentView 
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <header className="main-header glass-container">
      <div className="header-logo">
        <div className="logo-icon-wrapper">
          <Calendar size={22} className="logo-icon" />
          <Clock size={12} className="logo-subicon" />
        </div>
        <div className="logo-text">
          <span className="logo-brand">CHRONOS</span>
          <span className="logo-subtext">SMART ATTENDANCE</span>
        </div>
      </div>

      <div className="header-center">
        {/* Portal Switcher */}
        <div className="portal-switcher">
          <button 
            className={`portal-btn ${currentView === 'employee' ? 'active' : ''}`}
            onClick={() => setCurrentView('employee')}
          >
            <Eye size={16} />
            <span>Employee View</span>
          </button>
          <button 
            className={`portal-btn ${currentView === 'manager' ? 'active' : ''}`}
            onClick={() => setCurrentView('manager')}
          >
            <Users size={16} />
            <span>Manager View</span>
          </button>
        </div>
      </div>

      <div className="header-right">
        {/* Live Clock */}
        <div className="header-clock">
          <Clock size={16} className="clock-icon-glow" />
          <div className="clock-values">
            <span className="clock-time">{formatTime(time)}</span>
            <span className="clock-date">{formatDate(time)}</span>
          </div>
        </div>

        {/* User Switcher Dropdown (Simulation Tool) */}
        <div className="user-profile-widget">
          <div className="profile-avatar" style={{ backgroundColor: currentEmployee.color }}>
            {currentEmployee.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="profile-details">
            <span className="profile-name">{currentEmployee.name}</span>
            <span className="profile-role">{currentEmployee.role}</span>
          </div>
          <div className="profile-switcher-wrapper">
            <select 
              value={currentEmployee.id}
              onChange={(e) => {
                const selected = employees.find(emp => emp.id === e.target.value);
                if (selected) setCurrentEmployee(selected);
              }}
              className="employee-select-dropdown"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.dept})
                </option>
              ))}
            </select>
            <ArrowRightLeft size={12} className="dropdown-arrow-icon" />
          </div>
        </div>
      </div>
    </header>
  );
}
