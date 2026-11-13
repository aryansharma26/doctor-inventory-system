import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  UserCheck,
  Users,
  UserX,
  XCircle,
} from "lucide-react";
import { useState } from "react";

// Types
type Status = "Present" | "Absent" | "Late" | "Half-Day";

interface Staff {
  id: string;
  name: string;
  role: string;
  checkIn: string | null;
  checkOut: string | null;
  status: Status;
  hoursWorked: number;
}

const initialStaff: Staff[] = [
  {
    id: "1",
    name: "Maria Santos",
    role: "Head Nurse",
    checkIn: "08:00 AM",
    checkOut: null,
    status: "Present",
    hoursWorked: 4.5,
  },
  {
    id: "2",
    name: "Juan Dela Cruz",
    role: "Pharmacist",
    checkIn: "08:15 AM",
    checkOut: null,
    status: "Late",
    hoursWorked: 4.25,
  },
  {
    id: "3",
    name: "Ana Reyes",
    role: "Receptionist",
    checkIn: "07:50 AM",
    checkOut: null,
    status: "Present",
    hoursWorked: 4.75,
  },
  {
    id: "4",
    name: "Jose Garcia",
    role: "Lab Technician",
    checkIn: null,
    checkOut: null,
    status: "Absent",
    hoursWorked: 0,
  },
  {
    id: "5",
    name: "Pedro Mendoza",
    role: "Nurse",
    checkIn: "08:05 AM",
    checkOut: null,
    status: "Present",
    hoursWorked: 4.4,
  },
  {
    id: "6",
    name: "Rosa Fernandez",
    role: "Admin",
    checkIn: "09:30 AM",
    checkOut: null,
    status: "Half-Day",
    hoursWorked: 3,
  },
  {
    id: "7",
    name: "Luis Villanueva",
    role: "Janitor",
    checkIn: "07:30 AM",
    checkOut: null,
    status: "Present",
    hoursWorked: 5,
  },
  {
    id: "8",
    name: "Carmen Bautista",
    role: "Billing Specialist",
    checkIn: null,
    checkOut: null,
    status: "Absent",
    hoursWorked: 0,
  },
];

export function AttendancePage() {
  const [staffMembers, setStaffMembers] = useState<Staff[]>(initialStaff);

  const totalStaff = staffMembers.length;
  const presentToday = staffMembers.filter(
    (s) => s.status === "Present",
  ).length;
  const absentToday = staffMembers.filter((s) => s.status === "Absent").length;
  const lateToday = staffMembers.filter((s) => s.status === "Late").length;

  const handleCheckIn = (id: string) => {
    setStaffMembers((prev) =>
      prev.map((staff) =>
        staff.id === id
          ? {
              ...staff,
              checkIn: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              status: "Present",
            }
          : staff,
      ),
    );
  };

  const handleCheckOut = (id: string) => {
    setStaffMembers((prev) =>
      prev.map((staff) =>
        staff.id === id
          ? {
              ...staff,
              checkOut: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          : staff,
      ),
    );
  };

  const markAllPresent = () => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setStaffMembers((prev) =>
      prev.map((staff) => ({
        ...staff,
        checkIn: staff.checkIn || time,
        status: staff.status === "Absent" ? "Present" : staff.status,
      })),
    );
  };

  // Generate calendar days for current month (mock)
  const daysInMonth = 30; // Mock 30 days
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Calendar size={240} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-blue-400">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium tracking-wide uppercase text-sm">
                Human Resources
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Staff Attendance</h1>
            <p className="text-slate-400">
              Manage daily check-ins and attendance records
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-sm text-slate-300 font-medium mb-1">
              Today's Date
            </p>
            <p className="text-xl font-bold">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-500 font-medium text-sm">Total Staff</p>
            <p className="text-3xl font-bold text-slate-900">{totalStaff}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-500 font-medium text-sm">Present Today</p>
            <p className="text-3xl font-bold text-slate-900">{presentToday}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <UserX className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-500 font-medium text-sm">Absent Today</p>
            <p className="text-3xl font-bold text-slate-900">{absentToday}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-500 font-medium text-sm">Late Today</p>
            <p className="text-3xl font-bold text-slate-900">{lateToday}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900">Today's Roster</h2>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                <Clock className="w-3 h-3" /> Locked to Real-time
              </span>
              <button
                onClick={markAllPresent}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Mark All Present
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-start gap-2 text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-medium">
              <strong>Security Note:</strong> Attendance can only be marked for
              today. Once checked in or out, records cannot be edited or
              backdated.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                  <th className="font-medium p-4 pl-6">Staff Member</th>
                  <th className="font-medium p-4">Status</th>
                  <th className="font-medium p-4">Check In</th>
                  <th className="font-medium p-4">Check Out</th>
                  <th className="font-medium p-4">Hours</th>
                  <th className="font-medium p-4 pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffMembers.map((staff) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <p className="font-bold text-slate-900">{staff.name}</p>
                      <p className="text-sm text-slate-500">{staff.role}</p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          staff.status === "Present"
                            ? "bg-emerald-100 text-emerald-700"
                            : staff.status === "Absent"
                              ? "bg-rose-100 text-rose-700"
                              : staff.status === "Late"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {staff.status === "Present" && (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        {staff.status === "Absent" && (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {(staff.status === "Late" ||
                          staff.status === "Half-Day") && (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {staff.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {staff.checkIn || "-"}
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {staff.checkOut || "-"}
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {staff.hoursWorked}h
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex gap-2">
                        {!staff.checkIn && (
                          <button
                            onClick={() => handleCheckIn(staff.id)}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                          >
                            Check In
                          </button>
                        )}
                        {staff.checkIn && !staff.checkOut && (
                          <button
                            onClick={() => handleCheckOut(staff.id)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                          >
                            Check Out
                          </button>
                        )}
                        {staff.checkIn && staff.checkOut && (
                          <span className="text-xs text-slate-400 font-medium px-2 py-1.5">
                            Completed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calendar Summary */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Monthly Overview
            </h2>
            <button className="text-blue-600 font-medium text-sm hover:underline">
              View Full
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500 mb-2">
            <div>S</div>
            <div>M</div>
            <div>T</div>
            <div>W</div>
            <div>T</div>
            <div>F</div>
            <div>S</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Blank spaces for first day offset */}
            <div className="aspect-square"></div>
            <div className="aspect-square"></div>

            {calendarDays.map((day) => {
              // Mock logic for colors
              const isToday = day === new Date().getDate();
              const isWeekend = (day + 2) % 7 === 0 || (day + 3) % 7 === 0;
              const hasAlert = day === 12 || day === 18;

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-xl flex items-center justify-center text-sm font-semibold transition-transform hover:scale-110 cursor-pointer
                    ${
                      isToday
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : isWeekend
                          ? "text-slate-300"
                          : hasAlert
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }
                  `}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <div className="mt-8 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Legend
            </h3>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div> Perfect
                Attendance
              </div>
              <span className="font-medium">18 days</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-3 h-3 rounded-full bg-amber-400"></div> Staff
                Shortage
              </div>
              <span className="font-medium">2 days</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div> Holiday
                / Closed
              </div>
              <span className="font-medium">0 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
