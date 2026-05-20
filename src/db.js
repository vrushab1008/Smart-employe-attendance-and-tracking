// Preloaded Mock Data for Chronos Employee Attendance Tracker

const DEFAULT_EMPLOYEES = [
  { id: "EMP001", name: "Sarah Jenkins", role: "HR Operations Director", dept: "Human Resources", status: "Present", color: "#ec4899", email: "sarah.j@chronos.io" },
  { id: "EMP002", name: "Alex Chen", role: "Senior Frontend Engineer", dept: "Engineering", status: "Present", color: "#3b82f6", email: "alex.c@chronos.io" },
  { id: "EMP003", name: "Jessica Taylor", role: "Lead UI/UX Designer", dept: "Design", status: "Absent", color: "#8b5cf6", email: "jessica.t@chronos.io" },
  { id: "EMP004", name: "Marcus Johnson", role: "Staff Backend Engineer", dept: "Engineering", status: "Present", color: "#10b981", email: "marcus.j@chronos.io" },
  { id: "EMP005", name: "Elena Rostova", role: "R&D AI Researcher", dept: "Research & Development", status: "On Break", color: "#f59e0b", email: "elena.r@chronos.io" },
  { id: "EMP006", name: "David Miller", role: "Lead Product Manager", dept: "Product", status: "Present", color: "#06b6d4", email: "david.m@chronos.io" },
  { id: "EMP007", name: "Priya Patel", role: "QA Engineering Lead", dept: "Engineering", status: "On Leave", color: "#14b8a6", email: "priya.p@chronos.io" },
  { id: "EMP008", name: "Liam O'Connor", role: "DevOps Architect", dept: "Infrastructure", status: "Absent", color: "#f43f5e", email: "liam.o@chronos.io" }
];

// Seed logs for the past 5 days to populate charts
const generateMockLogs = () => {
  const logs = [];
  const employees = DEFAULT_EMPLOYEES;
  const today = new Date();
  
  // Generating past 5 days of records
  for (let i = 5; i >= 1; i--) {
    const logDate = new Date(today);
    logDate.setDate(today.getDate() - i);
    const dateStr = logDate.toISOString().split('T')[0];
    
    employees.forEach(emp => {
      // Priya is on leave, so no logs except leave records
      if (emp.id === "EMP007") return;
      
      // Randomly exclude some employees to simulate absentees
      const isAbsent = Math.random() > 0.9;
      if (isAbsent) return;
      
      const isLate = Math.random() > 0.8;
      const checkInHour = isLate ? 9 : 8;
      const checkInMin = Math.floor(Math.random() * 30) + (isLate ? 15 : 0);
      const checkOutHour = 17;
      const checkOutMin = Math.floor(Math.random() * 30);
      
      const checkInTime = `${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}:00`;
      const checkOutTime = `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')}:00`;
      
      logs.push({
        id: `LOG_${dateStr}_${emp.id}`,
        empId: emp.id,
        empName: emp.name,
        date: dateStr,
        checkIn: `${dateStr}T${checkInTime}`,
        checkOut: `${dateStr}T${checkOutTime}`,
        status: isLate ? "Late" : "On Time",
        device: "MacBook Pro - Chrome",
        location: Math.random() > 0.25 ? "HQ Office" : "Remote",
        verification: ["Face ID", "Geofence", "PIN"]
      });
    });
  }
  
  // Add some logs for today
  const todayStr = today.toISOString().split('T')[0];
  logs.push(
    {
      id: `LOG_${todayStr}_EMP001`,
      empId: "EMP001",
      empName: "Sarah Jenkins",
      date: todayStr,
      checkIn: `${todayStr}T08:45:00`,
      checkOut: null,
      status: "On Time",
      device: "iPhone 15 - Safari",
      location: "HQ Office",
      verification: ["Face ID", "Geofence"]
    },
    {
      id: `LOG_${todayStr}_EMP002`,
      empId: "EMP002",
      empName: "Alex Chen",
      date: todayStr,
      checkIn: `${todayStr}T08:58:00`,
      checkOut: null,
      status: "On Time",
      device: "MacBook Pro - Chrome",
      location: "HQ Office",
      verification: ["Face ID", "Geofence", "PIN"]
    },
    {
      id: `LOG_${todayStr}_EMP004`,
      empId: "EMP004",
      empName: "Marcus Johnson",
      date: todayStr,
      checkIn: `${todayStr}T09:20:00`,
      checkOut: null,
      status: "Late",
      device: "Windows Desktop - Edge",
      location: "Remote",
      verification: ["Face ID", "PIN"]
    },
    {
      id: `LOG_${todayStr}_EMP005`,
      empId: "EMP005",
      empName: "Elena Rostova",
      date: todayStr,
      checkIn: `${todayStr}T08:30:00`,
      checkOut: null,
      status: "On Time",
      device: "MacBook Air - Firefox",
      location: "HQ Office",
      verification: ["Face ID", "Geofence", "PIN"]
    },
    {
      id: `LOG_${todayStr}_EMP006`,
      empId: "EMP006",
      empName: "David Miller",
      date: todayStr,
      checkIn: `${todayStr}T08:52:00`,
      checkOut: null,
      status: "On Time",
      device: "Google Pixel 8 - Chrome",
      location: "HQ Office",
      verification: ["Face ID", "Geofence"]
    }
  );
  
  return logs;
};

