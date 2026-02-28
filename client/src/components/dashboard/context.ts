import { createContext, useContext } from "react";
import { useSearch } from "wouter";

export const AdminSlugContext = createContext<string | null>(null);

export function useAdminSlug() {
  return useContext(AdminSlugContext);
}

export function useSlugParam(): string {
  const override = useAdminSlug();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const slug = params.get("slug");
  return slug ? `?slug=${slug}` : (override ? `?slug=${override}` : "");
}
