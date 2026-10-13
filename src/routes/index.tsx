import { createFileRoute } from "@tanstack/react-router";
import { WellnessApp } from "@/components/wellness/app";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shri Shubhra Wellness | Your Health, Our Priority" },
      {
        name: "description",
        content:
          "One role-aware healthcare and Ayurvedic wellness application. Phase 1 frontend demonstration.",
      },
      { name: "theme-color", content: "#168B65" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    ],
  }),
  component: WellnessApp,
});
