// src/pages/Tutorial.tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Scan,
  ArrowRight,
  Upload,
  Image,
  Video,
  QrCode,
  Share2,
  Eye,
  Settings,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  PlayCircle,
} from "lucide-react";
import { GuestLayout } from "@/components/layouts/GuestLayout";

const Tutorial = () => {
  const steps = [
    {
      title: "1. Persiapan Marker Image",
      icon: Image,
      duration: "2 menit",
      difficulty: "Mudah",
      content: [
        {
          subtitle: "Pilih Gambar yang Tepat",
          points: [
            "Gunakan gambar dengan detail yang jelas dan kontras tinggi",
            "Hindari gambar yang terlalu polos atau monoton",
            "Resolusi minimal 600x600 pixels untuk hasil optimal",
            "Format yang didukung: JPG, PNG (maks 5MB)",
          ],
        },
        {
          subtitle: "Tips untuk Marker Terbaik",
          points: [
            "Gambar dengan banyak sudut dan pattern bekerja lebih baik",
            "Hindari gambar blur, overexposed, atau terlalu gelap",
            "Logo dengan detail bagus untuk marker",
            "Test marker Anda di berbagai kondisi lighting",
          ],
        },
      ],
      tips: "Pro tip: Marker dengan contrast ratio tinggi memberikan tracking paling akurat!",
    },
    {
      title: "2. Upload & Setup Project",
      icon: Upload,
      duration: "3 menit",
      difficulty: "Mudah",
      content: [
        {
          subtitle: "Langkah Upload",
          points: [
            'Login ke dashboard dan klik "Buat Project"',
            "Upload marker image dengan drag & drop",
            "Tunggu proses optimasi otomatis",
            "Berikan nama project yang deskriptif",
          ],
        },
        {
          subtitle: "Konfigurasi Project",
          points: [
            "Atur visibility (Public/Private)",
            "Tambahkan deskripsi untuk referensi",
            "Set expiry date jika diperlukan",
            "Tentukan jumlah marker (1-5 per project)",
          ],
        },
      ],
      tips: "Rename project Anda dengan nama yang mudah diingat untuk management yang lebih baik.",
    },
    {
      title: "3. Tambahkan Konten AR",
      icon: Video,
      duration: "5 menit",
      difficulty: "Sedang",
      content: [
        {
          subtitle: "Jenis Konten yang Didukung",
          points: [
            "Video: MP4, WebM (maks 50MB per file)",
            "Image: JPG, PNG, GIF (maks 10MB per file)",
            "Multiple content per marker (coming soon)",
            "Auto-loop untuk video content",
          ],
        },
        {
          subtitle: "Upload Konten",
          points: [
            "Pilih marker yang sudah di-upload",
            "Drag & drop file video atau image",
            "Preview langsung di browser",
            "Adjust scale dan position jika perlu",
          ],
        },
        {
          subtitle: "Optimasi Konten",
          points: [
            "Compress video sebelum upload untuk loading lebih cepat",
            "Gunakan resolusi 720p atau 1080p untuk video",
            "Format square (1:1) atau landscape (16:9) recommended",
            "Test di mobile device untuk memastikan performa",
          ],
        },
      ],
      tips: "Video dengan bitrate rendah (2-5 Mbps) memberikan balance terbaik antara quality dan loading speed.",
    },
    {
      title: "4. Test AR Experience",
      icon: Eye,
      duration: "5 menit",
      difficulty: "Mudah",
      content: [
        {
          subtitle: "Preview Mode",
          points: [
            'Klik tombol "Preview" di dashboard',
            "Allow camera access di browser",
            "Arahkan kamera ke marker yang sudah di-print",
            "Konten AR akan muncul di atas marker",
          ],
        },
        {
          subtitle: "Testing Checklist",
          points: [
            "✓ Konten muncul dengan posisi yang tepat",
            "✓ Video auto-play dan loop berjalan normal",
            "✓ Tracking stabil saat marker bergerak",
            "✓ Loading time acceptable (< 3 detik)",
          ],
        },
        {
          subtitle: "Troubleshooting",
          points: [
            "Jika tracking tidak stabil, coba lighting yang lebih baik",
            "Print marker dengan ukuran minimal 10x10 cm",
            "Pastikan marker tidak reflektif atau mengkilap",
            "Clear browser cache jika konten tidak update",
          ],
        },
      ],
      tips: "Test AR experience Anda di berbagai device dan browser untuk ensure compatibility.",
    },
    {
      title: "5. Share & Deploy",
      icon: Share2,
      duration: "2 menit",
      difficulty: "Mudah",
      content: [
        {
          subtitle: "Generate Link & QR Code",
          points: [
            "Copy shareable link dari dashboard",
            "Download QR code untuk print materials",
            "Set password protection jika diperlukan",
            "Track views dengan built-in analytics",
          ],
        },
        {
          subtitle: "Distribusi Options",
          points: [
            "Share via social media (WhatsApp, Instagram, dll)",
            "Embed di website dengan iframe code",
            "Print QR code di poster, flyer, packaging",
            "Add ke digital marketing campaigns",
          ],
        },
        {
          subtitle: "Best Practices",
          points: [
            "Tambahkan instruksi cara scan untuk end users",
            "Test link di berbagai platform sebelum deploy",
            "Monitor analytics untuk track engagement",
            "Update konten secara berkala untuk keep it fresh",
          ],
        },
      ],
      tips: "Tambahkan call-to-action yang jelas untuk meningkatkan engagement rate.",
    },
  ];

  const faqs = [
    {
      q: "Apakah saya perlu download aplikasi untuk scan AR?",
      a: "Tidak! Semua berjalan di browser. User hanya perlu buka link dan allow camera access.",
    },
    {
      q: "Berapa ukuran file maksimal untuk video?",
      a: "Video maksimal 50MB. Kami recommend 20-30MB untuk performa optimal di semua device.",
    },
    {
      q: "Apakah AR bisa bekerja di iOS dan Android?",
      a: "Ya! Web AR kami compatible dengan semua browser modern di iOS (Safari) dan Android (Chrome).",
    },
    {
      q: "Bagaimana jika marker saya tidak ter-detect?",
      a: "Pastikan marker memiliki detail yang cukup, lighting baik, dan tidak reflektif. Try re-upload dengan gambar yang berbeda.",
    },
  ];

  return (
    <GuestLayout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="pt-32 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge variant="outline">Complete Guide</Badge>
              <h1 className="text-4xl md:text-5xl font-bold">
                Step-by-Step Tutorial
              </h1>
              <p className="text-lg text-muted-foreground">
                Pelajari cara membuat AR experience yang amazing dari awal
                sampai deploy
              </p>
            </div>
          </div>
        </section>

        {/* Video Tutorial */}
        <section className="pb-12">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-8">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <PlayCircle className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Video Tutorial Coming Soon
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Quick Start Video</h3>
                    <p className="text-sm text-muted-foreground">
                      Learn the basics in 5 minutes
                    </p>
                  </div>
                  <Badge>15:32</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Steps */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              {steps.map((step, index) => (
                <Card key={index} className="border-border/50">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6 mb-6">
                      <div className="p-4 rounded-xl bg-primary/10 shrink-0">
                        <step.icon className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h2 className="text-2xl font-bold">{step.title}</h2>
                          <Badge variant="secondary">{step.duration}</Badge>
                          <Badge variant="outline">{step.difficulty}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {step.content.map((section, idx) => (
                        <div key={idx}>
                          <h3 className="font-semibold text-lg mb-3">
                            {section.subtitle}
                          </h3>
                          <ul className="space-y-2">
                            {section.points.map((point, pidx) => (
                              <li key={pidx} className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">
                                  {point}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            Pro Tip:{" "}
                          </span>
                          {step.tips}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-muted-foreground">
                  Jawaban untuk pertanyaan yang sering ditanyakan
                </p>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <AlertCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">{faq.q}</h3>
                          <p className="text-muted-foreground text-sm">
                            {faq.a}
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

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Card className="max-w-3xl mx-auto bg-gradient-to-br from-primary/10 to-accent/10">
              <CardContent className="p-12 text-center">
                <h2 className="text-3xl font-bold mb-4">
                  Ready to Create Your First AR?
                </h2>
                <p className="text-muted-foreground mb-8">
                  Ikuti tutorial di atas dan mulai buat AR experience Anda
                  sekarang!
                </p>
                <Link to="/auth">
                  <Button size="lg">
                    Start Creating
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </GuestLayout>
  );
};

export default Tutorial;
