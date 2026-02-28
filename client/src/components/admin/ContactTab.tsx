import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Phone } from "lucide-react";

type ContactInfoData = {
  id: number;
  headline: string;
  subheading: string;
  email: string;
  phone: string;
  location: string;
  locationLine2: string;
};

export function ContactTab() {
  const { toast } = useToast();

  const { data: info, isLoading } = useQuery<ContactInfoData>({
    queryKey: ["/api/contact-info"],
  });

  const [headline, setHeadline] = useState("");
  const [subheading, setSubheading] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [locationLine2, setLocationLine2] = useState("");

  useEffect(() => {
    if (info) {
      setHeadline(info.headline);
      setSubheading(info.subheading);
      setEmail(info.email);
      setPhone(info.phone);
      setLocation(info.location);
      setLocationLine2(info.locationLine2);
    }
  }, [info]);

  const updateMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", "/api/contact-info", {
        headline,
        subheading,
        email,
        phone,
        location,
        locationLine2,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-info"] });
      toast({ title: "Saved", description: "Contact section updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save contact info.", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <Card className="bg-black/60 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 text-lg flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Edit "Get in Touch" Section
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Headline</label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Ready to Innovate?"
                  className="bg-black/40 border-green-500/20 text-white"
                  data-testid="input-contact-headline"
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm font-medium block mb-1">Description</label>
                <Textarea
                  value={subheading}
                  onChange={(e) => setSubheading(e.target.value)}
                  placeholder="Schedule a consultation..."
                  className="bg-black/40 border-green-500/20 text-white min-h-[100px] resize-none"
                  data-testid="input-contact-subheading"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">Email</label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                    className="bg-black/40 border-green-500/20 text-white"
                    data-testid="input-contact-email"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">Phone</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="bg-black/40 border-green-500/20 text-white"
                    data-testid="input-contact-phone"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">Office Location</label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, CA"
                    className="bg-black/40 border-green-500/20 text-white"
                    data-testid="input-contact-location"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-medium block mb-1">Location Line 2</label>
                  <Input
                    value={locationLine2}
                    onChange={(e) => setLocationLine2(e.target.value)}
                    placeholder="Available Worldwide Remote"
                    className="bg-black/40 border-green-500/20 text-white"
                    data-testid="input-contact-location2"
                  />
                </div>
              </div>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-save-contact"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
