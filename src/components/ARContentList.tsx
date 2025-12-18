import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, FileVideo, Image, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ARContent {
  id: string;
  name: string;
  marker_url: string;
  mind_file_url: string;
  content_url: string;
  content_type: string;
  created_at: string;
}

interface ARContentListProps {
  onSelect: (content: ARContent) => void;
  refresh?: number;
}

export const ARContentList = ({ onSelect, refresh }: ARContentListProps) => {
  const [contents, setContents] = useState<ARContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContents();
  }, [refresh]);

  const fetchContents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ar_content')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setContents(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-32 bg-muted rounded-lg mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">Belum ada AR content. Upload sekarang!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {contents.map((content) => (
        <Card key={content.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative aspect-video bg-muted">
            <img
              src={content.marker_url}
              alt={content.name}
              className="w-full h-full object-cover"
            />
            <Badge className="absolute top-2 right-2" variant="secondary">
              {content.content_type === 'video' ? (
                <><FileVideo className="w-3 h-3 mr-1" /> Video</>
              ) : (
                <><Image className="w-3 h-3 mr-1" /> Image</>
              )}
            </Badge>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 truncate">{content.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {new Date(content.created_at).toLocaleDateString('id-ID')}
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => onSelect(content)}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-1" />
                Lihat AR
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(content.marker_url, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
