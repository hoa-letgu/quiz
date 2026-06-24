import { useState } from "react";
import "./App.css";

const questions = [
  {
    question: "What is the main topic of the article?",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900",
    answers: ["Example", "Sample", "Test", "Trial"],
    correct: 2,
  },
  {
    question: "Which country is primarily associated with the article?",
    image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=900",
    answers: ["Vietnam", "Japan", "France", "Canada"],
    correct: 0,
  },
];

export default function App() {
  const [screen, setScreen] = useState("home");
  const [pin] = useState("933130");
  const [name, setName] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  
  const q = questions[qIndex];

  function answer(index) {
	  setSelected(index);

	  if (index === q.correct) setScore(score + 100);

	  setTimeout(() => {
		setSelected(null);

		if (qIndex + 1 < questions.length) {
		  setQIndex(qIndex + 1);
		} else {
		  setScreen("result");
		}
	  }, 700);
  }

  return (
    <div className="app">
      {screen === "home" && (
        <div className="home">
          <Header />

          <div className="join-box">
            <span>Join Game? Enter PIN:</span>
            <input placeholder="123 456" />
            <button onClick={() => setScreen("name")}>Join</button>
          </div>

          <div className="cards">
            <div className="big-card">
              <div className="cartoon">🧑‍🎓</div>
              <h1>Create a quiz</h1>
              <p>Play for free with 300 participants</p>
              <button>Quiz editor</button>
            </div>

            <div className="big-card">
              <div className="cartoon">🤖</div>
              <h1>A.I.</h1>
              <p>Generate a quiz from any subject or pdf</p>
              <button>Quiz generator</button>
            </div>
          </div>
        </div>
      )}

      {screen === "name" && (
        <div className="center">
          <div className="panel small">
            <h1>Enter your name</h1>
            <input
              className="name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <button
              className="main-btn"
              onClick={() => name && setScreen("quiz")}
            >
              Start
            </button>
          </div>
        </div>
      )}

      {screen === "quiz" && (
        <div className="game">
          <TopBar pin={pin} slide={`${qIndex + 1}/${questions.length}`} />

          <div className="quiz-layout">
            <div className="question-area">
              <h1>{q.question}</h1>

              <div className="answers">
                {q.answers.map((a, i) => (
                 <button
				  key={i}
				  className={`answer answer-${i} ${
					selected === i
					  ? i === q.correct
						? "correct"
						: "wrong"
					  : ""
				  }`}
				  onClick={() => answer(i)}
				  disabled={selected !== null}
				>
				  {a}
				</button>
                ))}
              </div>

              <div className="timer">
                <div></div>
                <span>890</span>
              </div>
            </div>

            <div className="media-box">
              <img src={q.image} />
              <span>AI GENERATED</span>
            </div>
          </div>
        </div>
      )}

      {screen === "result" && (
        <div className="game">
          <TopBar pin={pin} slide={`${questions.length}/${questions.length}`} />

          <div className="leaderboard">
            <table>
              <thead>
                <tr>
                  <th>Player name</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                  {questions.map((_, i) => (
                    <th key={i}>Q{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>🧑 {name || "Player"}</td>
                  <td>{score}</td>
                  <td>{Math.round((score / (questions.length * 100)) * 100)}%</td>
                  {questions.map((_, i) => (
                    <td key={i}>✖</td>
                  ))}
                </tr>
              </tbody>
            </table>

            <button className="leader-btn">View leaderboard</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="home-header">
      <div className="logo">QUIZ<span>.com</span></div>
      <input className="search" />
      <div className="user-icon">👤</div>
    </div>
  );
}

function TopBar({ pin, slide }) {
  return (
    <div className="topbar">
      <div className="logo small-logo">QUIZ<span>.com</span></div>
      <b>PIN {pin}</b>
      <b>Test</b>
      <div className="top-right">
        <b>Slide {slide}</b>
        <span>⏸</span>
        <span>⚙</span>
        <span>⛶</span>
      </div>
    </div>
  );
}