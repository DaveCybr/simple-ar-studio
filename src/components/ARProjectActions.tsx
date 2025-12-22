// src/components/ARProjectActions.tsx - FIXED with Analytics Dialog
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ARProjectEditForm } from "./ARProjectEditForm";
import { ARAnalyticsDashboard } from "./ARAnalyticsDashboard";

interface ARProjectActionsProps {
  projectId: string;
  projectName: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const ARProjectActions = ({
  projectId,
  projectName,
  onEdit,
  onDelete,
  onDuplicate,
}: ARProjectActionsProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete all markers first
      const { error: markersError } = await supabase
        .from("ar_content")
        .delete()
        .eq("project_id", projectId);

      if (markersError) throw markersError;

      // Delete project
      const { error: projectError } = await supabase
        .from("ar_projects")
        .delete()
        .eq("id", projectId);

      if (projectError) throw projectError;

      toast({
        title: "Project Dihapus",
        description: `"${projectName}" berhasil dihapus`,
      });

      onDelete?.();
    } catch (error: any) {
      toast({
        title: "Gagal Menghapus",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      // Get project data
      const { data: project, error: projectError } = await supabase
        .from("ar_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      // Create duplicate project
      const { data: newProject, error: newProjectError } = await supabase
        .from("ar_projects")
        .insert({
          name: `${project.name} (Copy)`,
          library: project.library,
          user_id: project.user_id,
        })
        .select()
        .single();

      if (newProjectError) throw newProjectError;

      // Get all markers
      const { data: markers, error: markersError } = await supabase
        .from("ar_content")
        .select("*")
        .eq("project_id", projectId);

      if (markersError) throw markersError;

      // Duplicate markers
      if (markers && markers.length > 0) {
        const duplicatedMarkers = markers.map((m) => ({
          name: m.name,
          library: m.library,
          marker_url: m.marker_url,
          marker_data: m.marker_data,
          content_url: m.content_url,
          content_type: m.content_type,
          scale: m.scale,
          user_id: m.user_id,
          project_id: newProject.id,
        }));

        const { error: insertError } = await supabase
          .from("ar_content")
          .insert(duplicatedMarkers);

        if (insertError) throw insertError;
      }

      toast({
        title: "Project Diduplikasi",
        description: `"${projectName}" berhasil diduplikasi`,
      });

      onDuplicate?.();
    } catch (error: any) {
      toast({
        title: "Gagal Menduplikasi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportQR = () => {
    const url = `${window.location.origin}/view/${projectId}`;
    window.open(
      `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
        url
      )}`,
      "_blank"
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAnalyticsDialogOpen(true)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportQR}>
            <Download className="mr-2 h-4 w-4" />
            Download QR
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <ARProjectEditForm
        projectId={projectId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          onEdit?.();
        }}
      />

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analytics - {projectName}</DialogTitle>
          </DialogHeader>
          <ARAnalyticsDashboard projectId={projectId} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Project?</AlertDialogTitle>
            <AlertDialogDescription>
              Project <strong>"{projectName}"</strong> dan semua marker di
              dalamnya akan dihapus permanen. Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
