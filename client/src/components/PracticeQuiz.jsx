import { useState, useEffect } from "react";
import { api } from "../utils/api";

export default function PracticeQuiz({ addToast }) {
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Quiz parameters
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [count, setCount] = useState(5);

  // State
  const [loading, setLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    setLoadingSubjects(true);
    api.getSubjects()
      .then(setSubjects)
      .catch((err) => addToast(err.message || "Failed to load subjects", "error"))
      .finally(() => setLoadingSubjects(false));
  }, []);

  const handleStartQuiz = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      addToast("Please enter a topic", "warning");
      return;
    }

    setLoading(true);
    setQuizQuestions([]);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizCompleted(false);
    setHasStarted(true);

    try {
      const data = await api.generateQuiz({
        subject: selectedSubject || "General Study",
        topic,
        difficulty,
        count
      });
      if (Array.isArray(data) && data.length > 0) {
        setQuizQuestions(data);
      } else {
        throw new Error("Invalid format received from Gemini");
      }
    } catch (err) {
      addToast(err.message || "Failed to generate quiz. Make sure Gemini API Key is configured on the server.", "error");
      setHasStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (option) => {
    if (selectedAnswer !== null) return; // already answered
    setSelectedAnswer(option);
    const correct = quizQuestions[currentIdx].correctAnswer;
    if (option === correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    if (currentIdx + 1 < quizQuestions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestart = () => {
    setHasStarted(false);
    setQuizQuestions([]);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizCompleted(false);
  };

  return (
    <div className="quiz-page-container max-w-4xl mx-auto">
      {!hasStarted ? (
        <div className="card">
          <h2 className="section-title mb-6">🧠 Practice Quiz Generator</h2>
          <form onSubmit={handleStartQuiz} className="innovative-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="field-group">
                <label>Select Academic Subject</label>
                <div className="input-wrapper">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full p-[11px] bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="">General Study / No Specific Subject</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field-group">
                <label>Quiz Topic</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Photosynthesis, Newton's Laws, SQL Joins"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-[11px] bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-md text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="field-group">
                <label>Difficulty Rating</label>
                <div className="input-wrapper">
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-[11px] bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="Easy">Easy (Conceptual / Basics)</option>
                    <option value="Medium">Medium (Application / Intermediate)</option>
                    <option value="Hard">Hard (Analytical / Complex)</option>
                  </select>
                </div>
              </div>

              <div className="field-group">
                <label>Number of Questions</label>
                <div className="input-wrapper">
                  <select
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    className="w-full p-[11px] bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="innovative-submit-btn mt-4">
              Generate Quiz with Gemini AI 🔮
            </button>
          </form>
        </div>
      ) : loading ? (
        <div className="card p-8 text-center flex flex-col gap-4 items-center">
          <div className="loading-spinner !w-10 !height-10" />
          <h3 className="font-bold text-lg mt-2">Gemini AI is assembling your quiz...</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md">Gemini is designing custom multiple-choice questions matching your selected difficulty parameters.</p>
          <div className="w-full max-w-md mt-4 flex flex-col gap-3">
            <div className="skeleton h-6 w-3/4"></div>
            <div className="skeleton h-12 w-full"></div>
            <div className="skeleton h-12 w-full"></div>
            <div className="skeleton h-12 w-full"></div>
          </div>
        </div>
      ) : quizCompleted ? (
        <div className="card text-center p-8">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-3xl font-extrabold mb-2">Quiz Completed!</h2>
          <p className="text-[var(--text-secondary)] mb-6">Subject: {selectedSubject || "General"} | Topic: {topic}</p>
          
          <div className="flex justify-center items-center gap-6 mb-8">
            <div className="p-4 bg-[rgba(255,255,255,0.02)] border border-[var(--border)] rounded-xl min-w-[120px]">
              <span className="block text-3xl font-bold text-[var(--accent-primary)]">{score} / {quizQuestions.length}</span>
              <span className="text-xs text-[var(--text-secondary)]">Final Score</span>
            </div>
            <div className="p-4 bg-[rgba(255,255,255,0.02)] border border-[var(--border)] rounded-xl min-w-[120px]">
              <span className="block text-3xl font-bold text-[var(--accent-emerald)]">{Math.round((score / quizQuestions.length) * 100)}%</span>
              <span className="text-xs text-[var(--text-secondary)]">Accuracy Rate</span>
            </div>
          </div>

          <button onClick={handleRestart} className="innovative-submit-btn !w-auto px-8 mx-auto block">
            Take Another Quiz
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4 flex-wrap gap-2">
            <div>
              <span className="text-xs text-[var(--accent-primary)] font-bold tracking-wider uppercase">{difficulty} Difficulty</span>
              <h3 className="text-lg font-bold">Topic: {topic}</h3>
            </div>
            <div className="text-sm font-semibold text-[var(--text-secondary)]">
              Question <span className="text-[var(--text-primary)] font-bold">{currentIdx + 1}</span> of {quizQuestions.length}
            </div>
          </div>

          {/* Question Text */}
          <div className="text-md font-bold mb-6 text-[var(--text-primary)] leading-relaxed">
            {quizQuestions[currentIdx]?.question}
          </div>

          {/* Options List */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            {quizQuestions[currentIdx]?.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === quizQuestions[currentIdx].correctAnswer;
              const hasAnswered = selectedAnswer !== null;

              let btnClass = "w-full p-4 text-left border rounded-xl transition duration-200 bg-[rgba(255,255,255,0.02)] border-[var(--border)] hover:bg-[rgba(255,255,255,0.04)]";
              
              if (hasAnswered) {
                if (isCorrect) {
                  btnClass = "w-full p-4 text-left border rounded-xl bg-[rgba(16,185,129,0.08)] border-[var(--accent-emerald)] text-[var(--accent-emerald)] shadow-[0_0_15px_rgba(16,185,129,0.15)]";
                } else if (isSelected) {
                  btnClass = "w-full p-4 text-left border rounded-xl bg-[rgba(244,63,94,0.08)] border-[var(--accent-rose)] text-[var(--accent-rose)] shadow-[0_0_15px_rgba(244,63,94,0.15)]";
                } else {
                  btnClass = "w-full p-4 text-left border rounded-xl border-[var(--border)] opacity-50 bg-[rgba(255,255,255,0.01)]";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(option)}
                  disabled={hasAnswered}
                  className={btnClass}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {hasAnswered && isCorrect && <span className="font-bold text-sm">✓ Correct</span>}
                    {hasAnswered && isSelected && !isCorrect && <span className="font-bold text-sm">✗ Incorrect</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {selectedAnswer !== null && (
            <div className="p-4 bg-[rgba(255,255,255,0.02)] border border-[var(--border)] rounded-xl mb-6 animation-fade">
              <h4 className="font-bold text-sm mb-1 text-[var(--text-primary)]">Explanation</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {quizQuestions[currentIdx]?.explanation || "No explanation provided."}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-between items-center border-t border-[var(--border)] pt-4">
            <button onClick={handleRestart} className="back-btn !m-0">
              &larr; Quit Quiz
            </button>
            {selectedAnswer !== null && (
              <button onClick={handleNext} className="innovative-submit-btn !m-0 !w-auto px-6">
                {currentIdx + 1 === quizQuestions.length ? "Finish Quiz 🏁" : "Next Question &rarr;"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}