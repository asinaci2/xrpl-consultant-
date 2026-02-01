import { motion } from "framer-motion";
import { MatrixTweets } from "./MatrixTweets";
import { SiX } from "react-icons/si";

export function Testimonials() {
  return (
    <section id="testimonials" className="section-padding bg-black" data-testid="section-testimonials">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold mb-4"
            data-testid="badge-testimonials"
          >
            <SiX className="w-4 h-4" />
            Live Feed
          </div>
          <h2 
            className="text-3xl md:text-5xl font-display font-bold text-white mb-4"
            data-testid="text-testimonials-title"
          >
            Enter the <span className="text-green-400">Matrix</span>
          </h2>
          <p 
            className="text-lg text-gray-400 max-w-2xl mx-auto"
            data-testid="text-testimonials-description"
          >
            Real-time updates from the XRPL ecosystem. Follow the white rabbit.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          data-testid="container-matrix-feed"
        >
          <MatrixTweets />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-6 text-center"
        >
          <a
            href="https://twitter.com/AsiNaci2"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 hover:bg-green-500/20 transition-colors font-medium"
            data-testid="link-follow-twitter"
          >
            <SiX className="w-4 h-4" />
            Follow @AsiNaci2
          </a>
        </motion.div>
      </div>
    </section>
  );
}
