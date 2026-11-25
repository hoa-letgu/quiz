import { createContext, useContext, useEffect, useRef, useState } from "react";
import { saveQuizToApi } from "./api/quizApi";
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

const categories = [
  ["home", "Start"],
  ["palette", "Art & Literature"],
  ["star", "Entertainment"],
  ["globe", "Geography"],
  ["history", "History"],
  ["chat", "Languages"],
  ["leaf", "Science & Nature"],
  ["ball", "Sports"],
  ["trivia", "Trivia"],
];

const slideTypes = [
  ["buttons", "Buttons", "One correct answer"],
  ["checkboxes", "Checkboxes", "Multiple correct answers"],
  ["reorder", "Reorder", "Place answers in the correct order"],
  ["range", "Range", "Guess the answer on a scale"],
  ["location", "Location", "Pin the answer on a map"],
  ["pinpoint", "Pinpoint", "Pin the answer on an image"],
  ["type", "Type answer", "Type the correct answer"],
  ["ai", "AI assisted", "Generate from a PDF"],
  ["info", "Info slide", "Provide more context"],
];

const EditorMediaContext = createContext(null);
const SlideActionsContext = createContext(null);
const SlideDataContext = createContext(null);
const EDITOR_SESSION_KEY = "quiz-battle-editor-session";

function createEditorSlide(id) {
  return {
    checkboxAnswers: ["", "", "", ""],
    correctAnswer: "",
    falseAnswers: ["", "", ""],
    funFact: "",
    id,
    mediaImage: null,
    mediaKind: null,
    question: "",
    rangeCorrectValue: "",
    rangeMax: "50",
    rangeMin: "0",
    reorderItems: ["", "", "", ""],
    text: "",
    type: "add-slide",
    typeAnswer: "",
  };
}

function loadEditorSession() {
  try {
    const rawSession = sessionStorage.getItem(EDITOR_SESSION_KEY);
    if (!rawSession) return null;
    const parsed = JSON.parse(rawSession);
    if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) return null;

    return {
      activeSlideId: parsed.activeSlideId,
      slides: parsed.slides.map((slide) => ({ ...createEditorSlide(slide.id), ...slide })),
    };
  } catch {
    return null;
  }
}

