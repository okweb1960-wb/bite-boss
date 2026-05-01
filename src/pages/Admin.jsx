import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Activity, MapPin, CheckCircle, Loader2, Share2 } from "lucide-react";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-border flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-muted-foreground text-sm font-semibold">{label}</p>
        <p className="text-foreground text-2xl font-black">{value}</p>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/", { replace: true });
      return;
    }
    async function load() {
      try {
        const res = await base44.functions.invoke("adminStats", {});
        setData(res.data);
      } catch (e) {
        setError("Failed to load admin data.");
      }
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen text-destructive font-semibold">{error}</div>
  );

  const { stats, users, topLocations, sessionsOverTime, sessionsByUser } = data;

  return (
    <div className="min-h-screen bg-background px-5 py-8 max-w-2xl mx-auto">
      <h1 className="font-playfair text-3xl font-bold text-foreground mb-6">Admin Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-teal-600" />
        <StatCard icon={Activity} label="Total Sessions" value={stats.totalSessions} color="bg-orange-500" />
        <StatCard icon={CheckCircle} label="Completed" value={stats.completedSessions} color="bg-green-500" />
        <StatCard icon={Activity} label="Completion %" value={`${stats.completionRate}%`} color="bg-purple-500" />
        <StatCard icon={Share2} label="Total Shares" value={stats.totalShares} color="bg-blue-500" />
      </div>

      {/* Sessions Over Time */}
      {sessionsOverTime.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border mb-6">
          <h2 className="font-bold text-foreground mb-4">Sessions (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sessionsOverTime}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Locations */}
      {topLocations.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border mb-6">
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" /> Top Locations
          </h2>
          <div className="space-y-2">
            {topLocations.map(({ location, count }) => (
              <div key={location} className="flex items-center justify-between text-sm">
                <span className="text-foreground font-semibold truncate flex-1 mr-3">{location}</span>
                <span className="text-muted-foreground font-bold shrink-0">{count} sessions</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border mb-6">
        <h2 className="font-bold text-foreground mb-3">Users</h2>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
              <div>
                <p className="font-semibold text-foreground">{u.full_name || "—"}</p>
                <p className="text-muted-foreground text-xs">{u.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{sessionsByUser[u.email] || 0} sessions</p>
                <p className="text-xs text-muted-foreground">{u.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}