// 코드 보호
(function () {
	"use strict";

	// 우클릭 방지
	document.addEventListener("contextmenu", (e) => e.preventDefault());

	// F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+U 방지
	document.addEventListener("keydown", (e) => {
		if (
			e.keyCode === 123 ||
			(e.ctrlKey && e.shiftKey && e.keyCode === 73) ||
			(e.ctrlKey && e.shiftKey && e.keyCode === 67) ||
			(e.ctrlKey && e.keyCode === 85)
		) {
			e.preventDefault();
			return false;
		}
	});
})();

// 전역 변수
let words = [];
let testWords = [];
let currentTest = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let isTestActive = false;
let selectedChoice = null;
let wrongAnswersList = [];
let currentChoices = [];
let correctAnswer = "";
let timerInterval = null;
let timeLeft = 5;

// 페이지 로드 시 초기화
window.onload = function () {
	loadWords();
	updateWordCount();
	displayWords();
	setupFileUpload();
	initializeFormatTab();
	setupEventListeners();
	displayResults();
};

// 초기 포맷 탭 설정
function initializeFormatTab() {
	const examples = {
		excel: `Excel 파일 형식:
┌─────────┬────────────────┬────────┐
│  영어   │    한국어      │  품사  │
├─────────┼────────────────┼────────┤
│ run     │ 달리다; 운영하다│  동사  │
│ bank    │ 은행; 강둑     │  명사  │
│ light   │ 빛; 가벼운     │명/형   │
└─────────┴────────────────┴────────┘

- 첫 번째 열: 영어 단어
- 두 번째 열: 한국어 뜻 (여러 뜻은 세미콜론으로 구분)
- 세 번째 열: 품사 (선택사항)
- 첫 행은 헤더(선택사항)`,
	};

	document.getElementById("format-examples").textContent = examples.excel;
}

// 이벤트 리스너 설정
function setupEventListeners() {
	const koreanInput = document.getElementById("koreanMeaning");
	if (koreanInput) {
		koreanInput.addEventListener("keypress", function (e) {
			if (e.key === "Enter") {
				addWord();
			}
		});
	}
}

// 섹션 표시/숨김
function showSection(sectionName) {
	const sections = document.querySelectorAll(".section");
	sections.forEach((section) => section.classList.remove("active"));

	const navBtns = document.querySelectorAll(".nav-btn");
	navBtns.forEach((btn) => btn.classList.remove("active"));

	document.getElementById(sectionName).classList.add("active");
	event.target.classList.add("active");
}

function showSubSection(sectionName) {
	const subSections = document.querySelectorAll(".sub-section");
	subSections.forEach((section) => section.classList.remove("active"));

	const subNavBtns = document.querySelectorAll(".sub-nav-btn");
	subNavBtns.forEach((btn) => btn.classList.remove("active"));

	document.getElementById(sectionName).classList.add("active");
	event.target.classList.add("active");
}

// 단어 관리 함수들
function addWord() {
	const english = document.getElementById("englishWord").value.trim();
	const korean = document.getElementById("koreanMeaning").value.trim();
	const pos = document.getElementById("partOfSpeech").value.trim();

	if (!english || !korean) {
		alert("영어 단어와 한국어 뜻을 모두 입력해주세요.");
		return;
	}

	if (
		words.find((word) => word.english.toLowerCase() === english.toLowerCase())
	) {
		alert("이미 등록된 단어입니다.");
		return;
	}

	words.push({ english, korean, pos: pos || "" });
	saveWords();
	updateWordCount();
	displayWords();

	document.getElementById("englishWord").value = "";
	document.getElementById("koreanMeaning").value = "";
	document.getElementById("partOfSpeech").value = "";
	document.getElementById("englishWord").focus();
}

function deleteWord(index) {
	if (confirm("정말로 이 단어를 삭제하시겠습니까?")) {
		words.splice(index, 1);
		saveWords();
		updateWordCount();
		displayWords();
	}
}

