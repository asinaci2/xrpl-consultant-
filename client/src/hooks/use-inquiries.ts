import { useMutation } from "@tanstack/react-query";
import { api, type InsertInquiry } from "@shared/routes"; // Importing schema types from routes if exported there, otherwise assumed from schema
import { apiRequest } from "@/lib/queryClient";

export function useCreateInquiry() {
  return useMutation({
    mutationFn: async (data: InsertInquiry) => {
      const res = await apiRequest(
        api.inquiries.create.method,
        api.inquiries.create.path,
        data
      );
      return res.json();
    },
  });
}
