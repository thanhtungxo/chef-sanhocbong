import { auth } from "./auth";
import router from "./router";
import { analysis, pingModel } from "./analysis";

const http = router;

auth.addHttpRoutes(http);

// Register AI Engine HTTP endpoints
http.route({
  path: "/api/ping-model",
  method: "POST",
  handler: pingModel,
});
http.route({
  path: "/api/analysis",
  method: "POST",
  handler: analysis,
});

export default http;