function deleteAllWords() {
	if (words.length === 0) {
		alert("삭제할 단어가 없습니다.");
		return;
	}

	const confirmMessage = `정말로 모든 단어(${words.length}개)를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!`;

	if (confirm(confirmMessage)) {
		const doubleConfirm = confirm(
			"정말로 확실합니까? 모든 데이터가 영구히 삭제됩니다!"
		);

		if (doubleConfirm) {
			words = [];
			saveWords();
			updateWordCount();
			displayWords();
			localStorage.removeItem("testResults");
			displayResults();
			alert("모든 단어가 삭제되었습니다.");
		}
	}
}

function updateWordCount() {
	document.getElementById("wordCount").textContent = words.length;
}

function displayWords() {
	const wordList = document.getElementById("wordList");

	if (words.length === 0) {
		wordList.innerHTML =
			'<p style="text-align: center; color: #999;">등록된 단어가 없습니다.</p>';
		return;
	}

	wordList.innerHTML = words
		.map(
			(word, index) => `
        <div class="word-item">
            <div class="word-content">
                <div class="word-english">
                    ${word.english}
                    ${
											word.pos
												? `<span style="color: #999; font-size: 0.9em; margin-left: 8px;">[${word.pos}]</span>`
												: ""
										}
                </div>
                <div class="word-korean">${word.korean}</div>
            </div>
            <div class="word-buttons">
                <button class="edit-btn" onclick="editWord(${index})">수정</button>
                <button class="delete-btn" onclick="deleteWord(${index})">삭제</button>
            </div>
        </div>
    `
		)
		.join("");
}

function editWord(index) {
	const word = words[index];

	const newEnglish = prompt("영어 단어:", word.english);
	if (newEnglish === null) return; // 취소

	const newKorean = prompt("한국어 뜻:", word.korean);
	if (newKorean === null) return; // 취소

	const newPos = prompt("품사 (선택사항):", word.pos || "");
	if (newPos === null) return; // 취소

	// 입력값 검증
	if (!newEnglish.trim() || !newKorean.trim()) {
		alert("영어 단어와 한국어 뜻은 필수입니다.");
		return;
	}

	// 중복 체크 (자기 자신 제외)
	const duplicate = words.find(
		(w, i) =>
			i !== index && w.english.toLowerCase() === newEnglish.trim().toLowerCase()
	);

	if (duplicate) {
		alert("이미 등록된 단어입니다.");
		return;
	}

	// 수정
	words[index] = {
		english: newEnglish.trim(),
		korean: newKorean.trim(),
		pos: newPos.trim(),
	};

	saveWords();
	displayWords();
	alert("수정되었습니다.");
}

// 테스트 관련 함수들
function startTest() {
	if (words.length === 0) {
		alert("테스트할 단어가 없습니다. 먼저 단어를 추가해주세요.");
		return;
	}

	if (words.length < 4) {
		alert("4지선다 테스트를 위해 최소 4개의 단어가 필요합니다.");
		return;
	}

	const shuffled = [...words].sort(() => Math.random() - 0.5);
	testWords = shuffled.slice(0, Math.min(500, words.length));

	currentTest = 0;
	correctAnswers = 0;
	wrongAnswers = 0;
	wrongAnswersList = [];
	isTestActive = true;

	document.getElementById("testResultsSection").style.display = "none";

	updateTestUI();
	showNextQuestion();
}

function skipQuestion() {
	if (timerInterval) {
		clearInterval(timerInterval);
		timerInterval = null;
	}
	wrongAnswers++;
	currentTest++;
	updateTestUI();
	showNextQuestion();
}

function startTimer() {
	timeLeft = 5;
	updateTimerDisplay();

	if (timerInterval) {
		clearInterval(timerInterval);
	}

	timerInterval = setInterval(() => {
		timeLeft--;
		updateTimerDisplay();

		if (timeLeft <= 0) {
			clearInterval(timerInterval);
			timerInterval = null;
			handleTimeout();
		}
	}, 1000);
}

function updateTimerDisplay() {
	const timerElement = document.getElementById("timer");
	if (timerElement) {
		timerElement.textContent = timeLeft;
		timerElement.style.color = timeLeft <= 2 ? "#dc3545" : "#667eea";
	}
}

