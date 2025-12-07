import { XMLParser } from "fast-xml-parser";


export function SummaryToCleanText(text) {
    if (!text || typeof text !== "string") return "";

    text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");

    // Headings
    text = text
        .replace(/^###\s*(.*)$/gm, "<h3>$1</h3>")
        .replace(/^##\s*(.*)$/gm, "<h2>$1</h2>")
        .replace(/^#\s*(.*)$/gm, "<h1>$1</h1>");

    // Bold / Italic
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Bullet points "* "
    text = text.replace(/^\s*\*\s+(.*)$/gm, "<li>$1</li>");

    // Convert numbered lists "1. "
    text = text.replace(/^\s*\d+\.\s+(.*)$/gm, "<li>$1</li>");

    // Wrap ALL <li> in a single <ul>
    text = text.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>");
    text = text.replace(/<\/ul>\s*<ul>/g, "");

    // Paragraphs
    text = text.replace(
        /^(?!<h\d>|<ul>|<li>|<\/ul>)(.+)$/gm,
        "<p>$1</p>"
    );

    text = text.replace(/<p>(\s*)<ul>/g, "<ul>");
    text = text.replace(/<\/ul>(\s*)<\/p>/g, "</ul>");

    return text.trim();
}



export function QuizFormatter(xml) {
    if (!xml || typeof xml !== "string") return [];

    const parser = new XMLParser({
        ignoreAttributes: false,
    });

    let data;
    try {
        data = parser.parse(xml);
    } catch (e) {
        console.error("XML Parse Error:", e.message);
        return [];
    }

    const quizList = data?.Quiz?.QuizQuestion;
    if (!quizList) return [];

    return quizList.map(q => ({
        question: q.question || "",
        options: [q.option1, q.option2, q.option3, q.option4].filter(Boolean),
        answer: Number(q.answer || 0),
        explanation: q.explanation || ""
    }));
}

