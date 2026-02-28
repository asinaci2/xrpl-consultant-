import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Mail, Megaphone, Phone, MapPin, Globe, Eye
} from "lucide-react";
import { SectionBanner } from "./SectionBanner";
import { FieldLabel } from "./FieldLabel";
import { useAdminSlug, useSlugParam } from "./context";

type ContactInfoData = {
  headline: string;
  subheading: string;
  email: string;
  phone: string;
  location: string;
  locationLine2: string;
};

export function ContactInfoTab({ slug }: { slug: string }) {
  const { toast } = useToast();
  const sp = useSlugParam();
  const override = useAdminSlug();
  const { data: info, isLoading } = useQuery<ContactInfoData>({
    queryKey: ["/api/dashboard/contact-info", override],
    queryFn: () => fetch(`/api/dashboard/contact-info${sp}`, { credentials: "include" }).then(r => r.json()),
  });

  const [headline, setHeadline] = useState("");
  const [subheading, setSubheading] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [locationLine2, setLocationLine2] = useState("");

  useEffect(() => {
    if (info) {
      setHeadline(info.headline); setSubheading(info.subheading);
      setEmail(info.email); setPhone(info.phone);
      setLocation(info.location); setLocationLine2(info.locationLine2);
    }
  }, [info]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/dashboard/contact-info${sp}`, { headline, subheading, email, phone, location, locationLine2 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/contact-info", override] });
      toast({ title: "Saved", description: "Contact section updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  return (
    <div className="space-y-5">
      <SectionBanner
        icon={Mail}
        iconBg="bg-teal-500/15"
        iconColor="text-teal-400"
        borderColor="border-teal-500"
        section="Contact Section"
        description="The 'Get In Touch' area at the very bottom of your public profile — where visitors reach out to you."
        slug={slug}
        anchor="contact"
      />

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-3">
          <Card className="bg-black/60 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-400 text-base flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Section
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <p className="text-gray-400">Loading...</p> : (
                <div className="space-y-4">
                  <div>
                    <FieldLabel icon={Megaphone}>Headline</FieldLabel>
                    <Input value={headline} onChange={e => setHeadline(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-headline" />
                  </div>
                  <div>
                    <FieldLabel icon={FileText}>Description</FieldLabel>
                    <Textarea value={subheading} onChange={e => setSubheading(e.target.value)} rows={3} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-subheading" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel icon={Mail}>Email</FieldLabel>
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-email" />
                    </div>
                    <div>
                      <FieldLabel icon={Phone}>Phone</FieldLabel>
                      <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-phone" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel icon={MapPin}>Location</FieldLabel>
                      <Input value={location} onChange={e => setLocation(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-location" />
                    </div>
                    <div>
                      <FieldLabel icon={Globe}>Location Line 2</FieldLabel>
                      <Input value={locationLine2} onChange={e => setLocationLine2(e.target.value)} className="bg-black/40 border-green-500/20 text-white" data-testid="input-contact-location2" />
                    </div>
                  </div>
                  <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white" data-testid="button-save-contact">
                    {saveMutation.isPending ? "Saving..." : "Save Contact Section"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contact section preview */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-green-400/60" />
            <span className="text-gray-400 text-xs font-medium">Section Preview</span>
          </div>
          <div
            className="rounded-xl border border-teal-500/20 overflow-hidden p-5 space-y-4"
            style={{
              background: "linear-gradient(180deg, #020e0e 0%, #051a14 100%)",
              backgroundImage: "linear-gradient(rgba(20,184,166,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.04) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            <h3 className="text-white font-bold text-lg leading-tight">
              {headline || <span className="text-gray-600 italic text-base">Your headline here</span>}
            </h3>
            {subheading && (
              <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{subheading}</p>
            )}
            <div className="space-y-2 pt-1">
              {email && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-teal-500/20 bg-teal-500/5">
                  <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="text-gray-300 text-xs truncate">{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-teal-500/20 bg-teal-500/5">
                  <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="text-gray-300 text-xs">{phone}</span>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-teal-500/20 bg-teal-500/5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="text-gray-300 text-xs">{location}{locationLine2 ? ` · ${locationLine2}` : ""}</span>
                </div>
              )}
              {!email && !phone && !location && (
                <p className="text-gray-700 text-xs italic text-center py-3">Fill in contact details to see preview</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
