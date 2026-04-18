import { useCallback, useEffect, useRef, useState } from "react";
import Result from "./Result";

const TIMER = 5;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

interface Question {
  question: string;
  options: string[];
  correct_ans: string;
}

interface QuizPageProps {
  questions: Question[];
}

function QuizPage({ questions }: QuizPageProps) {
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState<number>(TIMER);
  const [index, setIndex] = useState<number>(0);
  const [currQuestion, setCurrQuestion] = useState<Question | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [result, setResult] = useState(false);

  const intervalRef = useRef<number>(0);
  const controlRef = useRef<boolean>(false);

  useEffect(() => {
    const all = shuffle([...questions[index].options]);
    setOptions(all);
    setCurrQuestion(questions[index]);
    controlRef.current = false;
    setTimer(TIMER);
  }, [index]);

  const onFinish = useCallback(() => {}, []);

  const goNext = useCallback(
    (userAnswer: string | null) => {
      if (controlRef.current) return;
      controlRef.current = true;
      setTimeout(() => {
        if (index + 1 >= questions.length) {
          setResult(true);
          onFinish();
        } else {
          setIndex((i) => i + 1);
        }
      }, 500);
    },
    [index, questions.length],
  );

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimer((c) => {
        if (c <= 1) {
          clearInterval(intervalRef.current);
          if (!controlRef.current) goNext(null);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      clearInterval(intervalRef.current);
    };
  }, [goNext]);

  if (loading) {
    return (
      <>
        <div className="flex flex-col gap-2 shadow rounded-xl w-1/2 bg-white min-h-64 py-2">
          <p>Data loading...</p>
        </div>
      </>
    );
  }

  if (result) {
    return (
      <>
        <Result />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 shadow rounded-xl w-1/2 bg-white min-h-64 py-2">
        <div className="w-full h-full px-10 py-1 flex flex-row justify-between">
          <h1>Quiz</h1>
          <p>Timer: {timer}</p>
          <p>
            Q. No: {index + 1}/{questions.length}
          </p>
        </div>

        <hr />

        <div className="w-full px-2 py-1">
          <p className="text-lg">{currQuestion?.question}</p>
          <div className="flex flex-col w-full my-2">
            {options.map((p, index) => {
              return (
                <div className="my-2 mx-5" key={index}>
                  <button className="shadow flex gap-10 px-5 py-2 bg-blue-400 w-fit rounded-lg cursor-pointer hover:bg-blue-500 transition-all duration-300 hover:shadow-lg">
                    <span>{["A", "B", "C", "D"][index]}</span>
                    {p}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <hr />

        <div className="flex justify-end px-5">
          <button
            className="bg-blue-400 px-4 py-1 w-fit rounded-lg cursor-pointer hover:bg-blue-500 transition-all duration-300 hover:shadow-lg"
            onClick={() => goNext(null)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}

export default QuizPage;
