import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";

export default function NotFound() {
  return (
    <MainLayout title="Page Not Found">
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md glass-card text-center py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-12 w-12" />
            </div>
            <h1 className="text-2xl font-bold text-foreground font-heading">404 Page Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The page you are looking for does not exist or has been moved.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
