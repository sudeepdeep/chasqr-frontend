import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ToastContainer } from "react-toastify";
import { QueryClient, QueryClientProvider } from "react-query";
import "react-toastify/dist/ReactToastify.css";

const queryClient = new QueryClient();

const app = (
  <>
    <ToastContainer />
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </>
);

const rootElement = document.getElementById("root") as HTMLElement;
if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}
