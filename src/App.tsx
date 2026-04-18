import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import QuizApp from './pages/QuizApp';

function App() {
  return (
    <BrowserRouter>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<QuizApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;