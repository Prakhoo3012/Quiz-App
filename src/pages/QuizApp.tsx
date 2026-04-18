import { useState, useEffect, useCallback, useRef } from "react";
import { CSSProperties } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMER_SECONDS = 15;
const TOTAL_QUESTIONS = 10;
const API_URL = `https://opentdb.com/api.php?amount=${TOTAL_QUESTIONS}&type=multiple`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  category: string;
  type: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface HistoryRecord {
  question: string;
  correctAnswer: string;
  userAnswer: string | null;
  correct: boolean;
}

interface Lifelines {
  fiftyFifty: boolean;
  skip: boolean;
}

type Screen = "start" | "loading" | "quiz" | "result" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decodeHTML(str: string): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ─── StartScreen ──────────────────────────────────────────────────────────────

interface StartScreenProps {
  onStart: () => void;
}

function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div style={styles.card}>
      <div style={styles.emoji}>🧠</div>
      <h1 style={styles.title}>Quiz Challenge</h1>
      <p style={styles.subtitle}>
        {TOTAL_QUESTIONS} questions · 15s per question · Lifelines included
      </p>
      <button style={styles.btnPrimary} onClick={onStart}>
        Start Quiz
      </button>
    </div>
  );
}

// ─── LoadingScreen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={styles.card}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <p style={styles.subtitle}>Loading questions…</p>
    </div>
  );
}

// ─── ErrorScreen ──────────────────────────────────────────────────────────────

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div style={styles.card}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <p style={{ color: "#ef4444", marginBottom: 20 }}>{message}</p>
      <button style={styles.btnPrimary} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

// ─── ResultScreen ─────────────────────────────────────────────────────────────

interface ResultScreenProps {
  score: number;
  total: number;
  history: HistoryRecord[];
  onRestart: () => void;
}

