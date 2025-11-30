import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/StatCard";
import { Users, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
  });
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [absentEmployees, setAbsentEmployees] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    // Get all employees
    const { data: profiles } = await supabase.from("profiles").select("*");
    
    // Get today's attendance
    const { data: attendance } = await supabase
      .from("attendance")
      .select("*, profiles(name, employee_id, department)")
      .eq("date", today);

    if (profiles && attendance) {
      const present = attendance.filter((a) => a.status === "present").length;
      const late = attendance.filter((a) => a.status === "late").length;
      const absent = profiles.length - attendance.length;

      setStats({
        totalEmployees: profiles.length,
        presentToday: present,
        absentToday: absent,
        lateToday: late,
      });

      setTodayAttendance(attendance);

      // Find absent employees
      const attendedIds = attendance.map((a) => a.user_id);
      const absentList = profiles.filter((p) => !attendedIds.includes(p.id));
      setAbsentEmployees(absentList);
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
        <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of team attendance and performance
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          description="Active team members"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          icon={CheckCircle2}
          description={`${Math.round((stats.presentToday / stats.totalEmployees) * 100)}% attendance`}
          variant="success"
        />
        <StatCard
          title="Late Today"
          value={stats.lateToday}
          icon={Clock}
          description="Arrived after 9 AM"
          variant="warning"
        />
        <StatCard
          title="Absent Today"
          value={stats.absentToday}
          icon={AlertCircle}
          description="Not checked in"
          variant="destructive"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {todayAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <p className="font-medium">{record.profiles?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {record.profiles?.employee_id} • {record.profiles?.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.check_in_time && (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(record.check_in_time), "h:mm a")}
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusBadge(record.status)}`}
                    >
                      {record.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Absent Employees */}
        <Card>
          <CardHeader>
            <CardTitle>Absent Today</CardTitle>
            <CardDescription>Employees who haven't checked in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {absentEmployees.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  All employees are present today! 🎉
                </p>
              ) : (
                absentEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-destructive/20"
                  >
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {employee.employee_id} • {employee.department}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full font-medium bg-destructive/10 text-destructive">
                      Absent
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;
