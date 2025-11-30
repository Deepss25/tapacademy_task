import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const TeamAttendance = () => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    loadAttendance();
  }, [dateFilter]);

  useEffect(() => {
    filterAttendance();
  }, [attendance, searchTerm, statusFilter]);

  const loadAttendance = async () => {
    const { data } = await supabase
      .from("attendance")
      .select("*, profiles(name, employee_id, department)")
      .eq("date", dateFilter)
      .order("created_at", { ascending: false });

    setAttendance(data || []);
  };

  const filterAttendance = () => {
    let filtered = attendance;

    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.profiles?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.profiles?.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status === statusFilter);
    }

    setFilteredAttendance(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      present: "default",
      absent: "destructive",
      late: "secondary",
      "half-day": "secondary",
    };
    return variants[status as keyof typeof variants] || "default";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Attendance</h1>
        <p className="text-muted-foreground">View and filter team attendance records</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="half-day">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, ID, Department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Showing {filteredAttendance.length} record(s) for {format(new Date(dateFilter), "MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredAttendance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No attendance records found
              </p>
            ) : (
              filteredAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{record.profiles?.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {record.profiles?.employee_id}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {record.profiles?.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {record.check_in_time && (
                        <p className="text-sm font-medium">
                          {format(new Date(record.check_in_time), "h:mm a")}
                        </p>
                      )}
                      {record.check_out_time && (
                        <p className="text-xs text-muted-foreground">
                          to {format(new Date(record.check_out_time), "h:mm a")}
                        </p>
                      )}
                      {record.total_hours > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {record.total_hours.toFixed(1)}h
                        </p>
                      )}
                    </div>
                    <Badge variant={getStatusBadge(record.status) as any}>
                      {record.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamAttendance;
