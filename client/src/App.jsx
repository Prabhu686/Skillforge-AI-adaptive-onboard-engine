import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar   from "./components/Navbar.jsx";
import Landing  from "./pages/Landing.jsx";
import Upload   from "./pages/Upload.jsx";
import Results  from "./pages/Results.jsx";
import Compare  from "./pages/Compare.jsx";
import Tips     from "./pages/Tips.jsx";
import Builder  from "./pages/Builder.jsx";
import Quiz     from "./pages/Quiz.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"        element={<Landing />} />
        <Route path="/upload"  element={<Upload />} />
        <Route path="/results" element={<Results />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/tips"    element={<Tips />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/quiz"    element={<Quiz />} />
      </Routes>
    </BrowserRouter>
  );
}
