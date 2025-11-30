import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";

const AttendanceHistory = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [attendance, setAttendance] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  useEffect(() => {
    if (user && selectedDate) {
      loadAttendance();
    }
  }, [user, selectedDate]);

  const loadAttendance = async () => {
    const start = format(startOfMonth(selectedDate!), "yyyy-MM-dd");
    const end = format(endOfMonth(selectedDate!), "yyyy-MM-dd");

    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user?.id)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });

    setAttendance(data || []);

    // Find record for selected date
    const dateStr = format(selectedDate!, "yyyy-MM-dd");
    const record = data?.find((a) => a.date === dateStr);
    setSelectedRecord(record);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      present: "success",
      absent: "destructive",
      late: "warning",
      "half-day": "warning",
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const record = attendance.find((a) => a.date === dateStr);
    return record?.status;
  };

  const modifiers = {
    present: attendance
      .filter((a) => a.status === "present")
      .map((a) => new Date(a.date)),
    late: attendance
      .filter((a) => a.status === "late")
      .map((a) => new Date(a.date)),
    absent: attendance
      .filter((a) => a.status === "absent")
      .map((a) => new Date(a.date)),
  };

  const modifiersStyles = {
    present: { backgroundColor: "hsl(var(--success))", color: "white" },
    late: { backgroundColor: "hsl(var(--warning))", color: "white" },
    absent: { backgroundColor: "hsl(var(--destructive))", color: "white" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance History</h1>
        <p className="text-muted-foreground">View your attendance records</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>Click on a date to view details</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
            </CardTitle>
            <CardDescription>Attendance details</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedRecord ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={getStatusColor(selectedRecord.status) as any}>
                    {selectedRecord.status}
                  </Badge>
                </div>
                {selectedRecord.check_in_time && (
                  <div>
                    <p className="text-sm font-medium mb-1">Check In</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedRecord.check_in_time), "h:mm:ss a")}
                    </p>
                  </div>
                )}
                {selectedRecord.check_out_time && (
                  <div>
                    <p className="text-sm font-medium mb-1">Check Out</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedRecord.check_out_time), "h:mm:ss a")}
                    </p>
                  </div>
                )}
                {selectedRecord.total_hours > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Total Hours</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedRecord.total_hours.toFixed(2)} hours
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No attendance record for this date
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-success"></div>
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-warning"></div>
              <span className="text-sm">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-destructive"></div>
              <span className="text-sm">Absent</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceHistory;
