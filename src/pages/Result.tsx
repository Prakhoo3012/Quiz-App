interface HistoryData {
  question: string;
  user_ans: string | null;
  correct_ans: string;
  correct: boolean;
}

interface ResultProps {
  score: number;
  summary: HistoryData[];
  onRestart: () => void
}

function Result({ score, summary, onRestart }: ResultProps) {
  return (
    <>
      <div className="flex flex-col gap-2 shadow rounded-xl w-1/2 bg-white min-h-64 py-2">
        <div className="w-full h-full px-10 py-1 flex flex-row justify-between">
          <button
            disabled={true}
            className="px-5 py-2 bg-blue-100/50 w-fit rounded-lg cursor-pointer"
          >
            Final Score: {score}/{summary.length}
          </button>
        </div>
        <div className=" px-5">
          <table className="table-auto">
            <thead>
              <tr className="bg-amber-100">
                <th>Q.No.</th>
                <th>Question</th>
                <th>Your Answer</th>
                <th>Correct Answer</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((p, index) => {
                return (
                  <tr
                    key={index}
                    className="mb-2"
                    style={{
                      backgroundColor: p.correct ? "#DAF9DE" : "#FFA6A6",
                    }}
                  >
                    <td className="px-0.5">{index + 1}</td>
                    <td className="px-0.5">{p.question}</td>
                    <td className="px-0.5">{p.user_ans}</td>
                    <td className="px-1">{p.correct_ans}</td>
                    <td className="px-0.5">{p.correct ? "1/1" : "0/1"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <hr />

        <div className="flex justify-end px-5">
          <button
            className="bg-blue-400 px-4 py-1 w-fit rounded-lg cursor-pointer hover:bg-blue-500 transition-all duration-300 hover:shadow-lg"
            onClick={onRestart}
          >
            Restart
          </button>
        </div>
      </div>
    </>
  );
}

export default Result;
