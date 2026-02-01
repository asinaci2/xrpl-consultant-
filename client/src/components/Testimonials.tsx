import { motion } from "framer-motion";
import { useEffect } from "react";

export function Testimonials() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <section id="testimonials" className="section-padding bg-muted" data-testid="section-testimonials">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 
            className="text-secondary font-semibold tracking-wide uppercase text-sm mb-3"
            data-testid="text-testimonials-subtitle"
          >
            Community Voices
          </h2>
          <h3 
            className="text-3xl md:text-5xl font-display font-bold text-primary mb-6"
            data-testid="text-testimonials-title"
          >
            Shoutouts from the XRPL Fam
          </h3>
          <p 
            className="text-lg text-muted-foreground"
            data-testid="text-testimonials-description"
          >
            Live feed of appreciation from the community - auto-updates as new thanks roll in
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="rounded-md overflow-hidden"
          data-testid="container-twitter-timeline"
        >
          <a 
            className="twitter-timeline" 
            data-height="600" 
            data-theme="dark" 
            href="https://twitter.com/search?q=%40AsiNaci2%20(thanks%20OR%20appreciate)&src=typed_query"
            data-testid="link-twitter-timeline"
          >
            Tweets about @AsiNaci2
          </a>
        </motion.div>
      </div>
    </section>
  );
}