function handleTimeout() {
	if (selectedChoice !== null) return;

	wrongAnswers++;
	wrongAnswersList.push({
		word: testWords[currentTest],
		userAnswer: "(시간 초과)",
		correctAnswer: correctAnswer,
	});

	const choiceBtns = document.querySelectorAll(".choice-btn");
	choiceBtns.forEach((btn) => {
		btn.classList.add("disabled");
		if (btn.textContent === correctAnswer) {
			btn.classList.add("correct");
		}
	});

	const resultDiv = document.getElementById("testResult");
	resultDiv.innerHTML = `<div class="result incorrect">시간 초과! 정답: ${correctAnswer}</div>`;

	updateTestUI();

	setTimeout(() => {
		currentTest++;
		showNextQuestion();
	}, 1000);
}

function updateTestUI() {
	document.getElementById("currentNumber").textContent = currentTest + 1;
	document.getElementById("totalQuestions").textContent = testWords.length;
	document.getElementById("correctCount").textContent = correctAnswers;
	document.getElementById("wrongCount").textContent = wrongAnswers;
}

function endTest() {
	if (timerInterval) {
		clearInterval(timerInterval);
		timerInterval = null;
	}

	isTestActive = false;
	const accuracy =
		testWords.length > 0
			? Math.round((correctAnswers / (correctAnswers + wrongAnswers)) * 100)
			: 0;

	const testCard = document.getElementById("testCard");
	testCard.innerHTML = `
        <h3 style="color: #667eea; margin-bottom: 20px;">테스트 완료! 🎊</h3>
        <div style="font-size: 1.2rem; margin-bottom: 20px;">
            <p>정답: ${correctAnswers}개</p>
            <p>오답: ${wrongAnswers}개</p>
            <p>정답률: ${accuracy}%</p>
        </div>
        <button class="btn" onclick="startTest()">다시 테스트</button>
    `;

	if (wrongAnswersList.length > 0) {
		displayWrongAnswers();
	}

	saveTestResult(correctAnswers, wrongAnswers, accuracy);
}

function displayWrongAnswers() {
	const wrongAnswersDiv = document.getElementById("wrongAnswers");
	const testResultsSection = document.getElementById("testResultsSection");

	if (wrongAnswersList.length > 0) {
		wrongAnswersDiv.innerHTML = wrongAnswersList
			.map(
				(item) => `
            <div class="wrong-answer-item">
                <div class="wrong-answer-word">
                    ${item.word.english}
                    ${
											item.word.pos
												? `<span style="color: #999; font-size: 0.9em; margin-left: 8px;">[${item.word.pos}]</span>`
												: ""
										}
                </div>
                <div class="wrong-answer-details">
                    정답: ${item.correctAnswer}<br>
                    선택한 답: ${item.userAnswer}
                </div>
            </div>
        `
			)
			.join("");

		testResultsSection.style.display = "block";
	}
}

// 결과 관리 함수들
function saveTestResult(correct, wrong, accuracy) {
	const results = JSON.parse(localStorage.getItem("testResults") || "[]");
	results.push({
		date: new Date().toLocaleDateString("ko-KR"),
		time: new Date().toLocaleTimeString("ko-KR"),
		correct: correct,
		wrong: wrong,
		accuracy: accuracy,
		total: testWords.length,
	});
	localStorage.setItem("testResults", JSON.stringify(results));
	displayResults();
}

