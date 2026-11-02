import "./styles.css";
import { App } from "./app";

window.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init().catch((err) => {
    console.error("Failed to initialise Free MD Editor", err);
  });
});