function ResultScreen({ score, total, history, onRestart }: ResultScreenProps) {
  const [showReview, setShowReview] = useState<boolean>(false);
  const pct = Math.round((score / total) * 100);
  const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "😊" : "😅";

  return (
    <div style={{ ...styles.card, maxWidth: 640, width: "100%" }}>
      <div style={{ fontSize: 56 }}>{emoji}</div>
      <h2 style={styles.title}>Quiz Complete!</h2>
      <div style={styles.scoreBig}>
        {score} / {total}
      </div>
      <p style={{ color: "#94a3b8", marginBottom: 24 }}>{pct}% correct</p>

      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button style={styles.btnPrimary} onClick={onRestart}>
          Play Again
        </button>
        <button
          style={styles.btnSecondary}
          onClick={() => setShowReview(!showReview)}
        >
          {showReview ? "Hide Review" : "Review Answers"}
        </button>
      </div>

      {showReview && (
        <div style={{ marginTop: 28, textAlign: "left", width: "100%" }}>
          {history.map((h, i) => (
            <div
              key={i}
              style={{
                ...styles.reviewItem,
                borderColor: h.correct ? "#22c55e" : "#ef4444",
              }}
            >
              <p style={styles.reviewQ}>
                <strong>Q{i + 1}:</strong> {h.question}
              </p>
              <p style={{ color: "#22c55e", fontSize: 14 }}>
                ✅ {h.correctAnswer}
              </p>
              {!h.correct && (
                <p style={{ color: "#ef4444", fontSize: 14 }}>
                  ❌ Your answer: {h.userAnswer ?? "Time's up!"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── QuizScreen ───────────────────────────────────────────────────────────────

interface QuizScreenProps {
  questions: Question[];
  onFinish: (score: number, history: HistoryRecord[]) => void;
}

function QuizScreen({ questions, onFinish }: QuizScreenProps) {
  const [index, setIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_SECONDS);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [lifelines, setLifelines] = useState<Lifelines>({
    fiftyFifty: true,
    skip: true,
  });
  const [eliminated, setEliminated] = useState<string[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answered = useRef<boolean>(false);

  const current = questions[index];

  // Shuffle options on question change
  useEffect(() => {
    const all = shuffle([current.correct_answer, ...current.incorrect_answers]);
    setOptions(all);
    setEliminated([]);
    answered.current = false;
    setSelected(null);
    setTimeLeft(TIMER_SECONDS);
  }, [index, current]);

  const goNext = useCallback(
    (userAnswer: string | null) => {
      if (answered.current) return;
      answered.current = true;
      if (timerRef.current) clearInterval(timerRef.current);

      const isCorrect = userAnswer === current.correct_answer;
      if (isCorrect) setScore((s) => s + 1);

      const record: HistoryRecord = {
        question: decodeHTML(current.question),
        correctAnswer: decodeHTML(current.correct_answer),
        userAnswer: userAnswer ? decodeHTML(userAnswer) : null,
        correct: isCorrect,
      };

      setHistory((h) => {
        const updated = [...h, record];
        setTimeout(() => {
          if (index + 1 >= questions.length) {
            onFinish(isCorrect ? score + 1 : score, updated);
          } else {
            setIndex((i) => i + 1);
          }
        }, 800);
        return updated;
      });

      setSelected(userAnswer);
    },
    [current, index, questions.length, score, onFinish],
  );

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          goNext(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [goNext]);

  // Lifeline: 50/50
  const useFiftyFifty = useCallback(() => {
    if (!lifelines.fiftyFifty || selected) return;
    const wrongs = options.filter((o) => o !== current.correct_answer);
    const toElim = shuffle(wrongs).slice(0, 2);
    setEliminated(toElim);
    setLifelines((l) => ({ ...l, fiftyFifty: false }));
  }, [lifelines.fiftyFifty, selected, options, current.correct_answer]);

  // Lifeline: Skip
  const useSkip = useCallback(() => {
    if (!lifelines.skip || selected) return;
    setLifelines((l) => ({ ...l, skip: false }));
    answered.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const record: HistoryRecord = {
      question: decodeHTML(current.question),
      correctAnswer: decodeHTML(current.correct_answer),
      userAnswer: "Skipped",
      correct: false,
    };

    setHistory((h) => {
      const updated = [...h, record];
      setTimeout(() => {
        if (index + 1 >= questions.length) {
          onFinish(score, updated);
        } else {
          setIndex((i) => i + 1);
        }
      }, 400);
      return updated;
    });
  }, [
    lifelines.skip,
    selected,
    current,
    index,
    questions.length,
    score,
    onFinish,
  ]);

  const timerColor =
    timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f59e0b" : "#22c55e";
  const progress = (index / questions.length) * 100;

  return (
    <div style={{ ...styles.card, maxWidth: 620, width: "100%" }}>
      {/* Progress bar */}
      <div style={styles.progressBg}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.badge}>
          Q {index + 1} / {questions.length}
        </span>
        <span
          style={{
            ...styles.timerBadge,
            color: timerColor,
            borderColor: timerColor,
          }}
        >
          ⏱ {timeLeft}s
        </span>
        <span style={styles.badge}>⭐ {score}</span>
      </div>

      {/* Category */}
      <p style={styles.category}>
        {decodeHTML(current.category)} · {current.difficulty}
      </p>

      {/* Question */}
      <h2 style={styles.question}>{decodeHTML(current.question)}</h2>

      {/* Lifelines */}
      <div style={styles.lifelineRow}>
        <button
          style={{
            ...styles.lifeline,
            opacity: lifelines.fiftyFifty && !selected ? 1 : 0.35,
          }}
          onClick={useFiftyFifty}
          disabled={!lifelines.fiftyFifty || !!selected}
          title="50/50 – eliminate two wrong answers"
        >
          50/50
        </button>
        <button
          style={{
            ...styles.lifeline,
            opacity: lifelines.skip && !selected ? 1 : 0.35,
          }}
          onClick={useSkip}
          disabled={!lifelines.skip || !!selected}
          title="Skip this question"
        >
          ⏭ Skip
        </button>
      </div>

      {/* Options */}
      <div style={styles.options}>
        {options.map((opt, i) => {
          const isElim = eliminated.includes(opt);
          const isSelected = selected === opt;
          const isCorrect = opt === current.correct_answer;
          const revealed = !!selected;

          let bg = "#1e293b";
          let border = "#334155";
          if (isElim) {
            bg = "#0f172a";
            border = "#1e293b";
          } else if (revealed && isCorrect) {
            bg = "#14532d";
            border = "#22c55e";
          } else if (revealed && isSelected && !isCorrect) {
            bg = "#450a0a";
            border = "#ef4444";
          }

          return (
            <button
              key={i}
              style={{
                ...styles.option,
                background: bg,
                borderColor: border,
                opacity: isElim ? 0.3 : 1,
                cursor: isElim || revealed ? "default" : "pointer",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
              }}
              onClick={() => !isElim && !revealed && goNext(opt)}
              disabled={isElim || !!selected}
            >
              <span style={styles.optLabel}>{["A", "B", "C", "D"][i]}</span>
              {decodeHTML(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function QuizApp() {
  const [screen, setScreen] = useState<Screen>("start");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fetchQuestions = useCallback(async () => {
    setScreen("loading");
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (data.response_code !== 0)
        throw new Error("Failed to load questions. Try again.");
      setQuestions(data.results as Question[]);
      setScreen("quiz");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setScreen("error");
    }
  }, []);

  const handleFinish = useCallback((score: number, hist: HistoryRecord[]) => {
    setFinalScore(score);
    setHistory(hist);
    setScreen("result");
  }, []);

  const handleRestart = useCallback(() => {
    setQuestions([]);
    setFinalScore(0);
    setHistory([]);
    fetchQuestions();
  }, [fetchQuestions]);

  return (
    <div style={styles.root}>
      {screen === "start" && <StartScreen onStart={fetchQuestions} />}
      {screen === "loading" && <LoadingScreen />}
      {screen === "error" && (
        <ErrorScreen message={errorMsg} onRetry={fetchQuestions} />
      )}
      {screen === "quiz" && questions.length > 0 && (
        <QuizScreen questions={questions} onFinish={handleFinish} />
      )}
      {screen === "result" && (
        <ResultScreen
          score={finalScore}
          total={TOTAL_QUESTIONS}
          history={history}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "24px 16px",
  },
  card: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 20,
    padding: "36px 32px",
    textAlign: "center",
    color: "#f1f5f9",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
    width: "100%",
    maxWidth: 480,
  },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 700, margin: "0 0 8px", color: "#f1f5f9" },
  subtitle: { color: "#94a3b8", marginBottom: 28, lineHeight: 1.6 },
  btnPrimary: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 32px",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnSecondary: {
    background: "transparent",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: "14px 24px",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
  },
  progressBg: {
    height: 4,
    background: "#1e293b",
    borderRadius: 99,
    marginBottom: 24,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    borderRadius: 99,
    transition: "width 0.4s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badge: {
    background: "#1e293b",
    color: "#94a3b8",
    borderRadius: 8,
    padding: "4px 12px",
    fontSize: 13,
    fontWeight: 600,
  },
  timerBadge: {
    border: "1.5px solid",
    borderRadius: 8,
    padding: "4px 12px",
    fontSize: 13,
    fontWeight: 700,
    transition: "color 0.3s, border-color 0.3s",
  },
  category: {
    color: "#64748b",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  question: {
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.6,
    marginBottom: 20,
    color: "#e2e8f0",
  },
  lifelineRow: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
    marginBottom: 18,
  },
  lifeline: {
    background: "#1e293b",
    color: "#f59e0b",
    border: "1px solid #f59e0b",
    borderRadius: 8,
    padding: "6px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  options: { display: "flex", flexDirection: "column", gap: 10 },
  option: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    border: "1.5px solid",
    borderRadius: 12,
    color: "#e2e8f0",
    fontSize: 15,
    textAlign: "left",
    transition: "all 0.2s",
    fontWeight: 500,
  },
  optLabel: {
    background: "#334155",
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 12,
    fontWeight: 700,
    color: "#94a3b8",
    minWidth: 24,
    textAlign: "center",
  },
  scoreBig: {
    fontSize: 52,
    fontWeight: 800,
    color: "#6366f1",
    lineHeight: 1,
    marginBottom: 4,
  },
  reviewItem: {
    border: "1px solid",
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 10,
    background: "#0f172a",
  },
  reviewQ: { fontSize: 14, color: "#cbd5e1", marginBottom: 6 },
};
