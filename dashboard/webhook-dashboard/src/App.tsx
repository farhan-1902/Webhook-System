import { BrowserRouter, Route, Routes } from "react-router";
import Home  from "../src/pages/Home";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { lazy } from "react";

const Webhooks = lazy(() => import("./pages/Webhooks"));
const Logs = lazy(() => import("./pages/Logs"));
const FailedJobs = lazy(() => import("./pages/FailedJobs"));

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/webhooks" element={<Webhooks />}/>
          <Route path="/delivery-logs" element={<Logs />}/>
          <Route path="/failed-jobs" element={<FailedJobs />}/>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  );
}

export default App;
