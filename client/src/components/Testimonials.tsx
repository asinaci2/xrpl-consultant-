import { useState } from "react";
import { motion } from "framer-motion";
import { Quote, Star, CheckCircle2, LogIn } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Testimonial {
  id: number;
  consultantSlug: string;
  authorName: string;
  authorTitle: string;
  content: string;
  sortOrder: number;
  status: string;
}

export function Testimonials({ slug }: { slug: string }) {
  const { toast } = useToast();
  const { matrixUserId, displayName, consultantSlug: mySlug } = useAuth();
  const isLoggedIn = !!matrixUserId;
  const isThisConsultant = mySlug === slug;

  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["/api/c/:slug/testimonials", slug],
    queryFn: async () => {
      const res = await fetch(`/api/c/${slug}/testimonials`);
      return res.json();
    },
  });

  const { data: mySubmission, refetch: refetchSubmission } = useQuery<{ submitted: boolean; status: string | null }>({
    queryKey: ["/api/c/:slug/testimonials/my-submission", slug],
    queryFn: async () => {
      const res = await fetch(`/api/c/${slug}/testimonials/my-submission`, { credentials: "include" });
      if (!res.ok) return { submitted: false, status: null };
      return res.json();
    },
    enabled: isLoggedIn && !isThisConsultant,
  });

  const [authorName, setAuthorName] = useState(displayName || "");
  const [authorTitle, setAuthorTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/c/${slug}/testimonials`, { authorName, authorTitle, content }),
    onSuccess: () => {
      setSubmitted(true);
      refetchSubmission();
      toast({ title: "Testimonial submitted!", description: "Your experience is awaiting approval from the consultant." });
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to submit.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const alreadySubmitted = submitted || mySubmission?.submitted;
  const showCTA = !isThisConsultant;
  const hasTestimonials = testimonials.length > 0;

  if (!hasTestimonials && !showCTA) return null;

  return (
    <section id="testimonials" className="section-padding bg-black/70 backdrop-blur-sm" data-testid="section-testimonials">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {hasTestimonials && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold mb-4"
                data-testid="badge-testimonials"
              >
                <Quote className="w-4 h-4" />
                Testimonials
              </div>
              <h2
                className="text-3xl md:text-5xl font-display font-bold text-white mb-4"
                data-testid="text-testimonials-title"
              >
                What Clients <span className="text-green-400">Say</span>
              </h2>
              <p
                className="text-lg text-gray-400 max-w-2xl mx-auto"
                data-testid="text-testimonials-description"
              >
                Real feedback from the people who've worked with this consultant.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  data-testid={`card-testimonial-${t.id}`}
                  className="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-green-500/20 flex flex-col gap-4"
                >
                  <Quote className="w-8 h-8 text-green-400/40 shrink-0" />
                  <p className="text-gray-300 leading-relaxed flex-1 italic">"{t.content}"</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm shrink-0">
                      {t.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{t.authorName}</div>
                      {t.authorTitle && (
                        <div className="text-gray-500 text-xs">{t.authorTitle}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {showCTA && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-green-500/30 bg-green-500/5 p-8"
            data-testid="section-submit-testimonial"
          >
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-display font-bold text-white">Share Your Experience</h3>
            </div>
            <p className="text-white text-sm mb-6">
              Had an experience working with this consultant? Your feedback helps others in the community find the right guidance.
            </p>

            {alreadySubmitted ? (
              <div className="flex items-center gap-3 text-green-400 font-medium" data-testid="text-testimonial-submitted">
                <CheckCircle2 className="w-5 h-5" />
                <span>Your testimonial has been submitted and is awaiting approval. Thank you!</span>
              </div>
            ) : isLoggedIn ? (
              <div className="space-y-4 max-w-xl" data-testid="form-submit-testimonial">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block font-medium">Your Name</label>
                    <Input
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                      placeholder="Your name"
                      className="bg-black/40 border-green-500/20 text-white"
                      data-testid="input-testimonial-name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block font-medium">Title / Company <span className="text-gray-600">(optional)</span></label>
                    <Input
                      value={authorTitle}
                      onChange={e => setAuthorTitle(e.target.value)}
                      placeholder="e.g. Founder, Acme Corp"
                      className="bg-black/40 border-green-500/20 text-white"
                      data-testid="input-testimonial-title"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">Your Experience</label>
                  <Textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={4}
                    placeholder="Tell others about your experience working with this consultant..."
                    className="bg-black/40 border-green-500/20 text-white placeholder:text-gray-600 resize-none"
                    data-testid="input-testimonial-content"
                  />
                </div>
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={!content.trim() || !authorName.trim() || submitMutation.isPending}
                  className="bg-green-500 hover:bg-green-600 text-black font-bold rounded-full px-6"
                  data-testid="button-submit-testimonial"
                >
                  <Star className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? "Submitting..." : "Submit Testimonial"}
                </Button>
              </div>
            ) : (
              <div data-testid="login-prompt-testimonial">
                <p className="text-white text-sm mb-4">Log in to share your experience with the community.</p>
                <Link href="/login">
                  <Button variant="outline" className="border-green-500/40 text-green-400 hover:bg-green-500/10 rounded-full" data-testid="button-login-to-testimonial">
                    <LogIn className="w-4 h-4 mr-2" />
                    Log in to Leave a Testimonial
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
