document.getElementById("opt-quiz").addEventListener("change", function () {
    const container = document.getElementById("quiz-count-container");
    container.style.display = this.checked ? "block" : "none";
});

// Simple client-side behavior: validate URL, collect options, POST to /api/summarize
const form = document.getElementById('summarize-form');
const ytUrlInput = document.getElementById('ytUrl');
const results = document.getElementById('results');
const submitBtn = document.getElementById('submitBtn');

function isYoutubeUrl(url) {
    try {
        const u = new URL(url);
        return /(^|\.)youtube\.com$/.test(u.hostname) || /(^|\.)youtu\.be$/.test(u.hostname);
    } catch (e) {
        return false;
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = ytUrlInput.value.trim();
    if (!url) { results.textContent = 'Please paste a YouTube URL.'; return; }
    if (!isYoutubeUrl(url)) { results.textContent = 'That does not look like a YouTube URL.'; return; }

    // collect outputs
    const outputs = Array.from(document.querySelectorAll('input[name="outputs"]:checked')).map(cb => cb.value);
    if (outputs.length === 0) { results.textContent = 'Select at least one output option.'; return; }
    // collect noOfQuestions if quizz is checked
    let noOfQuestions = null;

    // If quiz output is selected, read the quizCount dropdown
    if (outputs.includes("quiz")) {
        const countEl = document.getElementById("noOfQuestions");
        noOfQuestions = countEl ? countEl.value : null;
    }
    submitBtn.disabled = true; submitBtn.textContent = 'Working...';
    results.textContent = 'Sending request…';

    try {
        const resp = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, outputs, noOfQuestions })
        });

        if (!resp.ok) {
            const text = await resp.text();
            results.textContent = 'Server error: ' + (text || resp.status);
        } else {
            const data = await resp.json();
            // For now, backend returns a simple object; render it nicely
            renderResults(data);
        }
    } catch (err) {
        results.textContent = 'Network error: ' + err.message;
    } finally {
        submitBtn.disabled = false; submitBtn.textContent = 'Summarize';
    }
});


function QuizToHTML(quizList) {
    if (!Array.isArray(quizList) || quizList.length === 0) {
        return `<p class="muted">No quiz questions available.</p>`;
    }

    return `
<div class="quiz-container">
${quizList
            .map(
                (q, index) => `
    <div class="quiz-card">
        <h3 class="quiz-question">${index + 1}. ${q.question}</h3>

        <div class="quiz-options">
            ${q.options
                        .map(
                            (opt, i) => `
                <button class="quiz-option" data-is-correct="${q.answer === i + 1}" onclick="handleQuizClick(this)">
                    ${opt}
                </button>
            `
                        )
                        .join("")}
        </div>

        <div class="quiz-explanation">
            <strong>Explanation:</strong> ${q.explanation}
        </div>
    </div>
`
            )
            .join("")}
</div>
`;
}


function renderResults(data) {
    // Expected: { url, outputs: { summary: '...', detailed: '...', quiz: [...], flashcards: ... } }
    results.innerHTML = '';

    // Header
    const h = document.createElement('div');
    h.style.marginBottom = '8px';
    h.innerHTML = '<strong>Results for:</strong> ' + (data.url || '');
    results.appendChild(h);

    const outs = data.outputs || {};

    for (const key of Object.keys(outs)) {
        const section = document.createElement('section');
        section.style.marginBottom = '16px';

        const title = document.createElement('h3');
        title.style.margin = '0 0 6px';
        title.style.fontSize = '1rem';
        title.textContent = niceName(key);
        section.appendChild(title);

        const content = document.createElement('div');
        content.className = 'muted';

        // --- SPECIAL HANDLING FOR QUIZ ---
        if (key === "quiz") {
            try {
                content.innerHTML = QuizToHTML(outs[key]);
            } catch (e) {
                console.error("Quiz render failed:", e);
                content.textContent = "Failed to render quiz.";
            }
        }
        // --- NORMAL HTML OUTPUTS ---
        else if (typeof outs[key] === "string") {
            content.innerHTML = outs[key];
        }
        // --- FALLBACK FOR OTHER TYPES ---
        else {
            content.textContent = JSON.stringify(outs[key], null, 2);
        }

        section.appendChild(content);
        results.appendChild(section);
    }
}


function niceName(k) {
    return ({ detailed: 'Detailed notes', summary: 'Short summary', quiz: 'Quizzes', keypoints: 'Key takeaways', timestamps: 'Timestamps', flashcards: 'Flashcards' }[k] || k);
}

window.handleQuizClick = function (btn) {
    const parent = btn.closest(".quiz-card");
    const options = parent.querySelectorAll(".quiz-option");
    const explanation = parent.querySelector(".quiz-explanation");

    // Disable all buttons after answering:
    options.forEach(o => (o.disabled = true));

    const correct = btn.dataset.isCorrect === "true";

    if (correct) {
        btn.classList.add("correct");
    } else {
        btn.classList.add("wrong");
        // Highlight correct option
        options.forEach(o => {
            if (o.dataset.isCorrect === "true") {
                o.classList.add("correct");
            }
        });
    }

    explanation.style.display = "block";
};
