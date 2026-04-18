import { useCallback, useRef, useState } from "react";
import QuizPage from "./QuizPage";
import questions_data from "../constants";

interface Question {
  question: string;
  options: string[];
  correct_ans: string;
}

function Home() {
  const [start, setStart] = useState<boolean>(false);
  const [count, setCount] = useState(2);
  const [questions, setQuestions] = useState<Question[]>([]);
  const intervalRef = useRef(0);

  const startInterval = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const fecthQuestions = useCallback(() => {
    setQuestions(questions_data);
  }, []);

  return (
    <>
      <div className="bg-yellow-100 flex items-center justify-center h-screen">
        {count ? (
          <>
            <div className="flex flex-wrap flex-col items-center justify-around gap-2 shadow rounded-xl w-1/2 bg-white min-h-64 py-2">
              <h1 className="text-center text-xl">QUIZ</h1>
              {start ? (
                <p>Start in: {count}</p>
              ) : (
                <button
                  className="bg-blue-400 px-4 py-1 w-fit rounded-lg cursor-pointer hover:bg-blue-500 transition-all duration-300 hover:shadow-lg"
                  onClick={() => {
                    startInterval();
                    setStart((prev) => !prev);
                    fecthQuestions();
                  }}
                >
                  Start
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <QuizPage questions={questions} />
          </>
        )}
      </div>
    </>
  );
}

export default Home;
