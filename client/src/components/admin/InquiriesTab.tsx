import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { Inquiry } from "./types";

export function InquiriesTab() {
  const { toast } = useToast();

  const { data: inquiries = [], isLoading } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/inquiries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({ title: "Inquiry deleted" });
    },
  });

  return (
    <Card className="bg-black/60 border-green-500/20">
      <CardHeader>
        <CardTitle className="text-green-400 text-lg">Contact Inquiries</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-400">Loading...</p>
        ) : inquiries.length === 0 ? (
          <p className="text-gray-400">No inquiries yet.</p>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="p-4 rounded-lg border border-green-500/10 bg-black/30"
                data-testid={`card-inquiry-${inquiry.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-white font-medium" data-testid={`text-inquiry-name-${inquiry.id}`}>
                        {inquiry.name}
                      </span>
                      <span className="text-green-400 text-sm">{inquiry.email}</span>
                      <span className="text-gray-600 text-xs">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-2">{inquiry.message}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(inquiry.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                    data-testid={`button-delete-inquiry-${inquiry.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
