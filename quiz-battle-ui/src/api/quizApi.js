const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export function buildQuizPayload(slides) {
  const savedAt = new Date().toISOString();
  const preparedSlides = slides
    .filter((slide) => slide.type !== "add-slide")
    .map((slide, index) => ({
      answers: {
        checkbox: slide.checkboxAnswers,
        correct: slide.correctAnswer,
        false: slide.falseAnswers,
        reorder: slide.reorderItems,
        type: slide.typeAnswer,
      },
      funFact: slide.funFact,
      id: slide.id,
      media: {
        image: slide.mediaImage,
        kind: slide.mediaKind,
      },
      order: index + 1,
      question: slide.question,
      range: {
        correctValue: slide.rangeCorrectValue,
        max: slide.rangeMax,
        min: slide.rangeMin,
      },
      text: slide.text,
      type: slide.type,
    }));

  return {
    savedAt,
    slideCount: preparedSlides.length,
    slides: preparedSlides,
    source: "quiz-battle-ui",
    title: `Quiz ${new Date(savedAt).toLocaleString()}`,
  };
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || "Khong ket noi duoc API");
  }

  return data;
}

export function saveQuizToApi(slides) {
  return requestJson("/api/quizzes", {
    body: JSON.stringify(buildQuizPayload(slides)),
    method: "POST",
  });
}

export function getQuizzes() {
  return requestJson("/api/quizzes");
}

export function getQuizById(id) {
  return requestJson(`/api/quizzes/${id}`);
}
