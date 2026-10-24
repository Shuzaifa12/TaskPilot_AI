import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Sparkles,
  CheckSquare,
  Settings as SettingsIcon,
  ShieldCheck,
  Send,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Edit3,
  Filter,
  BarChart2,
  Terminal,
  ArrowRight,
  HelpCircle,
  FileText,
  User,
  ChevronRight,
  Layers,
  Activity,
  CheckCircle,
  XCircle,
  ShieldAlert,
  ListOrdered,
  Play,
  Database
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: "high" | "medium" | "low";
  durationDays: number;
  dependencies: string[];
  dueDate: string | null;
  status: "pending" | "completed" | "blocked";
  assignedTo?: string | null;
}

interface ApprovalItem {
  id: string;
  actionType: string;
  title: string;
  reason: string;
  parameters: any;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  step: string;
  toolName?: string | null;
  arguments?: any;
  result?: any;
  status: string;
  detail: string;
}

interface AnalysisResult {
  summary: string;
  deliverables: string[];
  tasks: Task[];
  risks: Array<{ category: string; description: string; mitigation: string }>;
  missingDetails: string[];
  clientReplyDraft: string;
}

const EXAMPLE_BRIEFS = [
  {
    title: "E-commerce Mobile Checkout Overhaul",
    text: "We need an urgent checkout redesign for mobile before Black Friday. Payment drop-off rate is 24% due to slow loading. We need guest checkout, Apple Pay, and address validation. Deliverables must include wireframes, API integration, and staging deployment."
  },
  {
    title: "Enterprise SaaS Rate Limiting & Security",
    text: "Enterprise clients are hitting 429 errors on the v2 analytics API during peak morning batch jobs. We need Redis token bucket rate limiting, updated OpenAPI documentation, and customer notification emails sent out by next Tuesday."
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"overview" | "analyze" | "tasks" | "approvals" | "audit" | "tests" | "settings">("overview");
  const [clientMessage, setClientMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [timeline, setTimeline] = useState<Array<{ timestamp: string; step: string; detail: string }>>([]);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  const [dbErrorBanner, setDbErrorBanner] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [testSuiteResult, setTestSuiteResult] = useState<any>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [tasksRes, approvalsRes, auditRes, healthRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/approvals"),
        fetch("/api/audit-log"),
        fetch("/api/health")
      ]);
      
      const healthData = await healthRes.json();
      setHealthStatus(healthData);

      if (!tasksRes.ok) {
        const errJson = await tasksRes.json();
        setDbErrorBanner(errJson.error || "PostgreSQL database configuration required (DATABASE_URL missing).");
        setTasks([]);
        setApprovals([]);
        setAuditLog([]);
      } else {
        const tasksData = await tasksRes.json();
        const approvalsData = await approvalsRes.json();
        const auditData = await auditRes.json();
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setApprovals(Array.isArray(approvalsData) ? approvalsData : []);
        setAuditLog(Array.isArray(auditData) ? auditData : []);
        setDbErrorBanner(null);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setDbErrorBanner("Unable to reach backend server or database.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleAnalyze = async (textToAnalyze?: string) => {
    const message = textToAnalyze || clientMessage;
    if (!message.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setTimeline([]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze brief with Gemma 4");
      }

      setAnalysis(data.analysis);
      setTimeline(data.timeline || []);
      fetchAllData();
      setActiveTab("analyze");
    } catch (err: any) {
      setError(err.message || "An error occurred during Gemma 4 analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    fetchAllData();
  };

  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    fetchAllData();
  };

  const handleApprovalDecision = async (approvalId: string, decision: "approve" | "reject") => {
    await fetch(`/api/approvals/${approvalId}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision })
    });
    fetchAllData();
  };

  const runAutomatedTests = async () => {
    setIsRunningTests(true);
    setTestSuiteResult(null);
    try {
      const res = await fetch("/api/tests/run", { method: "POST" });
      const data = await res.json();
      setTestSuiteResult(data);
      fetchAllData();
    } catch (err: any) {
      console.error("Test execution failed", err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleCopyReply = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const blockedTasks = tasks.filter(t => t.status === "blocked").length;
  const pendingTasks = totalTasks - completedTasks - blockedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const pieData = [
    { name: "Completed", value: completedTasks, color: "#10b981" },
    { name: "Pending", value: pendingTasks, color: "#6366f1" },
    { name: "Blocked", value: blockedTasks, color: "#ef4444" },
  ];

  const priorityCounts = {
    high: tasks.filter(t => t.priority === "high").length,
    medium: tasks.filter(t => t.priority === "medium").length,
    low: tasks.filter(t => t.priority === "low").length,
  };

  const barData = [
    { name: "High Priority", count: priorityCounts.high, fill: "#ef4444" },
    { name: "Medium Priority", count: priorityCounts.medium, fill: "#f59e0b" },
    { name: "Low Priority", count: priorityCounts.low, fill: "#3b82f6" },
  ];

  const filteredTasks = tasks.filter(t => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const pendingApprovalsCount = approvals.filter(a => a.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 hidden md:flex">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight">TaskPilot AI</h1>
            <p className="text-xs text-purple-400 font-medium">PostgreSQL Agent</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "overview" ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Risk Dashboard
          </button>
          <button
            onClick={() => setActiveTab("analyze")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "analyze" ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Smart Planning & Brief
            {analysis && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400"></span>}
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "tasks" ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Task Execution
            <span className="ml-auto px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded-full">{tasks.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "approvals" ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Approval Center
            {pendingApprovalsCount > 0 && (
              <span className="ml-auto px-2 py-0.5 text-xs bg-amber-500 text-slate-950 font-bold rounded-full">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "audit" ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Audit Timeline
          </button>
          <button
            onClick={() => setActiveTab("tests")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "tests" ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Play className="w-4 h-4" />
            Test Suite
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "settings" ? "bg-purple-600 text-white shadow-md shadow-purple-600/20" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            Database & Config
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-1">
              <Database className="w-3.5 h-3.5" />
              <span>PostgreSQL / Drizzle</span>
            </div>
            <p className="text-xs text-slate-400 truncate">{healthStatus?.persistence || "Checking..."}</p>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900">TaskPilot AI</span>
            </div>
            <h2 className="text-sm font-semibold text-slate-700 hidden md:block">
              {activeTab === "overview" && "Live Risk Dashboard & Analytics"}
              {activeTab === "analyze" && "Smart Project Planning & Brief Analysis"}
              {activeTab === "tasks" && "Real Task Execution & PostgreSQL Storage"}
              {activeTab === "approvals" && "Human Approval Center"}
              {activeTab === "audit" && "Explainable Agent Activity Audit Log"}
              {activeTab === "tests" && "Automated Test Suite Runner"}
              {activeTab === "settings" && "Database Configuration & Diagnostics"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 border border-slate-200">
              <span className={`w-2 h-2 rounded-full ${healthStatus?.keyPresent ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
              <span>{healthStatus?.keyPresent ? "Gemma 4 Ready" : "Key Unconfigured"}</span>
            </div>
            <button
              onClick={() => setActiveTab("analyze")}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Analysis</span>
            </button>
          </div>
        </header>

        {/* Database Error Banner if DATABASE_URL is missing */}
        {dbErrorBanner && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>PostgreSQL Database Configuration Required:</strong> {dbErrorBanner} Please configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">DATABASE_URL</code> in your Settings &gt; Secrets panel, then run <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">npx drizzle-kit push</code>.</span>
            </div>
            <button
              onClick={() => setActiveTab("settings")}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0"
            >
              Configure DB
            </button>
          </div>
        )}

        {/* Mobile subnav */}
        <div className="md:hidden flex border-b border-slate-200 bg-white px-4 py-2 gap-2 overflow-x-auto">
          <button onClick={() => setActiveTab("overview")} className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${activeTab === "overview" ? "bg-purple-600 text-white" : "text-slate-600 bg-slate-100"}`}>Dashboard</button>
          <button onClick={() => setActiveTab("analyze")} className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${activeTab === "analyze" ? "bg-purple-600 text-white" : "text-slate-600 bg-slate-100"}`}>Planning</button>
          <button onClick={() => setActiveTab("tasks")} className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${activeTab === "tasks" ? "bg-purple-600 text-white" : "text-slate-600 bg-slate-100"}`}>Tasks ({tasks.length})</button>
          <button onClick={() => setActiveTab("approvals")} className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${activeTab === "approvals" ? "bg-purple-600 text-white" : "text-slate-600 bg-slate-100"}`}>Approvals</button>
          <button onClick={() => setActiveTab("audit")} className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${activeTab === "audit" ? "bg-purple-600 text-white" : "text-slate-600 bg-slate-100"}`}>Audit</button>
          <button onClick={() => setActiveTab("tests")} className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${activeTab === "tests" ? "bg-purple-600 text-white" : "text-slate-600 bg-slate-100"}`}>Tests</button>
          <button onClick={() => setActiveTab("settings")} className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${activeTab === "settings" ? "bg-purple-600 text-white" : "text-slate-600 bg-slate-100"}`}>Settings</button>
        </div>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* RISK DASHBOARD & OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="max-w-2xl relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold">
                    <Database className="w-3.5 h-3.5" />
                    <span>PostgreSQL & Drizzle ORM Persistence</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    From messy briefs to persistent execution.
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    TaskPilot AI persists tasks, approvals, and audit logs to PostgreSQL. Configure your DATABASE_URL in Settings &gt; Secrets to enable permanent database storage.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setActiveTab("analyze")}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
                    >
                      <span>Analyze New Brief</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveTab("settings")}
                      className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
                    >
                      <Database className="w-4 h-4 text-purple-400" />
                      <span>Database Setup Instructions</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tasks</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{totalTasks}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed</p>
                    <h3 className="text-3xl font-bold text-emerald-600 mt-1 tabular-nums">{completedTasks}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Blocked Tasks</p>
                    <h3 className="text-3xl font-bold text-red-600 mt-1 tabular-nums">{blockedTasks}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completion Rate</p>
                    <h3 className="text-3xl font-bold text-indigo-600 mt-1 tabular-nums">{completionRate}%</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Recharts Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Task Status Distribution</h3>
                  <div className="h-64 flex items-center justify-center">
                    {totalTasks === 0 ? (
                      <p className="text-sm text-slate-400">No tasks found. {dbErrorBanner ? "Configure DATABASE_URL to load records." : ""}</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label>
                            {pieData.map((e, i) => <Cell key={`cell-${i}`} fill={e.color} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Task Priority Breakdown</h3>
                  <div className="h-64 flex items-center justify-center">
                    {totalTasks === 0 ? (
                      <p className="text-sm text-slate-400">No tasks found.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                          <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SMART PROJECT PLANNING & BRIEF ANALYSIS */}
          {activeTab === "analyze" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Smart Project Planning & Brief Analysis</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Paste a client brief. Gemma 4 will extract deliverables, create tasks with dependencies, and persist records to PostgreSQL.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Example Client Briefs:</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {EXAMPLE_BRIEFS.map((ex, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setClientMessage(ex.text);
                          handleAnalyze(ex.text);
                        }}
                        className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition-all group"
                      >
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-purple-700 flex items-center justify-between">
                          <span>{ex.title}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ex.text}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Client Project Brief:</label>
                    <span className="text-xs text-slate-400">Enter or edit brief below</span>
                  </div>
                  <textarea
                    rows={6}
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    placeholder="Enter client project brief here or upload a file above..."
                    className="w-full p-4 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all resize-y"
                  ></textarea>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 tabular-nums">{clientMessage.length} chars</span>
                    <button
                      onClick={() => handleAnalyze()}
                      disabled={isAnalyzing || !clientMessage.trim()}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-600/30 transition-all flex items-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Gemma 4 Planning...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Run Smart Planning Agent</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Analysis Results */}
              {analysis && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span>Project Summary & Key Deliverables</span>
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary}</p>
                      <ul className="space-y-2 pt-2">
                        {analysis.deliverables.map((del, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{del}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        <span>Project Risks & Mitigations</span>
                      </h4>
                      <div className="space-y-3">
                        {analysis.risks.map((risk, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-red-50/50 border border-red-200 text-xs space-y-1">
                            <span className="font-bold text-red-800">{risk.category}</span>
                            <p className="text-slate-700">{risk.description}</p>
                            <p className="text-emerald-700 font-medium">Mitigation: {risk.mitigation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tasks generated */}
                  <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                      <span>Persisted Tasks & Dependencies</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.tasks.map((task) => (
                        <div key={task.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              task.priority === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                            }`}>{task.priority} Priority</span>
                            <span className="text-xs text-slate-500">{task.durationDays} days est.</span>
                          </div>
                          <h5 className="text-sm font-bold text-slate-900">{task.title}</h5>
                          <p className="text-xs text-slate-600">{task.description}</p>
                          {task.dependencies && task.dependencies.length > 0 && (
                            <p className="text-[11px] text-purple-700 font-mono">Prerequisites: {task.dependencies.join(", ")}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reply Draft */}
                  <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">Professional Client Reply Draft</h4>
                      <button
                        onClick={() => handleCopyReply(analysis.clientReplyDraft)}
                        className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-2"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? "Copied" : "Copy Reply"}</span>
                      </button>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border font-mono text-xs text-slate-800 whitespace-pre-wrap">
                      {analysis.clientReplyDraft}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TASK EXECUTION & MANAGEMENT */}
          {activeTab === "tasks" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">PostgreSQL Task Execution Board</h3>
                  <p className="text-sm text-slate-500">Tasks are persisted directly to PostgreSQL via Drizzle ORM.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loadingData ? (
                  <div className="p-12 text-center text-sm text-slate-400">Loading tasks from database...</div>
                ) : filteredTasks.length === 0 ? (
                  <div className="p-12 text-center text-sm text-slate-500 space-y-2">
                    <p>No tasks found in PostgreSQL database.</p>
                    {dbErrorBanner && <p className="text-xs text-amber-600 font-medium">{dbErrorBanner}</p>}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredTasks.map((task) => (
                      <div key={task.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => handleToggleTaskStatus(task.id, task.status)}
                            className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border transition-all ${
                              task.status === "completed" ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                            }`}
                          >
                            {task.status === "completed" && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h4 className={`text-sm font-bold ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-900"}`}>
                                {task.title}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">
                                {task.status}
                              </span>
                              {task.assignedTo && <span className="text-xs text-slate-500">Owner: {task.assignedTo}</span>}
                            </div>
                            <p className="text-xs text-slate-600">{task.description}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* APPROVAL CENTER */}
          {activeTab === "approvals" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Human Approval Center</h3>
                <p className="text-sm text-slate-500">Consequential actions requiring authorization before server execution.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {approvals.length === 0 ? (
                  <div className="p-12 text-center text-sm text-slate-400">No pending approval requests. {dbErrorBanner ? "Check DATABASE_URL." : ""}</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {approvals.map((item) => (
                      <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.status === "pending" ? "bg-amber-100 text-amber-800" :
                              item.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                            }`}>
                              {item.status}
                            </span>
                            <span className="text-xs font-mono text-slate-400">{item.actionType}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                          <p className="text-xs text-slate-600">{item.reason}</p>
                        </div>

                        {item.status === "pending" ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleApprovalDecision(item.id, "approve")}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprovalDecision(item.id, "reject")}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-500">Processed</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AUDIT LOG TIMELINE */}
          {activeTab === "audit" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Explainable Agent Activity Audit Timeline</h3>
                <p className="text-sm text-slate-500">Persistent record of model calls and tool executions in PostgreSQL.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                {auditLog.length === 0 ? (
                  <p className="text-sm text-slate-400">No audit logs recorded. {dbErrorBanner ? "Check DATABASE_URL." : ""}</p>
                ) : (
                  <div className="space-y-4 pl-4 border-l-2 border-purple-300">
                    {auditLog.map((log) => (
                      <div key={log.id} className="relative pl-6 space-y-1">
                        <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-purple-600 border-2 border-white"></div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-900">{log.step}</span>
                          <span className="text-[10px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-600">{log.detail}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AUTOMATED TEST SUITE */}
          {activeTab === "tests" && (
            <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Automated Test Suite Runner</h3>
                  <p className="text-sm text-slate-500">Execute database unit and integration tests.</p>
                </div>
                <button
                  onClick={runAutomatedTests}
                  disabled={isRunningTests}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-2"
                >
                  {isRunningTests ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span>Run Test Suite</span>
                </button>
              </div>

              {testSuiteResult && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Test Execution Results</h4>
                      <p className="text-xs text-slate-500">Passed {testSuiteResult.passedCount} of {testSuiteResult.totalTests} tests</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                      {testSuiteResult.passedCount === testSuiteResult.totalTests ? "All Tests Passed" : "Database Required"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {testSuiteResult.results ? testSuiteResult.results.map((res: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl border flex items-center justify-between text-xs bg-slate-50">
                        <div className="flex items-center gap-3">
                          {res.status === "passed" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                          <span className="font-bold text-slate-900">{res.testName}</span>
                        </div>
                        <span className="text-slate-600 font-mono">{res.detail}</span>
                      </div>
                    )) : (
                      <p className="text-xs text-red-600">{testSuiteResult.error}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS / DATABASE SETUP */}
          {activeTab === "settings" && (
            <div className="space-y-6 max-w-3xl animate-in fade-in duration-300">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Database Setup & Configuration</h3>
                <p className="text-sm text-slate-500">Configure PostgreSQL for persistent task and audit log storage.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Database Status</h4>
                    <p className="text-xs text-slate-500">PostgreSQL / Drizzle ORM client</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    dbErrorBanner ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {dbErrorBanner ? "Not Connected (DATABASE_URL Missing)" : "Connected"}
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">Step-by-Step Setup Guide:</h4>
                  <ol className="list-decimal list-inside text-xs text-slate-700 space-y-2 leading-relaxed">
                    <li>Create a PostgreSQL database (e.g. on <a href="https://neon.tech" target="_blank" rel="noreferrer" className="text-purple-600 underline">Neon</a>, Supabase, or Render).</li>
                    <li>Copy your full connection string (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">postgres://user:pass@host:port/dbname</code>).</li>
                    <li>Open the <strong>Settings &gt; Secrets</strong> panel in the AI Studio UI.</li>
                    <li>Add a secret named <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">DATABASE_URL</code> and paste your connection string.</li>
                    <li>Run schema migration: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">npx drizzle-kit push</code></li>
                    <li>Restart the dev server. Data will now persist permanently.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
