// src/pages/About.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Scan,
  ArrowRight,
  Target,
  Lightbulb,
  Heart,
  Users,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";
import { GuestLayout } from "@/components/layouts/GuestLayout";

const About = () => {
  const values = [
    {
      icon: Lightbulb,
      title: "Innovation First",
      description:
        "Kami terus berinovasi untuk memberikan teknologi AR terdepan yang accessible untuk semua",
    },
    {
      icon: Users,
      title: "User-Centric",
      description:
        "Design dan development kami fokus pada kemudahan penggunaan dan user experience terbaik",
    },
    {
      icon: Heart,
      title: "Quality Matters",
      description:
        "Komitmen kami pada kualitas tinggi di setiap aspek - dari performance hingga support",
    },
    {
      icon: Globe,
      title: "Democratize AR",
      description:
        "Membuat teknologi AR accessible dan affordable untuk semua, dari startup hingga enterprise",
    },
  ];

  const milestones = [
    {
      year: "2023",
      title: "Founded",
      description: "NANO AR diluncurkan dengan misi democratize AR technology",
    },
    {
      year: "2024",
      title: "1K Users",
      description: "Mencapai 1000+ active users dari berbagai industri",
    },
    {
      year: "2024",
      title: "50K AR Created",
      description:
        "Lebih dari 50,000 AR experiences telah dibuat di platform kami",
    },
    {
      year: "2025",
      title: "Going Global",
      description:
        "Expansion ke pasar Asia-Pacific dengan partnership strategis",
    },
  ];

  const team = [
    {
      name: "David Chen",
      role: "CEO & Co-Founder",
      bio: "Former AR/VR engineer at Meta, passionate about making AR accessible",
      avatar: "DC",
    },
    {
      name: "Sarah Johnson",
      role: "CTO & Co-Founder",
      bio: "Full-stack engineer with 10+ years in WebGL and computer vision",
      avatar: "SJ",
    },
    {
      name: "Ahmad Rizki",
      role: "Head of Product",
      bio: "Product leader with background in SaaS and developer tools",
      avatar: "AR",
    },
    {
      name: "Lisa Chen",
      role: "Head of Design",
      bio: "UX designer focused on creating intuitive AR authoring experiences",
      avatar: "LC",
    },
  ];

  const stats = [
    { icon: Users, value: "1000+", label: "Active Users" },
    { icon: Sparkles, value: "50K+", label: "AR Created" },
    { icon: Globe, value: "25+", label: "Countries" },
    { icon: TrendingUp, value: "99.9%", label: "Uptime" },
  ];

  const technologies = [
    { name: "MindAR.js", description: "Fast & accurate AR tracking" },
    { name: "Three.js", description: "3D rendering engine" },
    { name: "WebXR", description: "Native AR support" },
    { name: "Cloudinary", description: "Media optimization" },
    { name: "Supabase", description: "Real-time backend" },
    { name: "React", description: "Modern UI framework" },
  ];

  return (
    <GuestLayout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge variant="outline">About Us</Badge>
              <h1 className="text-4xl md:text-6xl font-bold">
                Making AR Accessible
                <br />
                <span className="text-primary">For Everyone</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Kami percaya teknologi Augmented Reality seharusnya mudah
                diakses oleh siapa saja, tanpa perlu technical expertise atau
                budget besar.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="border-border/50">
                <CardContent className="p-8">
                  <div className="p-4 rounded-xl bg-primary/10 w-fit mb-6">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Memberikan platform Web AR terbaik yang memungkinkan bisnis,
                    edukator, dan kreator untuk membuat pengalaman AR
                    berkualitas tinggi tanpa coding atau technical barriers.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-8">
                  <div className="p-4 rounded-xl bg-primary/10 w-fit mb-6">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Menjadi platform Web AR #1 di Asia-Pacific, trusted oleh
                    ribuan companies dan creators untuk membuat engaging AR
                    experiences yang memorable dan measurable.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Our Impact</h2>
                <p className="text-muted-foreground">
                  Angka-angka yang menunjukkan trust dan growth kami
                </p>
              </div>
              <div className="grid md:grid-cols-4 gap-8">
                {stats.map((stat) => (
                  <Card
                    key={stat.label}
                    className="border-border/50 text-center"
                  >
                    <CardContent className="p-6">
                      <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-4">
                        <stat.icon className="w-8 h-8 text-primary" />
                      </div>
                      <div className="text-3xl font-bold text-primary mb-2">
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4">
                  Our Values
                </Badge>
                <h2 className="text-3xl font-bold mb-4">What We Stand For</h2>
                <p className="text-muted-foreground">
                  Prinsip-prinsip yang guide setiap keputusan kami
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {values.map((value) => (
                  <Card key={value.title} className="border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                          <value.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">
                            {value.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {value.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4">
                  Our Journey
                </Badge>
                <h2 className="text-3xl font-bold mb-4">Company Milestones</h2>
              </div>
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Award className="w-6 h-6 text-primary" />
                      </div>
                      {index < milestones.length - 1 && (
                        <div className="w-0.5 h-full bg-border mt-2" />
                      )}
                    </div>
                    <Card className="flex-1 border-border/50">
                      <CardContent className="p-6">
                        <div className="text-2xl font-bold text-primary mb-2">
                          {milestone.year}
                        </div>
                        <h3 className="font-semibold text-lg mb-2">
                          {milestone.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {milestone.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4">
                  Our Team
                </Badge>
                <h2 className="text-3xl font-bold mb-4">Meet the Team</h2>
                <p className="text-muted-foreground">
                  Passionate people building the future of Web AR
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {team.map((member) => (
                  <Card key={member.name} className="border-border/50">
                    <CardContent className="p-6 text-center">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                        {member.avatar}
                      </div>
                      <h3 className="font-semibold text-lg mb-1">
                        {member.name}
                      </h3>
                      <p className="text-sm text-primary mb-3">{member.role}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.bio}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4">
                  Technology
                </Badge>
                <h2 className="text-3xl font-bold mb-4">Powered By</h2>
                <p className="text-muted-foreground">
                  Modern tech stack untuk performance dan reliability terbaik
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {technologies.map((tech) => (
                  <Card key={tech.name} className="border-border/50">
                    <CardContent className="p-4 text-center">
                      <div className="font-semibold mb-1">{tech.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {tech.description}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 to-accent/10">
              <CardContent className="p-12 text-center">
                <h2 className="text-3xl font-bold mb-4">
                  Join Our Growing Community
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                  Be part of the AR revolution. Start creating amazing
                  experiences today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/auth">
                    <Button size="lg" className="text-lg px-8">
                      Start Free Trial
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/demo">
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg px-8"
                    >
                      View Demos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </GuestLayout>
  );
};

export default About;
