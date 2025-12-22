// src/components/ARAnalyticsDashboard.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Scan,
  Clock,
  TrendingUp,
  MapPin,
  Smartphone,
  Calendar,
  Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AnalyticsData {
  totalViews: number;
  totalScans: number;
  avgDuration: number;
  uniqueUsers: number;
  topMarkers: Array<{
    name: string;
    scans: number;
  }>;
  scansByDate: Array<{
    date: string;
    count: number;
  }>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  locationData: Array<{
    country: string;
    count: number;
  }>;
}

interface ARAnalyticsDashboardProps {
  projectId?: string;
}

export const ARAnalyticsDashboard = ({
  projectId,
}: ARAnalyticsDashboardProps) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("7d");

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, projectId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      if (timeRange === "7d") {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === "30d") {
        startDate.setDate(now.getDate() - 30);
      } else {
        startDate = new Date(0); // All time
      }

      // Fetch analytics data
      let query = supabase
        .from("ar_analytics")
        .select("*")
        .eq("user_id", user?.id)
        .gte("created_at", startDate.toISOString());

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process data
      const processed = processAnalyticsData(data || []);
      setAnalytics(processed);
    } catch (error) {
      console.error("Analytics fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (data: any[]): AnalyticsData => {
    // Group by date
    const scansByDate = data.reduce((acc: any, item) => {
      const date = new Date(item.created_at).toLocaleDateString("id-ID");
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Top markers
    const markerScans = data.reduce((acc: any, item) => {
      if (item.marker_name) {
        acc[item.marker_name] = (acc[item.marker_name] || 0) + 1;
      }
      return acc;
    }, {});

    const topMarkers = Object.entries(markerScans)
      .map(([name, scans]) => ({ name, scans: scans as number }))
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 5);

    // Device breakdown
    const deviceBreakdown = data.reduce(
      (acc: any, item) => {
        const device = item.device_type || "mobile";
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      },
      { mobile: 0, desktop: 0, tablet: 0 }
    );

    // Calculate avg duration
    const durations = data.filter((d) => d.duration).map((d) => d.duration);
    const avgDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    // Unique users
    const uniqueUsers = new Set(data.map((d) => d.session_id)).size;

    // Location data (mock for now, need IP geolocation)
    const locationData = [
      { country: "Indonesia", count: Math.floor(data.length * 0.8) },
      { country: "Malaysia", count: Math.floor(data.length * 0.1) },
      { country: "Singapore", count: Math.floor(data.length * 0.05) },
      { country: "Others", count: Math.floor(data.length * 0.05) },
    ];

    return {
      totalViews: data.filter((d) => d.event_type === "view").length,
      totalScans: data.filter((d) => d.event_type === "scan").length,
      avgDuration: Math.round(avgDuration),
      uniqueUsers,
      topMarkers,
      scansByDate: Object.entries(scansByDate).map(([date, count]) => ({
        date,
        count: count as number,
      })),
      deviceBreakdown,
      locationData,
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
          <TabsList>
            <TabsTrigger value="7d">7 Hari</TabsTrigger>
            <TabsTrigger value="30d">30 Hari</TabsTrigger>
            <TabsTrigger value="all">Semua</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Page visits to AR viewer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Scan className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalScans}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Marker detections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgDuration}s</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average session time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Distinct sessions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Markers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Markers</CardTitle>
            <CardDescription>Most scanned markers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topMarkers.length > 0 ? (
                analytics.topMarkers.map((marker, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{marker.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {marker.scans} scans
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No scan data yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Usage by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Mobile</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {analytics.deviceBreakdown.mobile}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (
                    {Math.round(
                      (analytics.deviceBreakdown.mobile /
                        (analytics.totalViews || 1)) *
                        100
                    )}
                    %)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Tablet</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {analytics.deviceBreakdown.tablet}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (
                    {Math.round(
                      (analytics.deviceBreakdown.tablet /
                        (analytics.totalViews || 1)) *
                        100
                    )}
                    %)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span>Desktop</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {analytics.deviceBreakdown.desktop}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (
                    {Math.round(
                      (analytics.deviceBreakdown.desktop /
                        (analytics.totalViews || 1)) *
                        100
                    )}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scans Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Scan Activity</CardTitle>
            <CardDescription>Daily scan count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.scansByDate.length > 0 ? (
                analytics.scansByDate.map((item, index) => {
                  const maxScans = Math.max(
                    ...analytics.scansByDate.map((d) => d.count)
                  );
                  const percentage = (item.count / maxScans) * 100;

                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.date}
                        </span>
                        <span className="font-medium">{item.count} scans</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No activity data
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Data */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>Scans by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.locationData.map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{location.country}</span>
                  </div>
                  <Badge variant="secondary">{location.count} scans</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