function updateSlideArray(slideData, field, index, value) {
  const currentValues = slideData?.slide?.[field] ?? [];
  const nextValues = [...currentValues];
  nextValues[index] = value;
  slideData?.updateSlide({ [field]: nextValues });
}

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

          <main className="home-shell">
            <div className="join-box">
              <span>Join Game? Enter PIN:</span>
              <input
                aria-label="Enter game pin"
                placeholder="123 456"
                onKeyDown={(event) => {
                  if (event.key === "Enter") setScreen("name");
                }}
              />
            </div>

            <CategoryNav />

            <div className="cards">
              <div className="big-card">
                <QuizIllustration variant="write" />
                <div className="card-copy">
                  <h1>Create a quiz</h1>
                  <p>Play for free with 300 participants</p>
                  <button onClick={() => setScreen("editor")} type="button">
                    Quiz editor
                  </button>
                </div>
              </div>

              <div className="big-card">
                <QuizIllustration variant="ai" />
                <div className="card-copy">
                  <h1>A.I.</h1>
                  <p>Generate a quiz from any subject or pdf</p>
                  <button className="blue-button" type="button">
                    Quiz generator
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {screen === "editor" && <EditorScreen onDone={() => setScreen("home")} />}

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
              type="button"
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
                    key={a}
                    className={`answer answer-${i} ${
                      selected === i ? (i === q.correct ? "correct" : "wrong") : ""
                    }`}
                    onClick={() => answer(i)}
                    disabled={selected !== null}
                    type="button"
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
              <img src={q.image} alt="" />
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
                  <td>{name || "Player"}</td>
                  <td>{score}</td>
                  <td>{Math.round((score / (questions.length * 100)) * 100)}%</td>
                  {questions.map((_, i) => (
                    <td key={i}>x</td>
                  ))}
                </tr>
              </tbody>
            </table>

            <button className="leader-btn" type="button">
              View leaderboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditorScreen({ onDone }) {
  const restoredSession = useRef(loadEditorSession());
  const nextSlideIdRef = useRef(
    restoredSession.current
      ? Math.max(...restoredSession.current.slides.map((slide) => slide.id)) + 1
      : 2,
  );
  const [slides, setSlides] = useState(restoredSession.current?.slides ?? [createEditorSlide(1)]);
  const [activeSlideId, setActiveSlideId] = useState(restoredSession.current?.activeSlideId ?? 1);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showPaint, setShowPaint] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const uploadInputRef = useRef(null);
  const activeSlide = slides.find((slide) => slide.id === activeSlideId) ?? slides[0];
  const editorView = activeSlide?.type ?? "add-slide";
  const activeSlideIndex = Math.max(slides.findIndex((slide) => slide.id === activeSlideId), 0);

  function updateActiveSlide(updates) {
    setSlides((currentSlides) =>
      currentSlides.map((slide) => (slide.id === activeSlideId ? { ...slide, ...updates } : slide)),
    );
  }

  useEffect(() => {
    try {
      sessionStorage.setItem(
        EDITOR_SESSION_KEY,
        JSON.stringify({
          activeSlideId,
          slides,
        }),
      );
    } catch {
      // Session storage is only temporary; if the browser refuses a large image,
      // the editor should keep working in memory.
    }
  }, [activeSlideId, slides]);

  function addSlide() {
    const nextSlide = createEditorSlide(nextSlideIdRef.current);
    nextSlideIdRef.current += 1;
    setSlides((currentSlides) => [...currentSlides, nextSlide]);
    setActiveSlideId(nextSlide.id);
  }

  function duplicateSlide() {
    const nextSlide = {
      ...activeSlide,
      id: nextSlideIdRef.current,
    };
    nextSlideIdRef.current += 1;
    setSlides((currentSlides) => {
      const activeIndex = currentSlides.findIndex((slide) => slide.id === activeSlideId);
      const insertIndex = activeIndex >= 0 ? activeIndex + 1 : currentSlides.length;
      return [
        ...currentSlides.slice(0, insertIndex),
        nextSlide,
        ...currentSlides.slice(insertIndex),
      ];
    });
    setActiveSlideId(nextSlide.id);
  }

  function deleteSlide() {
    setSlides((currentSlides) => {
      if (currentSlides.length === 1) {
        const replacement = createEditorSlide(nextSlideIdRef.current);
        nextSlideIdRef.current += 1;
        setActiveSlideId(replacement.id);
        return [replacement];
      }

      const activeIndex = currentSlides.findIndex((slide) => slide.id === activeSlideId);
      const nextSlides = currentSlides.filter((slide) => slide.id !== activeSlideId);
      const nextActiveIndex = Math.min(Math.max(activeIndex, 0), nextSlides.length - 1);
      setActiveSlideId(nextSlides[nextActiveIndex].id);
      return nextSlides;
    });
  }

  function handleEditorClick(event) {
    const button = event.target.closest("button");
    if (!button) return;

    const label = button.textContent.trim();
    if (button.classList.contains("add-media-button") || label === "Add media to fun fact") {
      setShowMediaModal(true);
    }
  }

  async function handleDone() {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError("");

    try {
      await saveQuizToApi(slides);
      sessionStorage.removeItem(EDITOR_SESSION_KEY);
      onDone();
    } catch (error) {
      setSaveError(error.message || "Khong luu duoc quiz");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <EditorMediaContext.Provider
      value={{
        mediaKind: activeSlide?.mediaKind,
        paintImage: activeSlide?.mediaImage,
        clearPaintImage: () => {
          updateActiveSlide({ mediaImage: null, mediaKind: null });
        },
        editPaint: () => setShowPaint(true),
        replacePaint: () => setShowMediaModal(true),
      }}
    >
      <SlideActionsContext.Provider value={{ deleteSlide, duplicateSlide }}>
      <SlideDataContext.Provider value={{ slide: activeSlide, updateSlide: updateActiveSlide }}>
      <div className="editor-screen" onClick={handleEditorClick}>
      <header className="editor-topbar">
        <div className="brand editor-logo" aria-label="Quiz.com">
          <span className="logo-q">Q</span>
          <span className="logo-u">u</span>
          <span className="logo-i">i</span>
          <span className="logo-z">z</span>
          <span className="logo-dot">.</span>
          <span className="logo-com">com</span>
        </div>
        <button className="editor-done" disabled={isSaving} onClick={handleDone} type="button">
          {isSaving ? "Saving..." : "Done"}
        </button>
        {saveError && <span className="editor-save-error">{saveError}</span>}
        <button className="editor-preview" onClick={() => setShowPreview(true)} type="button">
          <SvgIcon name="eye" />
          <span>Preview</span>
        </button>
      </header>

      {editorView === "add-slide" ? (
        <main className="editor-main">
          <h1>Add Slide</h1>
          <div className="slide-type-grid">
            {slideTypes.map(([icon, title, description]) => (
              <button
                className="slide-type-card"
                key={title}
                onClick={() => {
                  if (["buttons", "checkboxes", "reorder", "range", "pinpoint", "type", "info"].includes(icon)) {
                    updateActiveSlide({ type: icon });
                  }
                }}
                type="button"
              >
                <span className="slide-type-icon">
                  <SlideTypeIcon name={icon} />
                </span>
                <span className="slide-type-copy">
                  <strong>{title}</strong>
                  <span>{description}</span>
                </span>
              </button>
            ))}
          </div>
        </main>
      ) : (
        <QuestionEditor view={editorView} />
      )}

      <footer className={`editor-footer ${editorView !== "add-slide" ? "question-footer" : ""}`}>
        <button className="settings-button" type="button">
          Settings
        </button>
        <div className="slide-strip">
          {slides.map((slide, index) => (
            <button
              className={`slide-thumb ${slide.id === activeSlideId ? "active" : ""}`}
              aria-label={`Slide ${index + 1}`}
              key={slide.id}
              onClick={() => setActiveSlideId(slide.id)}
              type="button"
            >
              <span>{index + 1}</span>
              {slide.mediaImage ? <img src={slide.mediaImage} alt="" /> : <i></i>}
            </button>
          ))}
        </div>
        {editorView !== "add-slide" && (
          <button className="add-slide-label" onClick={addSlide} type="button">
            Add slide
            <SvgIcon name="arrowRight" />
          </button>
        )}
        <button className="add-slide-button" aria-label="Add slide" onClick={addSlide} type="button">
          <SvgIcon name="plus" />
        </button>
      </footer>
      {showMediaModal && (
        <MediaPickerModal
          onCancel={() => setShowMediaModal(false)}
          onPaint={() => {
            setShowMediaModal(false);
            setShowPaint(true);
          }}
          onUpload={() => {
            setShowMediaModal(false);
            uploadInputRef.current?.click();
          }}
        />
      )}
      <input
        accept="image/*"
        className="visually-hidden-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = () => {
            updateActiveSlide({ mediaImage: reader.result, mediaKind: "upload" });
          };
          reader.readAsDataURL(file);
          event.target.value = "";
        }}
        ref={uploadInputRef}
        type="file"
      />
      {showPaint && (
        <PaintWorkspace
          initialImage={activeSlide?.mediaImage}
          onCancel={() => setShowPaint(false)}
          onDone={(image) => {
            updateActiveSlide({ mediaImage: image, mediaKind: "paint" });
            setShowPaint(false);
          }}
        />
      )}
      {showPreview && (
        <PreviewOverlay
          initialSlideIndex={activeSlideIndex}
          onClose={() => setShowPreview(false)}
          slides={slides}
        />
      )}
      </div>
      </SlideDataContext.Provider>
      </SlideActionsContext.Provider>
    </EditorMediaContext.Provider>
  );
}

