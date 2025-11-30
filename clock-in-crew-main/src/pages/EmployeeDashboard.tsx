import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import StatCard from "@/components/StatCard";
import { Calendar, Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [monthlyStats, setMonthlyStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    totalHours: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadTodayAttendance();
      loadMonthlyStats();
      loadRecentAttendance();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();
    setProfile(data);
  };

  const loadTodayAttendance = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user?.id)
      .eq("date", today)
      .maybeSingle();

    setTodayAttendance(data);
    setIsCheckedIn(data?.check_in_time && !data?.check_out_time);
  };

  const loadMonthlyStats = async () => {
    const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const end = format(endOfMonth(new Date()), "yyyy-MM-dd");

    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user?.id)
      .gte("date", start)
      .lte("date", end);

    if (data) {
      const present = data.filter((a) => a.status === "present").length;
      const late = data.filter((a) => a.status === "late").length;
      const totalHours = data.reduce((sum, a) => sum + (a.total_hours || 0), 0);

      setMonthlyStats({
        present,
        absent: data.filter((a) => a.status === "absent").length,
        late,
        totalHours: Math.round(totalHours * 10) / 10,
      });
    }
  };

  const loadRecentAttendance = async () => {
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user?.id)
      .order("date", { ascending: false })
      .limit(7);

    setRecentAttendance(data || []);
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const now = new Date().toISOString();
      const currentHour = new Date().getHours();
      const status = currentHour > 9 ? "late" : "present";

      const { error } = await supabase.from("attendance").insert({
        user_id: user?.id,
        date: today,
        check_in_time: now,
        status,
      });

      if (error) throw error;

      toast({
        title: "Checked In!",
        description: `You've been marked ${status} for today.`,
      });

      loadTodayAttendance();
      loadMonthlyStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("attendance")
        .update({ check_out_time: now })
        .eq("id", todayAttendance?.id);

      if (error) throw error;

      toast({
        title: "Checked Out!",
        description: "Have a great day!",
      });

      loadTodayAttendance();
      loadMonthlyStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      present: "bg-success/10 text-success",
      absent: "bg-destructive/10 text-destructive",
      late: "bg-warning/10 text-warning",
      "half-day": "bg-warning/10 text-warning",
    };
    return styles[status as keyof typeof styles] || styles.present;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile?.name}!
        </h1>
        <p className="text-muted-foreground">
          {profile?.employee_id} • {profile?.department}
        </p>
      </div>

      {/* Check In/Out Card */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle>Today's Status</CardTitle>
          <CardDescription>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!todayAttendance ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">You haven't checked in yet today.</p>
              <Button onClick={handleCheckIn} disabled={loading} size="lg" className="w-full">
                <Clock className="mr-2 h-4 w-4" />
                Check In
              </Button>
            </div>
          ) : isCheckedIn ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <p className="font-medium">Checked in at {format(new Date(todayAttendance.check_in_time), "h:mm a")}</p>
              </div>
              <Button onClick={handleCheckOut} disabled={loading} size="lg" className="w-full" variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Check Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="font-medium">Completed for today</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(todayAttendance.check_in_time), "h:mm a")} -{" "}
                  {format(new Date(todayAttendance.check_out_time), "h:mm a")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Present Days"
          value={monthlyStats.present}
          icon={CheckCircle2}
          description="This month"
          variant="success"
        />
        <StatCard
          title="Late Days"
          value={monthlyStats.late}
          icon={AlertCircle}
          description="This month"
          variant="warning"
        />
        <StatCard
          title="Absent Days"
          value={monthlyStats.absent}
          icon={Calendar}
          description="This month"
          variant="destructive"
        />
        <StatCard
          title="Total Hours"
          value={monthlyStats.totalHours}
          icon={TrendingUp}
          description="This month"
        />
      </div>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentAttendance.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium">{format(new Date(record.date), "EEEE, MMM d")}</p>
                  {record.check_in_time && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(record.check_in_time), "h:mm a")}
                      {record.check_out_time && ` - ${format(new Date(record.check_out_time), "h:mm a")}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadge(record.status)}`}
                  >
                    {record.status}
                  </span>
                  {record.total_hours > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {record.total_hours.toFixed(1)}h
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
