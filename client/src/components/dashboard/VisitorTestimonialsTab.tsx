import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Quote } from "lucide-react";

type TestimonialRecord = {
  id: number;
  consultantSlug: string;
  authorName: string;
  content: string;
  status: string;
};

export function VisitorTestimonialsTab() {
  const { data: myTestimonials = [] } = useQuery<TestimonialRecord[]>({
    queryKey: ["/api/visitor/my-testimonials"],
    queryFn: () => fetch("/api/visitor/my-testimonials", { credentials: "include" }).then(r => r.json()),
  });

  const statusBadge = (status: string) => {
    if (status === "approved") return <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">Approved</span>;
    if (status === "rejected") return <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-xs font-semibold">Rejected</span>;
    return <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">Pending Review</span>;
  };

  return (
    <Card className="bg-black/60 border-green-500/20" data-testid="card-my-testimonials">
      <CardHeader className="pb-3">
        <CardTitle className="text-green-400 flex items-center gap-2">
          <Quote className="w-5 h-5" />
          My Testimonials
        </CardTitle>
      </CardHeader>
      <CardContent>
        {myTestimonials.length === 0 ? (
          <div className="text-center py-6">
            <Quote className="w-10 h-10 text-green-500/20 mx-auto mb-3" />
            <p className="text-white/70 text-sm">You haven't submitted any testimonials yet.</p>
            <p className="text-white/60 text-xs mt-1">Visit a consultant's page to share your experience.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTestimonials.map(t => (
              <div key={t.id} className="rounded-xl border border-green-500/10 bg-black/30 p-4" data-testid={`card-my-testimonial-${t.id}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <Link href={`/c/${t.consultantSlug}`} className="text-green-400 text-sm font-semibold hover:text-green-300">
                    {t.consultantSlug}
                  </Link>
                  {statusBadge(t.status)}
                </div>
                <p className="text-white/80 text-sm italic">"{t.content}"</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
