import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Testimonial {
  id: number;
  consultantSlug: string;
  authorName: string;
  authorTitle: string;
  content: string;
  sortOrder: number;
}

export function Testimonials({ slug }: { slug: string }) {
  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["/api/c/:slug/testimonials", slug],
    queryFn: async () => {
      const res = await fetch(`/api/c/${slug}/testimonials`);
      return res.json();
    },
  });

  if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="section-padding bg-black/70 backdrop-blur-sm" data-testid="section-testimonials">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>
    </section>
  );
}