function MediaPickerModal({ onCancel, onPaint, onUpload }) {
  const options = [
    ["ai", "AI", "You need to add a question first", true],
    ["paint", "Paint", "Illustrate your question"],
    ["upload", "Upload", "Add your own image"],
    ["unsplash", "Unsplash", "Stock photos"],
    ["giphy", "GIPHY", "Short animations"],
    ["youtube", "Youtube", "Videos and music"],
    ["street", "Street View", "Interactive panoramas"],
  ];

  return (
    <div className="media-modal-backdrop" role="presentation">
      <div className="media-modal" role="dialog" aria-modal="true" aria-label="Add media">
        <div className="media-option-list">
          {options.map(([icon, title, description, disabled]) => (
            <button
              className={`media-option ${disabled ? "disabled" : ""}`}
              key={title}
              onClick={icon === "paint" ? onPaint : icon === "upload" ? onUpload : undefined}
              type="button"
            >
              <span className="media-option-copy">
                <strong>
                  {title}
                  {icon === "ai" && <SvgIcon name="zap" />}
                  {icon === "street" && <SvgIcon name="zap" />}
                </strong>
                <span>{description}</span>
              </span>
              <MediaOptionIcon name={icon} />
            </button>
          ))}
        </div>
        <button className="media-cancel-button" onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
    </div>
  );
}

const paintColors = [
  "#181827",
  "#74266f",
  "#d34857",
  "#ff6e7d",
  "#fb824e",
  "#ffd06d",
  "#ffc58c",
  "#b78359",
  "#735131",
  "#9bef6a",
  "#35be6c",
  "#258996",
  "#274792",
  "#4169d8",
  "#41a9ea",
  "#64dce5",
  "#f8f8f6",
  "#9db8c8",
  "#57718e",
  "#2b3e64",
];