function displayResults() {
	const results = JSON.parse(localStorage.getItem("testResults") || "[]");
	const resultsDiv = document.getElementById("finalResults");

	if (results.length === 0) {
		resultsDiv.innerHTML =
			'<p style="text-align: center; color: #999;">아직 완료된 테스트가 없습니다.</p>';
		return;
	}

	resultsDiv.innerHTML = `
        <div class="score">
            <div class="score-item">
                <div class="score-number">${results.length}</div>
                <div class="score-label">총 테스트 횟수</div>
            </div>
            <div class="score-item">
                <div class="score-number">${Math.round(
									results.reduce((sum, r) => sum + r.accuracy, 0) /
										results.length
								)}%</div>
                <div class="score-label">평균 정답률</div>
            </div>
        </div>
        <div style="max-height: 400px; overflow-y: auto;">
            ${results
							.reverse()
							.map(
								(result) => `
                <div class="word-item">
                    <div class="word-content">
                        <div class="word-english">${result.date} ${result.time}</div>
                        <div class="word-korean">
                            정답: ${result.correct}개 | 오답: ${result.wrong}개 | 정답률: ${result.accuracy}%
                        </div>
                    </div>
                </div>
            `
							)
							.join("")}
        </div>
    `;
}

// 데이터 저장/로드 함수들
function saveWords() {
	localStorage.setItem("vocabularyWords", JSON.stringify(words));
}

function loadWords() {
	const saved = localStorage.getItem("vocabularyWords");
	if (saved) {
		words = JSON.parse(saved);
		words = words.map((word) => ({
			english: word.english,
			korean: word.korean,
			pos: word.pos || "",
		}));
	}
}

// 파일 처리 관련 함수들
function showFormat(format, event) {
	if (event) {
		const formatTabs = document.querySelectorAll(".format-tab");
		formatTabs.forEach((tab) => tab.classList.remove("active"));
		event.target.classList.add("active");
	}

	const examples = {
		excel: `Excel 파일 형식:
┌─────────┬────────────────┬────────┐
│  영어   │    한국어      │  품사  │
├─────────┼────────────────┼────────┤
│ run     │ 달리다; 운영하다│  동사  │
│ bank    │ 은행; 강둑     │  명사  │
│ light   │ 빛; 가벼운     │명/형   │
└─────────┴────────────────┴────────┘

- 첫 번째 열: 영어 단어
- 두 번째 열: 한국어 뜻 (여러 뜻은 세미콜론으로 구분)
- 세 번째 열: 품사 (선택사항)
- 첫 행은 헤더(선택사항)`,

		json: `JSON 파일 형식:
[
  {
    "english": "run",
    "korean": "달리다; 운영하다",
    "pos": "동사"
  },
  {
    "english": "bank", 
    "korean": "은행; 강둑",
    "pos": "명사"
  },
  {
    "english": "light",
    "korean": "빛; 가벼운",
    "pos": "명/형"
  }
]

- pos(품사)는 생략 가능`,

		csv: `CSV 파일 형식:
"run","달리다; 운영하다","동사"
"bank","은행; 강둑","명사"
"light","빛; 가벼운","명/형"

또는 품사 없이:
"run","달리다; 운영하다"
"bank","은행; 강둑"

- 따옴표로 감싸기 (쉼표 포함 가능)
- 여러 뜻은 세미콜론(;)으로 구분
- 품사는 선택사항`,

		txt: `TXT 파일 형식:
run|달리다; 운영하다|동사
bank|은행; 강둑|명사
light|빛; 가벼운|명/형

또는 품사 없이:
run|달리다; 운영하다
bank|은행; 강둑

- 파이프(|)로 구분
- 여러 뜻은 세미콜론(;)으로 구분
- 품사는 선택사항`,
	};

	document.getElementById("format-examples").textContent = examples[format];
}

function setupFileUpload() {
	const fileInput = document.getElementById("fileInput");

	fileInput.addEventListener("change", async function (event) {
		const files = event.target.files;
		if (files.length === 0) return;

		if (files.length === 1) {
			document.getElementById("fileName").textContent = files[0].name;
		} else {
			document.getElementById(
				"fileName"
			).textContent = `${files.length}개 파일 처리 중...`;
		}

		let totalAdded = 0;
		let totalDuplicate = 0;

		for (let i = 0; i < files.length; i++) {
			const result = await processFileAsync(files[i]);
			totalAdded += result.added;
			totalDuplicate += result.duplicate;
		}

		let message = `${totalAdded}개의 단어가 추가되었습니다.`;
		if (totalDuplicate > 0) {
			message += `\n${totalDuplicate}개의 중복 단어는 제외되었습니다.`;
		}
		alert(message);

		if (files.length > 1) {
			document.getElementById(
				"fileName"
			).textContent = `${files.length}개 파일 처리 완료`;
		}

		fileInput.value = "";
	});
}

