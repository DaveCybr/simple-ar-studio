// src/pages/Demo.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Scan,
  ArrowRight,
  Play,
  Download,
  QrCode,
  Video,
  Image,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { GuestLayout } from "@/components/layouts/GuestLayout";

const Demo = () => {
  const [activeDemo, setActiveDemo] = useState("marketing");

  const demos = [
    {
      id: "marketing",
      title: "Marketing Campaign",
      category: "Business",
      description: "Interactive product showcase dengan video AR",
      thumbnail:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
      type: "video",
      features: ["Auto-play video", "Loop content", "High engagement"],
      usedBy: "Tech Startup XYZ",
      results: "+300% engagement vs static poster",
    },
    {
      id: "education",
      title: "Educational Content",
      category: "Education",
      description: "Materi pembelajaran anatomi dengan visualisasi 3D",
      thumbnail:
        "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&auto=format&fit=crop",
      type: "image",
      features: ["Interactive learning", "Multi-marker", "Visual guide"],
      usedBy: "Universitas Indonesia",
      results: "90% student engagement increase",
    },
    {
      id: "ecommerce",
      title: "Product Visualization",
      category: "E-Commerce",
      description: "Virtual try-on untuk fashion & accessories",
      thumbnail:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop",
      type: "video",
      features: ["360° view", "Product details", "Buy CTA"],
      usedBy: "Fashion Brand ABC",
      results: "+150% conversion rate",
    },
    {
      id: "event",
      title: "Event Activation",
      category: "Events",
      description: "Photo booth AR untuk event & exhibitions",
      thumbnail:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop",
      type: "video",
      features: ["Social sharing", "Branded content", "Real-time"],
      usedBy: "Music Festival 2024",
      results: "10K+ social shares",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Download Marker",
      description: "Download dan print marker image",
      icon: Download,
    },
    {
      number: "2",
      title: "Open Demo Link",
      description: "Scan QR atau klik link demo",
      icon: QrCode,
    },
    {
      number: "3",
      title: "Point Camera",
      description: "Arahkan camera ke marker",
      icon: Scan,
    },
    {
      number: "4",
      title: "Enjoy AR!",
      description: "Konten AR muncul di layar",
      icon: Sparkles,
    },
  ];

  return (
    <GuestLayout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="pt-32 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge variant="outline">Live Demos</Badge>
              <h1 className="text-4xl md:text-5xl font-bold">
                See Web AR in Action
              </h1>
              <p className="text-lg text-muted-foreground">
                Explore real-world AR experiences dari berbagai industri
              </p>
            </div>
          </div>
        </section>

        {/* How to Try */}
        <section className="pb-12">
          <div className="container mx-auto px-4">
            <Card className="max-w-5xl mx-auto bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-center mb-8">
                  Cara Mencoba Demo
                </h2>
                <div className="grid md:grid-cols-4 gap-6">
                  {steps.map((step) => (
                    <div key={step.number} className="text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <step.icon className="w-8 h-8 text-primary" />
                      </div>
                      <div className="text-3xl font-bold text-primary/30 mb-2">
                        {step.number}
                      </div>
                      <h3 className="font-semibold mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Demo Gallery */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5 mb-12">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="business">Business</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="ecommerce">E-Commerce</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                  <div className="grid md:grid-cols-2 gap-6">
                    {demos.map((demo) => (
                      <Card
                        key={demo.id}
                        className="overflow-hidden border-border/50 hover:shadow-lg transition-all group"
                      >
                        <div className="relative aspect-video overflow-hidden bg-muted">
                          <img
                            src={demo.thumbnail}
                            alt={demo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="lg" variant="secondary">
                              <Play className="mr-2 w-5 h-5" />
                              Try Demo
                            </Button>
                          </div>
                          <div className="absolute top-4 left-4">
                            <Badge>{demo.category}</Badge>
                          </div>
                          <div className="absolute top-4 right-4">
                            <Badge variant="secondary">
                              {demo.type === "video" ? (
                                <Video className="w-3 h-3 mr-1" />
                              ) : (
                                <Image className="w-3 h-3 mr-1" />
                              )}
                              {demo.type}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold mb-2">
                            {demo.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-4">
                            {demo.description}
                          </p>

                          <div className="space-y-3 mb-4">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2">
                                Features:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {demo.features.map((feature) => (
                                  <Badge
                                    key={feature}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold">{demo.usedBy}</p>
                                <p className="text-muted-foreground text-xs">
                                  {demo.results}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button className="flex-1">
                              <Play className="mr-2 w-4 h-4" />
                              Try Demo
                            </Button>
                            <Button variant="outline" size="icon">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="business">
                  <div className="grid md:grid-cols-2 gap-6">
                    {demos
                      .filter((d) => d.category === "Business")
                      .map((demo) => (
                        <Card key={demo.id} className="overflow-hidden">
                          <div className="aspect-video bg-muted relative">
                            <img
                              src={demo.thumbnail}
                              alt={demo.title}
                              className="w-full h-full object-cover"
                            />
                            <Badge className="absolute top-4 left-4">
                              {demo.category}
                            </Badge>
                          </div>
                          <CardContent className="p-6">
                            <h3 className="text-xl font-bold mb-2">
                              {demo.title}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-4">
                              {demo.description}
                            </p>
                            <Button className="w-full">
                              <Play className="mr-2 w-4 h-4" />
                              Try Demo
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>

                {/* Similar content for other tabs */}
              </Tabs>
            </div>
          </div>
        </section>

        {/* Video Demo */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Watch Demo Video</h2>
                <p className="text-muted-foreground">
                  Lihat bagaimana AR experiences dibuat dalam 5 menit
                </p>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-20 h-20 text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Demo Video Coming Soon
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Interactive Demo */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
                <CardContent className="p-12 text-center">
                  <Sparkles className="w-16 h-16 text-primary mx-auto mb-6" />
                  <h2 className="text-3xl font-bold mb-4">
                    Ready to Try It Yourself?
                  </h2>
                  <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                    Buat AR experience Anda sendiri dalam hitungan menit. No
                    coding required, no app installation needed.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/auth">
                      <Button size="lg" className="text-lg px-8">
                        Start Creating Free
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                    <Link to="/tutorial">
                      <Button
                        size="lg"
                        variant="outline"
                        className="text-lg px-8"
                      >
                        View Tutorial
                      </Button>
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground mt-6">
                    3 projects free • No credit card required
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </GuestLayout>
  );
};

export default Demo;