const DEFAULT_LEAVES = [
  {
    id: "LV001",
    empId: "EMP007",
    empName: "Priya Patel",
    type: "Annual Leave",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0],
    days: 4,
    reason: "Family wedding event in Boston",
    status: "Approved",
    appliedOn: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0],
    notes: "Approved by Admin - Coverage arranged with Marcus"
  },
  {
    id: "LV002",
    empId: "EMP003",
    empName: "Jessica Taylor",
    type: "Sick Leave",
    startDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0],
    days: 1,
    reason: "Scheduled dental surgery",
    status: "Pending",
    appliedOn: new Date().toISOString().split('T')[0],
    notes: ""
  },
  {
    id: "LV003",
    empId: "EMP008",
    empName: "Liam O'Connor",
    type: "Casual Leave",
    startDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().split('T')[0],
    days: 2,
    reason: "Personal home maintenance",
    status: "Pending",
    appliedOn: new Date().toISOString().split('T')[0],
    notes: ""
  }
];

// HQ Geofence parameters
export const HQ_COORDINATES = {
  latitude: 37.774929,
  longitude: -122.419416,
  radiusMeters: 200
};

// Initial database loading and storage utilities
export const getDB = () => {
  let employees = localStorage.getItem("chronos_employees");
  let logs = localStorage.getItem("chronos_logs");
  let leaves = localStorage.getItem("chronos_leaves");

  if (!employees) {
    localStorage.setItem("chronos_employees", JSON.stringify(DEFAULT_EMPLOYEES));
    employees = JSON.stringify(DEFAULT_EMPLOYEES);
  }
  if (!logs) {
    const mockLogs = generateMockLogs();
    localStorage.setItem("chronos_logs", JSON.stringify(mockLogs));
    logs = JSON.stringify(mockLogs);
  }
  if (!leaves) {
    localStorage.setItem("chronos_leaves", JSON.stringify(DEFAULT_LEAVES));
    leaves = JSON.stringify(DEFAULT_LEAVES);
  }

  return {
    employees: JSON.parse(employees),
    logs: JSON.parse(logs),
    leaves: JSON.parse(leaves)
  };
};

export const saveDB = (data) => {
  if (data.employees) localStorage.setItem("chronos_employees", JSON.stringify(data.employees));
  if (data.logs) localStorage.setItem("chronos_logs", JSON.stringify(data.logs));
  if (data.leaves) localStorage.setItem("chronos_leaves", JSON.stringify(data.leaves));
};

// Clear database helper
export const resetDB = () => {
  localStorage.removeItem("chronos_employees");
  localStorage.removeItem("chronos_logs");
  localStorage.removeItem("chronos_leaves");
  return getDB();
};
