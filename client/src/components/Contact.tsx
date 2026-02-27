import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { useCreateInquiry } from "@/hooks/use-inquiries";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertInquirySchema } from "@shared/schema";

const formSchema = insertInquirySchema;

export function Contact() {
  const { toast } = useToast();
  const mutation = useCreateInquiry();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values, {
      onSuccess: () => {
        toast({
          title: "Inquiry Sent",
          description: "Thank you for reaching out. Edwin will be in touch shortly.",
        });
        form.reset();
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again later.",
          variant: "destructive",
        });
      },
    });
  }

  return (
    <section id="contact" className="section-padding bg-black/85 backdrop-blur-sm text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* Contact Info */}
          <div>
            <h2 className="text-green-400 font-semibold tracking-wide uppercase text-sm mb-3">Get in Touch</h2>
            <h3 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
              Ready to Innovate?
            </h3>
            <p className="text-gray-300 text-lg mb-12 max-w-md">
              Schedule a consultation to discuss your blockchain strategy and how XRPL can transform your business.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Email</h4>
                  <a href="mailto:contact@edwingutierrez.com" className="text-gray-300 hover:text-green-400 transition-colors">
                    contact@edwingutierrez.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Phone</h4>
                  <p className="text-gray-300">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Office</h4>
                  <p className="text-gray-300">
                    San Francisco, CA<br />
                    Available Worldwide Remote
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-black/60 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-green-500/20"
          >
            <h4 className="text-2xl font-display font-bold text-white mb-6">Send a Message</h4>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 font-medium">Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" className="bg-black/40 border-green-500/20 focus:border-green-400 h-12 rounded-lg text-white placeholder:text-gray-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 font-medium">Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="john@company.com" className="bg-black/40 border-green-500/20 focus:border-green-400 h-12 rounded-lg text-white placeholder:text-gray-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 font-medium">How can I help?</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell me about your project needs..." 
                          className="bg-black/40 border-green-500/20 focus:border-green-400 min-h-[150px] rounded-lg resize-none text-white placeholder:text-gray-500" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="w-full h-12 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-lg text-lg shadow-lg shadow-green-500/20 transition-all hover:scale-[1.02]"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Submit Inquiry"
                  )}
                </Button>
              </form>
            </Form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
