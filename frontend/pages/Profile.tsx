import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage your profile information
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  Full Name
                </p>
                <p className="text-foreground font-semibold">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  Email
                </p>
                <p className="text-foreground font-semibold">{user?.email}</p>
              </div>
            </div>

            {user?.teams && user.teams.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-3">
                  Teams
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.teams.map((team, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="bg-primary-50 text-primary border-primary-200"
                    >
                      {team.role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