function PaintWorkspace({ initialImage, onCancel, onDone }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const [color, setColor] = useState("#181827");
  const [brushSize, setBrushSize] = useState(14);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    function saveInitialHistory() {
      setHistory([canvas.toDataURL()]);
      setHistoryIndex(0);
    }

    if (initialImage) {
      const image = new Image();
      image.onload = () => {
        context.fillStyle = "#f7f7f7";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        saveInitialHistory();
      };
      image.src = initialImage;
      return;
    }

    context.fillStyle = "#f7f7f7";
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveInitialHistory();
  }, [initialImage]);

  function getCanvasPoint(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function drawLine(from, to) {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = brushSize;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    context.beginPath();
    context.arc(to.x, to.y, brushSize / 2, 0, Math.PI * 2);
    context.fill();
  }

  function startDrawing(event) {
    event.preventDefault();
    const point = getCanvasPoint(event);
    isDrawingRef.current = true;
    lastPointRef.current = point;
    drawLine(point, point);
  }

  function draw(event) {
    if (!isDrawingRef.current) return;
    event.preventDefault();
    const nextPoint = getCanvasPoint(event);
    drawLine(lastPointRef.current, nextPoint);
    lastPointRef.current = nextPoint;
  }

  function saveHistory() {
    const canvas = canvasRef.current;
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(canvas.toDataURL());
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  }

  function stopDrawing() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    saveHistory();
  }

  function restoreSnapshot(index) {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
    };
    image.src = history[index];
  }

  function undo() {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    restoreSnapshot(nextIndex);
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    restoreSnapshot(nextIndex);
  }

  return (
    <div className="paint-workspace">
      <aside className="paint-tools">
        <div className="paint-panel color-panel">
          {paintColors.map((paintColor) => (
            <button
              aria-label={`Color ${paintColor}`}
              className={`color-swatch ${paintColor === color ? "active" : ""}`}
              key={paintColor}
              onClick={() => setColor(paintColor)}
              style={{ backgroundColor: paintColor }}
              type="button"
            ></button>
          ))}
        </div>

        <div className="paint-panel brush-panel">
          {[5, 14, 30].map((size) => (
            <button
              aria-label={`Brush size ${size}`}
              className={`brush-size ${brushSize === size ? "active" : ""}`}
              key={size}
              onClick={() => setBrushSize(size)}
              type="button"
            >
              <span style={{ width: size, height: size }}></span>
            </button>
          ))}
          <button aria-label="Eraser" className="eraser-button" onClick={() => setColor("#f7f7f7")} type="button">
            <span></span>
            <i></i>
          </button>
        </div>

        <div className="paint-panel history-panel">
          <button aria-label="Undo" disabled={historyIndex <= 0} onClick={undo} type="button">
            <SvgIcon name="undo" />
          </button>
          <button aria-label="Redo" disabled={historyIndex >= history.length - 1} onClick={redo} type="button">
            <SvgIcon name="redo" />
          </button>
        </div>
      </aside>

      <main className="paint-canvas-area">
        <canvas
          height="798"
          onPointerCancel={stopDrawing}
          onPointerDown={startDrawing}
          onPointerLeave={stopDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          ref={canvasRef}
          width="1064"
        ></canvas>
        <div className="paint-footer">
          <div className="paint-background-actions">
            <button type="button">Add background image</button>
            <button type="button">Set background color</button>
          </div>
          <div className="paint-final-actions">
            <button className="paint-cancel" onClick={onCancel} type="button">
              Cancel
            </button>
            <button className="paint-done" onClick={() => onDone(canvasRef.current.toDataURL("image/png"))} type="button">
              Done
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function PreviewOverlay({ initialSlideIndex, onClose, slides }) {
  const [previewIndex, setPreviewIndex] = useState(initialSlideIndex);
  const [transitionDirection, setTransitionDirection] = useState("next");
  const [isPlaying, setIsPlaying] = useState(false);
  const playableSlides = slides.length ? slides : [createEditorSlide(1)];
  const currentSlide = playableSlides[previewIndex] ?? playableSlides[0];
  const view = currentSlide.type;
  const mediaImage = currentSlide.mediaImage;

  useEffect(() => {
    if (!isPlaying) return undefined;

    const timer = setInterval(() => {
      setTransitionDirection("next");
      setPreviewIndex((currentIndex) => (currentIndex + 1) % playableSlides.length);
    }, 2200);

    return () => clearInterval(timer);
  }, [isPlaying, playableSlides.length]);

  function goToNextSlide() {
    setTransitionDirection("next");
    setPreviewIndex((currentIndex) => (currentIndex + 1) % playableSlides.length);
  }

  function goToPreviousSlide() {
    setTransitionDirection("previous");
    setPreviewIndex((currentIndex) => (currentIndex - 1 + playableSlides.length) % playableSlides.length);
  }

  return (
    <div className="preview-backdrop">
      <section className="preview-shell" aria-label="Quiz preview">
        <header className="preview-topbar">
          <div className="brand preview-logo" aria-label="Quiz.com">
            <span className="logo-q">Q</span>
            <span className="logo-u">u</span>
            <span className="logo-i">i</span>
            <span className="logo-z">z</span>
            <span className="logo-dot">.</span>
            <span className="logo-com">com</span>
          </div>
          <div className="preview-players">
            <SvgIcon name="user" />
            <span>0 (1)</span>
          </div>
          <div className="preview-controls">
            <strong>Slide {previewIndex + 1}/{playableSlides.length}</strong>
            <button aria-label="Previous slide" onClick={goToPreviousSlide} type="button">
              <SvgIcon name="rewind" />
            </button>
            <button aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"} onClick={() => setIsPlaying(!isPlaying)} type="button">
              <SvgIcon name={isPlaying ? "pause" : "play"} />
            </button>
            <button aria-label="Next slide" onClick={goToNextSlide} type="button">
              <SvgIcon name="fastForward" />
            </button>
            <button aria-label="Preview settings" type="button">
              <SvgIcon name="gear" />
            </button>
            <button aria-label="Fullscreen preview" type="button">
              <SvgIcon name="fullscreen" />
            </button>
          </div>
        </header>

        <main
          className={`preview-stage preview-${view} preview-${transitionDirection}`}
          key={currentSlide.id}
        >
          <div className="preview-question-panel">
            <PreviewQuestion slide={currentSlide} view={view} />
          </div>
          <PreviewMedia image={mediaImage} view={view} />
          <button className="close-preview-button" onClick={onClose} type="button">
            Close preview
          </button>
        </main>
      </section>
    </div>
  );
}

function PreviewQuestion({ slide, view }) {
  const fallbackQuestion =
    "Nha nuoc do giai cap thong tri lap nen de bao ve quyen va loi ich cua giai cap minh la quan diem cua hoc thuyet";
  const title =
    view === "info"
      ? slide.text || "Nha nuoc do giai cap thong tri lap nen de bao ve quyen va loi ich cua giai cap minh"
      : slide.question || fallbackQuestion;

  if (view === "info") {
    return <h1 className="preview-info-text">{title}</h1>;
  }

  if (view === "range") {
    return (
      <>
        <h1>{title}</h1>
        <div className="preview-range-answer">
          <span>{slide.rangeMin || "0"}</span>
          <div>
            <i></i>
          </div>
          <span>{slide.rangeMax || "50"}</span>
        </div>
        <button className="preview-submit range-submit" type="button">
          Submit answer
        </button>
        <PreviewTimer />
      </>
    );
  }

  if (view === "type") {
    return (
      <>
        <h1>{title}</h1>
        <input className="preview-type-input" placeholder="Type your answer" />
        <button className="preview-submit" type="button">
          Submit answer
        </button>
        <PreviewTimer />
      </>
    );
  }

  if (view === "pinpoint") {
    return (
      <>
        <h1>{title}</h1>
        <button className="preview-submit pinpoint-submit" type="button">
          Pin the answer
        </button>
        <PreviewTimer />
      </>
    );
  }

  const buttonAnswers = [slide.correctAnswer, ...slide.falseAnswers].map((answer, index) => answer || `test${index + 1}`);
  const checkboxAnswers = slide.checkboxAnswers.map((answer, index) => answer || `test${index + 1}`);
  const reorderAnswers = slide.reorderItems.map((answer, index) => answer || `test${index + 1}`);
  const labels = view === "reorder" ? reorderAnswers : view === "checkboxes" ? checkboxAnswers : buttonAnswers;
  const inputType = view === "checkboxes" ? "checkbox" : view === "buttons" ? "radio" : null;

  return (
    <>
      <h1>{title}</h1>
      <div className={`preview-answer-list ${view === "reorder" ? "reorder-preview-list" : ""}`}>
        {labels.map((label, index) => (
          <label className="preview-answer" key={`${view}-${index}`}>
            {inputType ? <input name="preview-answer" type={inputType} /> : <span>{index + 1}.</span>}
            <b>{label}</b>
          </label>
        ))}
      </div>
      <button className={`preview-submit ${view === "checkboxes" ? "checkbox-submit" : ""}`} type="button">
        {view === "checkboxes" ? "Select one or more" : view === "reorder" ? "Submit order" : "Submit answer"}
      </button>
      <PreviewTimer />
    </>
  );
}

function PreviewMedia({ image, view }) {
  if (view === "info") return null;

  return (
    <div className={`preview-media ${view === "pinpoint" ? "pinpoint-media" : ""}`}>
      {image ? <img src={image} alt="Preview media" /> : <span>Add media</span>}
      {view === "pinpoint" && image && <i className="preview-pin"></i>}
    </div>
  );
}

function PreviewTimer() {
  return (
    <div className="preview-timer">
      <i></i>
      <strong>515</strong>
    </div>
  );
}

function QuestionEditor({ view }) {
  if (view === "checkboxes") return <CheckboxesEditor />;
  if (view === "reorder") return <ReorderEditor />;
  if (view === "range") return <RangeEditor />;
  if (view === "pinpoint") return <PinpointEditor />;
  if (view === "type") return <TypeAnswerEditor />;
  if (view === "info") return <InfoSlideEditor />;
  return <ButtonsEditor />;
}

function SlideActions() {
  const actions = useContext(SlideActionsContext);

  return (
    <div className="slide-actions-panel">
      <button className="slide-action duplicate-action" onClick={actions?.duplicateSlide} type="button">
        <SvgIcon name="duplicate" />
        Duplicate slide
      </button>
      <button className="slide-action delete-action" onClick={actions?.deleteSlide} type="button">
        <SvgIcon name="trash" />
        Delete slide
      </button>
    </div>
  );
}

function MediaEditor() {
  const media = useContext(EditorMediaContext);

  if (media?.paintImage) {
    const isUpload = media.mediaKind === "upload";

    return (
      <section className={`media-editor has-media ${isUpload ? "uploaded-media" : ""}`} aria-label="Media preview">
        <div className="media-preview-card">
          <div className="media-preview-actions">
            <button className="media-delete-button" aria-label="Delete media" onClick={media.clearPaintImage} type="button">
              <SvgIcon name="trash" />
            </button>
            {isUpload ? (
              <>
                <button className="media-zoom-button" aria-label="Zoom out" type="button">
                  <SvgIcon name="zoomOut" />
                </button>
                <button className="media-zoom-button" aria-label="Zoom in" type="button">
                  <SvgIcon name="zoomIn" />
                </button>
              </>
            ) : (
              <button className="media-edit-button" onClick={media.editPaint} type="button">
                Edit
              </button>
            )}
            <button className="media-replace-button" onClick={media.replacePaint} type="button">
              Replace
            </button>
          </div>
          <img src={media.paintImage} alt={isUpload ? "Uploaded media" : "Paint drawing"} />
          <div className="media-preview-footer">
            <button className="timelapse-button" type="button">
              <span>{isUpload ? "No reveal-effect" : "Time-lapse (paint)"}</span>
              <SvgIcon name="chevronDown" />
            </button>
            <button className="play-timelapse-button" aria-label="Play time-lapse" type="button">
              <SvgIcon name="play" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="media-editor" aria-label="Media">
      <div className="media-actions">
        <button className="add-media-button" type="button">
          Add media
        </button>
        <button className="media-ai-button" type="button">
          <SvgIcon name="zap" />
          Generate with AI
        </button>
      </div>
    </section>
  );
}

function ButtonsEditor() {
  return (
    <main className="buttons-editor">
      <MediaEditor />

      <section className="question-editor" aria-label="Question editor">
        <FieldGroup accent="cyan" label="Question" multiline />
        <FieldGroup accent="green" label="Correct answer" />
        <FieldGroup
          accent="pink"
          label="False answers"
          placeholders={["Required", "Optional", "Optional"]}
        />
        <FunFactPanel />
        <SlideActions />
      </section>
    </main>
  );
}

function CheckboxesEditor() {
  return (
    <main className="buttons-editor">
      <MediaEditor />

      <section className="question-editor checkbox-question-editor" aria-label="Checkbox question editor">
        <FieldGroup accent="cyan" label="Question" multiline />
        <div className="checkbox-answers-panel">
          <FieldHeader label="Select the correct answer(s)" />
          <CheckboxAnswerRow checked index={0} placeholder="Required" />
          <CheckboxAnswerRow index={1} placeholder="Optional" />
          <CheckboxAnswerRow index={2} placeholder="Optional" />
          <CheckboxAnswerRow index={3} placeholder="Optional" />
        </div>
        <FunFactPanel />
        <SlideActions />
      </section>
    </main>
  );
}

function ReorderEditor() {
  return (
    <main className="buttons-editor">
      <MediaEditor />

      <section className="question-editor reorder-question-editor" aria-label="Reorder question editor">
        <FieldGroup accent="cyan" label="Question" multiline />
        <div className="reorder-items-panel">
          <FieldHeader label="Items in correct order" />
          <ReorderAnswerRow number={1} placeholder="Required" />
          <ReorderAnswerRow number={2} placeholder="Required" />
          <ReorderAnswerRow number={3} placeholder="Optional" />
          <ReorderAnswerRow number={4} placeholder="Optional" />
        </div>
        <FunFactPanel />
        <SlideActions />
      </section>
    </main>
  );
}

function ReorderAnswerRow({ number, placeholder }) {
  const slideData = useContext(SlideDataContext);
  const value = slideData?.slide?.reorderItems?.[number - 1] ?? "";

  return (
    <div className="reorder-answer-row">
      <span>{number}.</span>
      <input
        aria-label={`Item ${number}`}
        onChange={(event) => updateSlideArray(slideData, "reorderItems", number - 1, event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

function RangeEditor() {
  const slideData = useContext(SlideDataContext);
  const slide = slideData?.slide ?? createEditorSlide(0);

  return (
    <main className="buttons-editor">
      <MediaEditor />

      <section className="question-editor range-question-editor" aria-label="Range question editor">
        <FieldGroup accent="cyan" label="Question" multiline />
        <div className="correct-value-panel">
          <FieldHeader label="Correct value" />
          <div className="correct-value-row">
            <input
              aria-label="Correct value"
              onChange={(event) => slideData?.updateSlide({ rangeCorrectValue: event.target.value })}
              placeholder="Required"
              value={slide.rangeCorrectValue}
            />
            <button type="button">Add unit</button>
          </div>
        </div>
        <div className="range-panel">
          <FieldHeader label="Range" />
          <div className="range-values">
            <label>
              <span>Min. value:</span>
              <input
                aria-label="Minimum value"
                onChange={(event) => slideData?.updateSlide({ rangeMin: event.target.value })}
                value={slide.rangeMin}
              />
            </label>
            <label>
              <span>Max. value:</span>
              <input
                aria-label="Maximum value"
                onChange={(event) => slideData?.updateSlide({ rangeMax: event.target.value })}
                value={slide.rangeMax}
              />
            </label>
          </div>
          <div className="range-scale" aria-hidden="true">
            {Array.from({ length: 50 }, (_, index) => (
              <i className={index < 9 ? "active" : ""} key={index}></i>
            ))}
          </div>
          <label className="exact-answer-toggle">
            <input type="checkbox" />
            <span>Require exact answer for points</span>
          </label>
        </div>
        <FunFactPanel />
        <SlideActions />
      </section>
    </main>
  );
}

function PinpointEditor() {
  return (
    <main className="buttons-editor">
      <MediaEditor />

      <section className="question-editor pinpoint-question-editor" aria-label="Pinpoint question editor">
        <div className="pinpoint-form-card">
          <FieldGroup accent="cyan" label="Question" multiline />
          <div className="pinpoint-answer-panel">
            <FieldHeader label="Correct answer" hideAi />
            <p>Add media before you can specify the correct answer.</p>
          </div>
          <FunFactPanel />
          <SlideActions />
        </div>

        <div className="pinpoint-settings">
          <SettingsRow label="Question voice: English (Charles)" />
          <SettingsRow label="Answer voice: English (Charles)" />
          <SettingsRow label="Question type: Pinpoint" />
          <SettingsRow label="Time: Normal time (20s)" />
        </div>
      </section>
    </main>
  );
}

function TypeAnswerEditor() {
  const slideData = useContext(SlideDataContext);
  const slide = slideData?.slide ?? createEditorSlide(0);

  return (
    <main className="buttons-editor">
      <MediaEditor />

      <section className="question-editor type-answer-question-editor" aria-label="Type answer question editor">
        <div className="type-answer-form-card">
          <FieldGroup accent="cyan" label="Question" multiline />
          <div className="type-answer-panel">
            <FieldHeader label="Answer" />
            <input
              aria-label="Answer"
              onChange={(event) => slideData?.updateSlide({ typeAnswer: event.target.value })}
              placeholder="Required"
              value={slide.typeAnswer}
            />
            <button type="button">Add other accepted answer</button>
          </div>
          <FunFactPanel />
          <SlideActions />
        </div>

        <div className="pinpoint-settings">
          <SettingsRow label="Question voice: English (Charles)" />
          <SettingsRow label="Answer voice: English (Charles)" />
          <SettingsRow label="Question type: Type answer" />
          <SettingsRow label="Time: Normal time (20s)" />
        </div>
      </section>
    </main>
  );
}

function InfoSlideEditor() {
  return (
    <main className="buttons-editor">
      <MediaEditor />

      <section className="question-editor info-slide-question-editor" aria-label="Info slide editor">
        <div className="info-text-card">
          <FieldGroup accent="cyan" label="Text" multiline />
        </div>

        <div className="pinpoint-settings info-settings">
          <SettingsRow label="Question voice: English (Charles)" />
          <SettingsRow label="Question type: Info slide" />
          <SettingsRow label="Time: Normal time (6s)" />
          <SlideActions />
        </div>
      </section>
    </main>
  );
}

function SettingsRow({ label }) {
  return (
    <button className="settings-row" type="button">
      <span>{label}</span>
      <SvgIcon name="chevronDown" />
    </button>
  );
}

function CheckboxAnswerRow({ checked = false, index, placeholder }) {
  const slideData = useContext(SlideDataContext);
  const value = slideData?.slide?.checkboxAnswers?.[index] ?? "";

  return (
    <div className="checkbox-answer-row">
      <button
        className={`answer-state ${checked ? "is-correct" : "is-false"}`}
        aria-label={checked ? "Correct answer" : "False answer"}
        type="button"
      >
        <SvgIcon name={checked ? "check" : "x"} />
      </button>
      <input
        aria-label={placeholder}
        onChange={(event) => updateSlideArray(slideData, "checkboxAnswers", index, event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

function FunFactPanel() {
  const slideData = useContext(SlideDataContext);
  const value = slideData?.slide?.funFact ?? "";

  return (
    <div className="fun-fact-panel">
      <FieldHeader label="Fun fact" />
      <input
        aria-label="Fun fact"
        onChange={(event) => slideData?.updateSlide({ funFact: event.target.value })}
        placeholder="Optional"
        value={value}
      />
      <button type="button">Add media to fun fact</button>
    </div>
  );
}

function FieldGroup({ accent, label, multiline = false, placeholders = ["Required"] }) {
  const slideData = useContext(SlideDataContext);
  const fieldName = label === "Text" ? "text" : label === "Question" ? "question" : null;
  const fieldValue = fieldName ? slideData?.slide?.[fieldName] ?? "" : undefined;

  function getInputProps(index) {
    if (label === "Correct answer") {
      return {
        onChange: (event) => slideData?.updateSlide({ correctAnswer: event.target.value }),
        value: slideData?.slide?.correctAnswer ?? "",
      };
    }

    if (label === "False answers") {
      return {
        onChange: (event) => updateSlideArray(slideData, "falseAnswers", index, event.target.value),
        value: slideData?.slide?.falseAnswers?.[index] ?? "",
      };
    }

    return {};
  }

  return (
    <div className={`field-group ${accent}`}>
      <FieldHeader label={label} />
      {placeholders.map((placeholder, index) =>
        multiline ? (
          <textarea
            aria-label={label}
            key={placeholder}
            onChange={(event) => {
              if (fieldName) slideData?.updateSlide({ [fieldName]: event.target.value });
            }}
            placeholder={placeholder}
            value={fieldValue}
          />
        ) : (
          <input
            aria-label={`${label} ${index + 1}`}
            key={`${placeholder}-${index}`}
            placeholder={placeholder}
            {...getInputProps(index)}
          />
        ),
      )}
    </div>
  );
}

function FieldHeader({ label, hideAi = false }) {
  return (
    <div className="field-header">
      <span>{label}</span>
      {!hideAi && (
        <button type="button">
          <SvgIcon name="zap" />
          Generate with AI
        </button>
      )}
    </div>
  );
}

function Header() {
  return (
    <header className="home-header">
      <div className="brand" aria-label="Quiz.com">
        <span className="logo-q">Q</span>
        <span className="logo-u">u</span>
        <span className="logo-i">i</span>
        <span className="logo-z">z</span>
        <span className="logo-dot">.</span>
        <span className="logo-com">com</span>
      </div>

      <div className="header-actions">
        <button className="icon-button" aria-label="Search" type="button">
          <SvgIcon name="search" />
        </button>
        <button className="profile-button" aria-label="Profile" type="button">
          <SvgIcon name="user" />
        </button>
      </div>
    </header>
  );
}

function CategoryNav() {
  return (
    <nav className="category-nav" aria-label="Categories">
      {categories.map(([icon, label], index) => (
        <button
          className={`category-item ${index === 0 ? "active" : ""}`}
          key={label}
          type="button"
        >
          <SvgIcon name={icon} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function QuizIllustration({ variant }) {
  const isAi = variant === "ai";

  return (
    <svg
      className={`quiz-illustration ${isAi ? "ai-illustration" : ""}`}
      viewBox="0 0 310 220"
      role="img"
      aria-label={isAi ? "Student using AI" : "Student writing a quiz"}
    >
      <g className="sparkles">
        <path d="M37 68v15M29 75h16" />
        <path d="M198 22v11M192 28h12" />
        <path d="M232 95v17M223 103h19" />
        <path d="M67 39c-6-19 18-28 17-3" />
        <circle cx="35" cy="38" r="2" />
        <circle cx="235" cy="54" r="2" />
      </g>
      <g className="person-lines">
        {isAi && <path d="M38 207c0-42 0-78-15-93-14-13-27 4-19 26 7 20 16 39 16 67" />}
        <path d="M103 43c24 16 40 19 57 11 12-6 10 9 1 17" />
        <path d="M89 39c-25 5-37 25-33 54" />
        <path d="M69 78c10-4 23 1 32 12 7-10 8-19 2-29" />
        <path d="M104 86c16 13 34 13 49 1" />
        <circle cx="87" cy="103" r="13" />
        <path d="M78 122c-25 8-39 27-47 58" />
        <path d="M135 122c19 6 30 20 36 49" />
        <path d="M63 169c29 14 60 16 92 5" />
        <path d="M111 132c9 13 19 13 29 0" />
      </g>
      <g className="face-lines">
        <path d="M95 87v16" />
        <path d="M125 87v16" />
        <path d="M99 121c10 11 23 9 30-3" />
      </g>
      {isAi ? (
        <g className="action-lines">
          <path d="M140 168c15 3 27-1 35-11" />
          <path d="M170 151c11-17 20-22 22-16 2 5-3 15-12 24" />
          <path d="M179 159c19-18 29-19 30-12 1 6-12 17-26 25" />
          <path d="M148 171c13 13 30 20 50 15" />
          <path d="M87 177c21 1 38 11 48 29" />
        </g>
      ) : (
        <g className="action-lines">
          <path d="M43 194l92 24 101-25-91-24z" />
          <path d="M72 184c27 14 57 19 88 16" />
          <path d="M97 173c12 8 23 17 33 29" />
          <path d="M143 164c7 4 11 13 9 23" />
          <path d="M200 161v19" />
          <path d="M225 158l30-28" />
          <path d="M219 184l39-15" />
          <path d="M206 195l32-7" />
        </g>
      )}
    </svg>
  );
}

function TopBar({ pin, slide }) {
  return (
    <div className="topbar">
      <div className="brand small-logo">
        <span className="logo-q">Q</span>
        <span className="logo-u">u</span>
        <span className="logo-i">i</span>
        <span className="logo-z">z</span>
        <span className="logo-dot">.</span>
        <span className="logo-com">com</span>
      </div>
      <b>PIN {pin}</b>
      <b>Test</b>
      <div className="top-right">
        <b>Slide {slide}</b>
        <span>Pause</span>
        <span>Settings</span>
        <span>Full</span>
      </div>
    </div>
  );
}

function SvgIcon({ name }) {
  const icons = {
    eye: (
      <>
        <path d="M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    zap: <path d="m13 2-8 12h7l-1 8 8-12h-7Z" />,
    check: <path d="m5 12 5 5 9-11" />,
    x: (
      <>
        <path d="M6 6 18 18" />
        <path d="M18 6 6 18" />
      </>
    ),
    chevronDown: <path d="m6 9 6 6 6-6" />,
    duplicate: (
      <>
        <rect x="8" y="8" width="9" height="9" rx="2" />
        <path d="M6 14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
        <path d="M12.5 10.5v4M10.5 12.5h4" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M6 7l1 14h10l1-14" />
        <path d="M9 7V4h6v3" />
      </>
    ),
    undo: (
      <>
        <path d="M9 7H4v5" />
        <path d="M4 12c2-4 6-6 10-4 5 2 6 9 1 12-3 2-7 1-9-2" />
      </>
    ),
    redo: (
      <>
        <path d="M15 7h5v5" />
        <path d="M20 12c-2-4-6-6-10-4-5 2-6 9-1 12 3 2 7 1 9-2" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7Z" />,
    zoomOut: (
      <>
        <circle cx="10" cy="10" r="5.5" />
        <path d="M14.5 14.5 20 20" />
        <path d="M7.5 10h5" />
      </>
    ),
    zoomIn: (
      <>
        <circle cx="10" cy="10" r="5.5" />
        <path d="M14.5 14.5 20 20" />
        <path d="M7.5 10h5" />
        <path d="M10 7.5v5" />
      </>
    ),
    pause: (
      <>
        <path d="M9 7v10" />
        <path d="M15 7v10" />
      </>
    ),
    fastForward: (
      <>
        <path d="m5 7 7 5-7 5Z" />
        <path d="m12 7 7 5-7 5Z" />
      </>
    ),
    rewind: (
      <>
        <path d="m19 7-7 5 7 5Z" />
        <path d="m12 7-7 5 7 5Z" />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      </>
    ),
    fullscreen: (
      <>
        <path d="M8 4H4v4" />
        <path d="M16 4h4v4" />
        <path d="M20 16v4h-4" />
        <path d="M4 16v4h4" />
      </>
    ),
    search: (
      <>
        <circle cx="10" cy="10" r="5.5" />
        <path d="M14.5 14.5 20 20" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4.2" />
        <path d="M4.5 21c1-5 4-7.5 7.5-7.5s6.5 2.5 7.5 7.5" />
      </>
    ),
    home: (
      <>
        <path d="M3 11 12 3l9 8" />
        <path d="M5.5 10v10h5v-6h3v6h5V10" />
      </>
    ),
    palette: (
      <>
        <path d="M12 3C6.8 3 3 6.7 3 11.2 3 15 6 18 9.5 18h1.8c1.5 0 2 .9 2 1.8 0 .8.5 1.2 1.5 1.2 3.7 0 6.2-3.4 6.2-8C21 7.6 17.1 3 12 3Z" />
        <circle cx="8" cy="10" r="1" />
        <circle cx="11" cy="7.5" r="1" />
        <circle cx="15" cy="8.5" r="1" />
      </>
    ),
    star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />,
    globe: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M4 10h16M6 16h12M12 3.5c3 3.3 3 13.7 0 17M12 3.5c-3 3.3-3 13.7 0 17" />
      </>
    ),
    history: (
      <>
        <path d="M4 20h16M5 17h14M6 9h12M7 9v8M11 9v8M15 9v8M4 8l8-4 8 4Z" />
      </>
    ),
    chat: <path d="M5 17c-1.3-1.4-2-3.1-2-5 0-4.4 4-8 9-8s9 3.6 9 8-4 8-9 8c-1.1 0-2.2-.2-3.2-.5L4 21Z" />,
    leaf: (
      <>
        <path d="M6 19c6 .2 12-4.6 12-13 0 0-8 0-11.5 4C3.5 13.3 4 17 6 19Z" />
        <path d="M6 19c3-5 7-7 12-13" />
      </>
    ),
    ball: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M5.5 7.5 16.5 18.5M18.5 7.5 7.5 18.5M4 12h16M12 4c-1.8 3.5-1.8 12.5 0 16" />
      </>
    ),
    trivia: (
      <>
        <path d="M8 6c.8-2 2.4-3 4.6-3 2.5 0 4.4 1.6 4.4 4 0 2.2-1.4 3.2-3.1 4.3-1.6 1-2.4 1.8-2.4 3.7" />
        <circle cx="11.5" cy="20" r="1" />
        <path d="M4 4 7 7M20 4l-3 3M20 17l-3-2" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function SlideTypeIcon({ name }) {
  const icons = {
    buttons: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect className="fill-lime" x="13" y="13" width="38" height="38" rx="9" />
      </svg>
    ),
    checkboxes: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect className="fill-paper" x="13" y="10" width="38" height="44" rx="7" />
        <path d="m22 32 8 8 14-19" />
      </svg>
    ),
    reorder: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect className="fill-coral" x="16" y="14" width="28" height="11" rx="5" />
        <rect className="fill-sun" x="22" y="26" width="28" height="11" rx="5" />
        <rect className="fill-lime" x="15" y="38" width="31" height="11" rx="5" />
      </svg>
    ),
    range: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path className="fill-sun" d="M15 13h34a7 7 0 0 1 7 7v20a7 7 0 0 1-7 7h-8l-8 8-8-8H15a7 7 0 0 1-7-7V20a7 7 0 0 1 7-7Z" />
        <path d="M31 22c1-4 11-4 11 3 0 7-9 5-9 13" />
        <path d="M33 43v1" />
      </svg>
    ),
    location: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className="fill-map" cx="32" cy="32" r="28" />
        <path className="fill-pink" d="M32 14c-10 0-16 7-16 16 0 12 16 29 16 29s16-17 16-29c0-9-6-16-16-16Z" />
      </svg>
    ),
    pinpoint: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect className="fill-glass" x="14" y="11" width="36" height="42" rx="3" />
        <path className="fill-pink" d="M32 20c-7 0-11 5-11 11 0 8 11 20 11 20s11-12 11-20c0-6-4-11-11-11Z" />
      </svg>
    ),
    type: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect className="fill-paper" x="8" y="15" width="48" height="34" rx="7" />
        <path d="M16 40 25 22l9 18M20 33h10M39 29c8-4 14 1 14 8v3M53 40c-5 3-15 2-15-4 0-7 11-5 15-4" />
      </svg>
    ),
    ai: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path className="fill-paper" d="m18 12 29 5-6 35-29-5Z" />
        <rect className="fill-pink" x="16" y="31" width="34" height="15" rx="2" />
        <path d="M21 42v-8h7c5 0 5 7 0 7h-3M33 42v-8h6c6 0 6 8 0 8h-6ZM47 34h-7M47 38h-7" />
      </svg>
    ),
    info: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect className="fill-mint" x="9" y="15" width="46" height="34" rx="5" />
        <circle cx="21" cy="27" r="4" />
        <path d="m12 47 15-12 10 7 7-5 10 10" />
      </svg>
    ),
  };

  return icons[name];
}

function MediaOptionIcon({ name }) {
  const icons = {
    ai: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect className="media-fill-green" x="12" y="12" width="40" height="40" rx="5" transform="rotate(7 32 32)" />
        <path d="M20 40 28 22l8 18M23 33h10M41 25v15" />
      </svg>
    ),
    paint: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path className="media-fill-paper" d="M31 10c-13 0-22 8-22 19 0 12 10 22 23 22 4 0 5-5 2-7-3-3-1-8 4-8h5c8 0 12-5 12-11 0-9-10-15-24-15Z" />
        <circle className="media-fill-pink" cx="21" cy="29" r="4" />
        <circle className="media-fill-sun" cx="32" cy="37" r="4" />
        <circle className="media-fill-cyan" cx="43" cy="31" r="4" />
        <path className="media-fill-pink" d="M53 10c5 5 5 9 0 13-5-4-5-8 0-13Z" />
        <path d="M53 23v20" />
      </svg>
    ),
    upload: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect className="media-fill-cyan" x="11" y="13" width="42" height="32" rx="4" transform="rotate(7 32 29)" />
        <circle className="media-fill-paper" cx="22" cy="23" r="4" />
        <path className="media-fill-pink" d="M44 35 56 48h-8v9h-8v-9h-8Z" />
      </svg>
    ),
    unsplash: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect className="media-fill-cyan" x="10" y="22" width="28" height="22" rx="3" transform="rotate(-10 24 33)" />
        <rect className="media-fill-cyan" x="25" y="15" width="32" height="28" rx="4" transform="rotate(12 41 29)" />
        <circle className="media-fill-paper" cx="33" cy="24" r="3" />
      </svg>
    ),
    giphy: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect className="media-fill-sun" x="10" y="15" width="44" height="34" rx="5" transform="rotate(7 32 32)" />
        <path d="M19 35c2-9 16-12 23-4M21 28h22M20 40h21" />
      </svg>
    ),
    youtube: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect className="media-fill-coral" x="10" y="15" width="44" height="34" rx="9" transform="rotate(7 32 32)" />
        <path className="media-fill-paper" d="m28 24 14 8-14 8Z" />
      </svg>
    ),
    street: (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect className="media-fill-cyan" x="10" y="15" width="44" height="34" rx="5" transform="rotate(7 32 32)" />
        <path className="media-fill-paper" d="M32 18a5 5 0 1 1 0 10 5 5 0 0 1 0-10ZM25 45l3-15h8l3 15M18 35l10-5M46 35l-10-5" />
      </svg>
    ),
  };

  return <span className="media-option-icon">{icons[name]}</span>;
}
