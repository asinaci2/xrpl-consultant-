import { motion } from "framer-motion";
import { Mail, Phone, MapPin, CalendarDays, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Consultant {
  name: string;
  email: string;
  phone: string;
  location: string;
  locationLine2: string;
  contactHeadline: string;
  calendarUrl: string | null;
}

interface ContactInfo {
  headline: string;
  subheading: string;
  email: string;
  phone: string;
  location: string;
  locationLine2: string;
}

export function ConsultantContact({ consultant, slug }: { consultant: Consultant; slug: string }) {
  const { data: info } = useQuery<ContactInfo>({
    queryKey: ["/api/c/:slug/contact-info", slug],
    queryFn: async () => {
      const res = await fetch(`/api/c/${slug}/contact-info`);
      return res.json();
    },
  });

  const contact = {
    headline: info?.headline ?? consultant.contactHeadline,
    subheading: info?.subheading ?? "Schedule a consultation to discuss your blockchain strategy.",
    email: info?.email ?? consultant.email,
    phone: info?.phone ?? consultant.phone,
    location: info?.location ?? consultant.location,
    locationLine2: info?.locationLine2 ?? consultant.locationLine2,
  };

  const calendarUrl = consultant.calendarUrl;

  const embedUrl = calendarUrl
    ? calendarUrl.includes("?")
      ? `${calendarUrl}&gv=true`
      : `${calendarUrl}?gv=true`
    : null;

  return (
    <section id="contact" className="section-padding bg-black/85 backdrop-blur-sm text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-green-400 font-semibold tracking-wide uppercase text-sm mb-3">Get in Touch</h2>
            <h3 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">{contact.headline}</h3>
            <p className="text-gray-300 text-lg mb-12 max-w-md">{contact.subheading}</p>

            <div className="space-y-8">
              {contact.email && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Email</h4>
                    <a href={`mailto:${contact.email}`} className="text-gray-300 hover:text-green-400 transition-colors">{contact.email}</a>
                  </div>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Phone</h4>
                    <p className="text-gray-300">{contact.phone}</p>
                  </div>
                </div>
              )}
              {contact.location && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Office</h4>
                    <p className="text-gray-300">{contact.location}<br />{contact.locationLine2}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              <CalendarDays className="w-6 h-6 text-green-400" />
              <h4 className="text-2xl font-display font-bold text-white">Schedule a Meeting</h4>
            </div>

            {embedUrl ? (
              <div className="flex flex-col gap-3 flex-1">
                <div className="rounded-2xl overflow-hidden border border-green-500/20 shadow-2xl bg-white flex-1 min-h-[560px]">
                  <iframe
                    src={embedUrl}
                    title="Schedule a meeting"
                    className="w-full h-full min-h-[560px]"
                    frameBorder="0"
                    data-testid="iframe-calendar"
                    allow="camera; microphone"
                  />
                </div>
                <a
                  href={calendarUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-open-calendar"
                  className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors font-mono self-start"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in browser
                </a>
              </div>
            ) : (
              <div className="flex-1 min-h-[300px] rounded-2xl border border-green-500/20 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-4 p-8 text-center">
                <CalendarDays className="w-12 h-12 text-green-400/40" />
                <p className="text-gray-400 text-lg">Calendar scheduling coming soon</p>
                <p className="text-gray-600 text-sm">Check back shortly or reach out via email or phone.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
