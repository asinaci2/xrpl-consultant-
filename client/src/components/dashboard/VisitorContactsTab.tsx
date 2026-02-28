import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookmarkCheck, BookmarkPlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ContactRecord = {
  id: number;
  consultantSlug: string;
  consultantName: string;
  consultantTagline: string;
  consultantAvatarUrl: string | null;
  note: string | null;
};

export function VisitorContactsTab() {
  const { toast } = useToast();

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<ContactRecord[]>({
    queryKey: ["/api/visitor/contacts"],
    queryFn: () => fetch("/api/visitor/contacts", { credentials: "include" }).then(r => r.json()),
  });

  const removeMutation = useMutation({
    mutationFn: (slug: string) => apiRequest("DELETE", `/api/visitor/contacts/${slug}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visitor/contacts"] });
      toast({ title: "Contact removed" });
    },
    onError: () => toast({ title: "Error", description: "Could not remove contact.", variant: "destructive" }),
  });

  return (
    <Card className="bg-black/60 border-green-500/20" data-testid="card-my-contacts">
      <CardHeader className="pb-3">
        <CardTitle className="text-green-400 flex items-center gap-2">
          <BookmarkCheck className="w-5 h-5" />
          My Contacts
          {contacts.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-xs font-bold">{contacts.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contactsLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2].map(i => <div key={i} className="h-16 bg-green-500/10 rounded-xl" />)}
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-6">
            <BookmarkPlus className="w-10 h-10 text-green-500/20 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">No saved contacts yet. Browse the directory and save consultants you want to keep track of.</p>
            <Link href="/">
              <Button variant="outline" size="sm" className="border-green-500/30 text-green-400 hover:bg-green-500/10 rounded-full" data-testid="button-browse-directory">
                Browse Directory
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-green-500/10 bg-black/30 p-3" data-testid={`card-contact-${c.consultantSlug}`}>
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold shrink-0">
                  {c.consultantAvatarUrl
                    ? <img src={c.consultantAvatarUrl} alt={c.consultantName} className="w-10 h-10 rounded-full object-cover" />
                    : c.consultantName.charAt(0).toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{c.consultantName}</p>
                  {c.consultantTagline && <p className="text-gray-500 text-xs truncate">{c.consultantTagline}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/c/${c.consultantSlug}`}>
                    <Button size="sm" variant="outline" className="border-green-500/20 text-green-400 hover:bg-green-500/10 text-xs rounded-full" data-testid={`button-view-contact-${c.consultantSlug}`}>
                      View
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => removeMutation.mutate(c.consultantSlug)} disabled={removeMutation.isPending} className="border-red-500/20 text-red-400/70 hover:bg-red-500/10 text-xs rounded-full" data-testid={`button-remove-contact-${c.consultantSlug}`}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-green-400/60 hover:text-green-400 text-xs w-full mt-2" data-testid="button-browse-more">
                <BookmarkPlus className="w-3.5 h-3.5 mr-1.5" />Browse directory to add more
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