function processFileAsync(file) {
	return new Promise((resolve, reject) => {
		const extension = file.name.split(".").pop().toLowerCase();
		const reader = new FileReader();

		switch (extension) {
			case "xlsx":
			case "xls":
				reader.onload = function (e) {
					const result = processExcelFile(e.target.result);
					resolve(result);
				};
				reader.onerror = reject;
				reader.readAsArrayBuffer(file);
				break;

			case "json":
				reader.onload = function (e) {
					const result = processJsonFile(e.target.result);
					resolve(result);
				};
				reader.onerror = reject;
				reader.readAsText(file);
				break;

			case "csv":
				reader.onload = function (e) {
					processCsvFile(e.target.result, resolve);
				};
				reader.onerror = reject;
				reader.readAsText(file);
				break;

			case "txt":
				reader.onload = function (e) {
					const result = processTxtFile(e.target.result);
					resolve(result);
				};
				reader.onerror = reject;
				reader.readAsText(file);
				break;

			default:
				alert("지원하지 않는 파일 형식입니다: " + file.name);
				resolve({ added: 0, duplicate: 0 });
		}
	});
}

function processExcelFile(arrayBuffer) {
	try {
		const workbook = XLSX.read(arrayBuffer, { type: "array" });
		const sheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[sheetName];
		const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

		const newWords = [];
		let startRow = 0;

		if (jsonData.length > 0 && jsonData[0].length >= 2) {
			const firstCell = jsonData[0][0]?.toString().toLowerCase().trim();
			const secondCell = jsonData[0][1]?.toString().toLowerCase().trim();

			const headerKeywords = [
				"영어",
				"english",
				"eng",
				"단어",
				"word",
				"한국어",
				"korean",
				"kor",
				"뜻",
				"meaning",
			];
			const isHeader = headerKeywords.some(
				(keyword) =>
					firstCell?.includes(keyword) || secondCell?.includes(keyword)
			);

			if (isHeader) {
				startRow = 1;
			}
		}

		for (let i = startRow; i < jsonData.length; i++) {
			const row = jsonData[i];
			if (row.length >= 2 && row[0] && row[1]) {
				const english = row[0].toString().trim();
				const korean = row[1].toString().trim();
				const pos = row[2] ? row[2].toString().trim() : "";

				if (english && korean) {
					newWords.push({ english, korean, pos });
				}
			}
		}

		return addBulkWordsReturn(newWords);
	} catch (error) {
		alert("Excel 파일 처리 중 오류가 발생했습니다: " + error.message);
		return { added: 0, duplicate: 0 };
	}
}

function processJsonFile(text) {
	try {
		const data = JSON.parse(text);
		const newWords = [];

		if (Array.isArray(data)) {
			data.forEach((item) => {
				if (item.english && item.korean) {
					newWords.push({
						english: item.english.toString().trim(),
						korean: item.korean.toString().trim(),
						pos: item.pos ? item.pos.toString().trim() : "",
					});
				}
			});
		} else {
			alert("JSON 형식이 올바르지 않습니다. 배열 형태여야 합니다.");
			return { added: 0, duplicate: 0 };
		}

		return addBulkWordsReturn(newWords);
	} catch (error) {
		alert("JSON 파일 처리 중 오류가 발생했습니다: " + error.message);
		return { added: 0, duplicate: 0 };
	}
}

function processCsvFile(text, callback) {
	try {
		Papa.parse(text, {
			complete: function (results) {
				const newWords = [];
				results.data.forEach((row) => {
					if (row.length >= 2 && row[0] && row[1]) {
						const english = row[0].toString().trim();
						const korean = row[1].toString().trim();
						const pos = row[2] ? row[2].toString().trim() : "";

						if (english && korean) {
							newWords.push({ english, korean, pos });
						}
					}
				});
				const result = addBulkWordsReturn(newWords);
				callback(result);
			},
			error: function (error) {
				alert("CSV 파일 처리 중 오류가 발생했습니다: " + error.message);
				callback({ added: 0, duplicate: 0 });
			},
		});
	} catch (error) {
		alert("CSV 파일 처리 중 오류가 발생했습니다: " + error.message);
		callback({ added: 0, duplicate: 0 });
	}
}

