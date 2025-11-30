import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, Calendar } from "lucide-react";
import { format } from "date-fns";

const Reports = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().setDate(1)), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });

  const exportToCSV = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*, profiles(name, employee_id, department)")
        .gte("date", dateRange.start)
        .lte("date", dateRange.end)
        .order("date", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No attendance records found for the selected date range.",
          variant: "destructive",
        });
        return;
      }

      // Create CSV content
      const headers = [
        "Date",
        "Employee Name",
        "Employee ID",
        "Department",
        "Check In",
        "Check Out",
        "Total Hours",
        "Status",
      ];

      const rows = data.map((record) => [
        record.date,
        record.profiles?.name || "",
        record.profiles?.employee_id || "",
        record.profiles?.department || "",
        record.check_in_time
          ? format(new Date(record.check_in_time), "yyyy-MM-dd HH:mm:ss")
          : "",
        record.check_out_time
          ? format(new Date(record.check_out_time), "yyyy-MM-dd HH:mm:ss")
          : "",
        record.total_hours?.toFixed(2) || "0",
        record.status,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `attendance_report_${dateRange.start}_to_${dateRange.end}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success!",
        description: `Exported ${data.length} attendance records to CSV.`,
      });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Export attendance reports for analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Attendance Report</CardTitle>
          <CardDescription>
            Select a date range and export attendance data to CSV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
              />
            </div>
          </div>

          <Button
            onClick={exportToCSV}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Exporting..." : "Export to CSV"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Date Range</p>
              <p className="text-sm text-muted-foreground">
                Select start and end dates to filter attendance records. The report
                will include all records within this period.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Download className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">CSV Format</p>
              <p className="text-sm text-muted-foreground">
                The exported file will contain employee details, check-in/out times,
                total hours worked, and attendance status. Open with Excel or Google
                Sheets.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
