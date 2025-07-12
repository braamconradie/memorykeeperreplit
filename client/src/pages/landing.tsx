import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Calendar, Bell, Search, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-accent/10">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Heart className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-neutral-800">Memory Keeper</h1>
          </div>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Nurture your relationships with thoughtful reminders and meaningful memories
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mx-auto mb-4" />
              <CardTitle>People Profiles</CardTitle>
              <CardDescription>
                Store important details about your loved ones - names, relationships, birthdays, and personal notes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Heart className="h-8 w-8 text-accent mx-auto mb-4" />
              <CardTitle>Precious Memories</CardTitle>
              <CardDescription>
                Capture and organize meaningful moments, conversations, and insights about the people you care about
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Bell className="h-8 w-8 text-secondary mx-auto mb-4" />
              <CardTitle>Smart Reminders</CardTitle>
              <CardDescription>
                Never miss a birthday or important date with personalized email reminders and custom notifications
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Search className="h-8 w-8 text-primary mx-auto mb-4" />
              <CardTitle>Memory Search</CardTitle>
              <CardDescription>
                Quickly find specific memories, filter by person or date, and explore your relationship history
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Clock className="h-8 w-8 text-accent mx-auto mb-4" />
              <CardTitle>Timeline View</CardTitle>
              <CardDescription>
                See your memories chronologically and get "this week in memories" insights to spark connections
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Calendar className="h-8 w-8 text-secondary mx-auto mb-4" />
              <CardTitle>Anniversary Tracking</CardTitle>
              <CardDescription>
                Track birthdays, anniversaries, and custom important dates with intelligent age calculations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to strengthen your relationships?</CardTitle>
            <CardDescription className="text-lg">
              Join Memory Keeper and never forget the details that matter most
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => window.location.href = '/api/login'}
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