function processTxtFile(text) {
	try {
		const lines = text.split("\n");
		const newWords = [];

		lines.forEach((line) => {
			line = line.trim();
			if (line) {
				let parts;
				if (line.includes("|")) {
					parts = line.split("|");
				} else if (line.includes(",")) {
					parts = line.split(",");
				} else if (line.includes(":")) {
					parts = line.split(":");
				} else {
					return;
				}

				if (parts.length >= 2) {
					const english = parts[0].trim();
					const korean = parts[1].trim();
					const pos = parts[2] ? parts[2].trim() : "";

					if (english && korean) {
						newWords.push({ english, korean, pos });
					}
				}
			}
		});

		return addBulkWordsReturn(newWords);
	} catch (error) {
		alert("TXT 파일 처리 중 오류가 발생했습니다: " + error.message);
		return { added: 0, duplicate: 0 };
	}
}

function processBulkInput() {
	const input = document.getElementById("bulkInput").value.trim();
	if (!input) {
		alert("내용을 입력해주세요.");
		return;
	}

	const lines = input.split("\n");
	const newWords = [];

	lines.forEach((line) => {
		line = line.trim();
		if (line) {
			let parts;
			if (line.includes("|")) {
				parts = line.split("|");
			} else if (line.includes(",")) {
				parts = line.split(",");
			} else if (line.includes(":")) {
				parts = line.split(":");
			} else {
				return;
			}

			if (parts.length >= 2) {
				const english = parts[0].trim();
				const korean = parts[1].trim();
				const pos = parts[2] ? parts[2].trim() : "";

				if (english && korean) {
					newWords.push({ english, korean, pos });
				}
			}
		}
	});

	const result = addBulkWordsReturn(newWords);
	let message = `${result.added}개의 단어가 추가되었습니다.`;
	if (result.duplicate > 0) {
		message += `\n${result.duplicate}개의 중복 단어는 제외되었습니다.`;
	}
	alert(message);

	document.getElementById("bulkInput").value = "";
}

function addBulkWordsReturn(newWords) {
	if (newWords.length === 0) {
		return { added: 0, duplicate: 0 };
	}

	let addedCount = 0;
	let duplicateCount = 0;

	newWords.forEach((newWord) => {
		const exists = words.find(
			(word) => word.english.toLowerCase() === newWord.english.toLowerCase()
		);

		if (!exists) {
			words.push(newWord);
			addedCount++;
		} else {
			duplicateCount++;
		}
	});

	saveWords();
	updateWordCount();
	displayWords();

	return { added: addedCount, duplicate: duplicateCount };
}

