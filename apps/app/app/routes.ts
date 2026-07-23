import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [index("routes/home.tsx"), route("sets/*", "routes/set.tsx")]),
  route("api/submit-answer", "routes/api.submit-answer.ts"),
  route("api/auth/*", "routes/api.auth.$.ts"),
] satisfies RouteConfig;
