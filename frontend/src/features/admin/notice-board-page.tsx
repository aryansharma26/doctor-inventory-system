import {
  AlertTriangle,
  Bell,
  Info,
  Megaphone,
  Pin,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

type Priority = "Normal" | "Important" | "Urgent";

interface Notice {
  id: string;
  title: string;
  message: string;
  priority: Priority;
  postedBy: string;
  date: string;
  isPinned: boolean;
}

const DEMO_NOTICES: Notice[] = [
  {
    id: "1",
    title: "Emergency Equipment Maintenance",
    message:
      "The backup generator and sterilization equipment will undergo emergency maintenance today from 2 PM to 4 PM. Please plan accordingly.",
    priority: "Urgent",
    postedBy: "Dr. Santos (Head Physician)",
    date: "2026-07-30 08:00 AM",
    isPinned: true,
  },
  {
    id: "2",
    title: "New PhilHealth Billing Guidelines",
    message:
      "Please review the updated PhilHealth Konsulta package billing guidelines effective next month. All billing staff must attend the briefing tomorrow.",
    priority: "Important",
    postedBy: "Maria (Billing Dept)",
    date: "2026-07-29 03:15 PM",
    isPinned: false,
  },
  {
    id: "3",
    title: "Updated COVID-19 Protocol",
    message:
      "Masks are now optional in the waiting area but remain mandatory inside consultation rooms. Please remind patients.",
    priority: "Important",
    postedBy: "Clinic Administration",
    date: "2026-07-28 10:30 AM",
    isPinned: false,
  },
  {
    id: "4",
    title: "Monthly Staff Meeting",
    message:
      "Our regular monthly staff meeting will be held this Friday at 12:00 NN in the break room. Lunch will be provided (Jollibee).",
    priority: "Normal",
    postedBy: "HR Department",
    date: "2026-07-27 09:00 AM",
    isPinned: false,
  },
  {
    id: "5",
    title: "Clinic Holiday Schedule - December 2026",
    message:
      "Please submit your leave requests for the upcoming Christmas holidays by the end of November. The clinic will be closed on Dec 25 and Jan 1.",
    priority: "Normal",
    postedBy: "HR Department",
    date: "2026-07-25 11:45 AM",
    isPinned: false,
  },
];

export function NoticeBoardPage() {
  const [notices, setNotices] = useState<Notice[]>(DEMO_NOTICES);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Priority>("Normal");
  const [postedBy, setPostedBy] = useState("");

  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || !postedBy) return;

    const newNotice: Notice = {
      id: Date.now().toString(),
      title,
      message,
      priority,
      postedBy,
      date: new Date().toLocaleString("en-PH", {
        dateStyle: "long",
        timeStyle: "short",
      }),
      isPinned: false,
    };

    setNotices([newNotice, ...notices]);
    setTitle("");
    setMessage("");
    setPriority("Normal");
    setPostedBy("");
  };

  const handleDelete = (id: string) => {
    setNotices(notices.filter((n) => n.id !== id));
  };

  const togglePin = (id: string) => {
    setNotices(
      notices.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)),
    );
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case "Urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "Important":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Normal":
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const getPriorityIcon = (p: Priority) => {
    switch (p) {
      case "Urgent":
        return <AlertTriangle className="w-4 h-4 mr-1" />;
      case "Important":
        return <Bell className="w-4 h-4 mr-1" />;
      case "Normal":
      default:
        return <Info className="w-4 h-4 mr-1" />;
    }
  };

  const sortedNotices = [...notices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Megaphone className="w-8 h-8" />
            Clinic Notice Board
          </h1>
          <p className="text-indigo-100 text-lg">
            Internal announcements & updates for all staff
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 sticky top-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" />
              Post New Notice
            </h2>
            <form onSubmit={handleAddNotice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-colors p-3"
                  placeholder="e.g. System Maintenance"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-colors p-3 resize-none"
                  placeholder="Enter notice details..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-colors p-3"
                >
                  <option value="Normal">Normal</option>
                  <option value="Important">Important</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posted By
                </label>
                <input
                  type="text"
                  value={postedBy}
                  onChange={(e) => setPostedBy(e.target.value)}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-colors p-3"
                  placeholder="Your Name / Department"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2 mt-4"
              >
                <Megaphone className="w-5 h-5" />
                Post Announcement
              </button>
            </form>
          </div>
        </div>

        {/* Notices List Column */}
        <div className="lg:col-span-2 space-y-4">
          {sortedNotices.length === 0 ? (
            <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                No notices posted yet.
              </p>
            </div>
          ) : (
            sortedNotices.map((notice) => (
              <div
                key={notice.id}
                className={`bg-white rounded-3xl p-6 shadow-xl border-l-4 transition-all duration-300 ${
                  notice.isPinned
                    ? "border-l-indigo-500 ring-1 ring-indigo-100"
                    : "border-l-transparent"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900">
                        {notice.title}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notice.priority)}`}
                      >
                        {getPriorityIcon(notice.priority)}
                        {notice.priority}
                      </span>
                      {notice.isPinned && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                          <Pin className="w-3 h-3 mr-1 fill-current" />
                          Pinned
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed mb-4">
                      {notice.message}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-4">
                      <span className="font-medium text-gray-700">
                        {notice.postedBy}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span>{notice.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePin(notice.id)}
                      className={`p-2 rounded-xl transition-colors ${
                        notice.isPinned
                          ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                      title={notice.isPinned ? "Unpin" : "Pin to top"}
                    >
                      <Pin
                        className={`w-5 h-5 ${notice.isPinned ? "fill-current" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(notice.id)}
                      className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Delete notice"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