// 내보내기 함수들
function exportData(format) {
	if (words.length === 0) {
		alert("내보낼 단어가 없습니다.");
		return;
	}

	const timestamp = new Date().toISOString().split("T")[0];
	let content, filename, mimeType;

	switch (format) {
		case "json":
			content = JSON.stringify(words, null, 2);
			filename = `vocabulary_${timestamp}.json`;
			mimeType = "application/json";
			break;

		case "csv":
			content = words
				.map((word) => {
					const pos = word.pos || "";
					return pos
						? `"${word.english}","${word.korean}","${pos}"`
						: `"${word.english}","${word.korean}"`;
				})
				.join("\n");
			filename = `vocabulary_${timestamp}.csv`;
			mimeType = "text/csv;charset=utf-8";
			break;

		case "txt":
			content = words
				.map((word) => {
					const pos = word.pos || "";
					return pos
						? `${word.english}|${word.korean}|${pos}`
						: `${word.english}|${word.korean}`;
				})
				.join("\n");
			filename = `vocabulary_${timestamp}.txt`;
			mimeType = "text/plain;charset=utf-8";
			break;

		case "excel":
			const ws = XLSX.utils.aoa_to_sheet([
				["영어", "한국어", "품사"],
				...words.map((word) => [word.english, word.korean, word.pos || ""]),
			]);
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Vocabulary");
			XLSX.writeFile(wb, `vocabulary_${timestamp}.xlsx`);
			return;
	}

	const BOM = "\uFEFF";
	const blob = new Blob([BOM + content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function showNextQuestion() {
	if (currentTest >= testWords.length) {
		endTest();
		return;
	}

	const testCard = document.getElementById("testCard");
	const currentWord = testWords[currentTest];
	correctAnswer = currentWord.korean;

	currentChoices = generateChoices(currentWord);
	selectedChoice = null;

	let choicesHTML = "";
	currentChoices.forEach((choice, index) => {
		choicesHTML += `<button class="choice-btn" data-index="${index}" data-choice="${encodeURIComponent(
			choice
		)}">${choice}</button>`;
	});

	testCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div class="test-word">${currentWord.english}</div>
            <div style="font-size: 3rem; font-weight: bold; color: #667eea; min-width: 60px; text-align: center;" id="timer">5</div>
        </div>
        <div style="margin: 20px 0;" id="choicesContainer">
            ${choicesHTML}
        </div>
        <div class="test-controls">
            <button class="btn" onclick="skipQuestion()">건너뛰기</button>
            <button class="btn" onclick="endTest()">테스트 종료</button>
        </div>
        <div id="testResult"></div>
    `;

	const choiceButtons = document.querySelectorAll(".choice-btn");
	choiceButtons.forEach((btn) => {
		btn.addEventListener("click", function () {
			const index = parseInt(this.getAttribute("data-index"));
			const choice = decodeURIComponent(this.getAttribute("data-choice"));
			selectChoice(index, choice);
		});
	});

	startTimer();
}

function generateChoices(correctWord) {
	const choices = [correctWord.korean];

	const otherWords = words.filter(
		(word) =>
			word.english !== correctWord.english && word.korean !== correctWord.korean
	);
	const shuffledOthers = otherWords.sort(() => Math.random() - 0.5);

	for (let i = 0; i < Math.min(3, shuffledOthers.length); i++) {
		choices.push(shuffledOthers[i].korean);
	}

	while (choices.length < 4) {
		const dummyOptions = [
			"[명사] 임시 선택지",
			"[동사] 가짜 답안",
			"[형용사] 더미 옵션",
			"[부사] 기본 선택지",
		];
		const randomDummy =
			dummyOptions[Math.floor(Math.random() * dummyOptions.length)];
		if (!choices.includes(randomDummy)) {
			choices.push(randomDummy);
		}
	}

	return choices.sort(() => Math.random() - 0.5);
}

function selectChoice(index, choice) {
	if (selectedChoice !== null) return;

	if (timerInterval) {
		clearInterval(timerInterval);
		timerInterval = null;
	}

	const choiceBtns = document.querySelectorAll(".choice-btn");
	const resultDiv = document.getElementById("testResult");
	const isCorrect = choice === correctAnswer;

	selectedChoice = choice;

	choiceBtns.forEach((btn) => {
		btn.classList.add("disabled");
		btn.onclick = null;
	});

	choiceBtns[index].classList.add("selected");

	choiceBtns.forEach((btn) => {
		if (btn.textContent === correctAnswer) {
			btn.classList.add("correct");
		}
		if (btn.textContent === choice && !isCorrect) {
			btn.classList.add("incorrect");
		}
	});

	if (isCorrect) {
		correctAnswers++;
		resultDiv.innerHTML = `<div class="result correct">정답! 🎉</div>`;
	} else {
		wrongAnswers++;
		wrongAnswersList.push({
			word: testWords[currentTest],
			userAnswer: choice,
			correctAnswer: correctAnswer,
		});
		resultDiv.innerHTML = `<div class="result incorrect">틀렸습니다. 정답: ${correctAnswer}</div>`;
	}

	updateTestUI();

	setTimeout(() => {
		currentTest++;
		showNextQuestion();
	}, 800);
}
