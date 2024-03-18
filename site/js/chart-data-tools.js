// @ts-check
// import "bootstrap/dist/css/bootstrap.min.css";
import { h, mount } from "hyplate";
import { ChartConstantGenerator } from "./cc-generator.js";

const App = () => {
  return h(ChartConstantGenerator);
};

const mountNode = document.querySelector("div#app");
if (!mountNode) {
  throw new Error();
}
mount(h(App), mountNode);
