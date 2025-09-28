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

// 페이지 로드 시 초기화
window.onload = function () {
	loadWords();
	updateWordCount();
	displayWords();
	setupFileUpload();
	showFormat("excel");
	setupEventListeners();
};

// 이벤트 리스너 설정
function setupEventListeners() {
	// Enter 키로 단어 추가
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

	words.push({ english, korean });
	saveWords();
	updateWordCount();
	displayWords();

	document.getElementById("englishWord").value = "";
	document.getElementById("koreanMeaning").value = "";
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
                <div class="word-english">${word.english}</div>
                <div class="word-korean">${word.korean}</div>
            </div>
            <button class="delete-btn" onclick="deleteWord(${index})">삭제</button>
        </div>
    `
		)
		.join("");
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
	testWords = shuffled.slice(0, Math.min(400, words.length));

	currentTest = 0;
	correctAnswers = 0;
	wrongAnswers = 0;
	wrongAnswersList = [];
	isTestActive = true;

	document.getElementById("testResultsSection").style.display = "none";

	updateTestUI();

	// 1.5초 후 자동으로 다음 문제
	setTimeout(() => {
		currentTest++;
		showNextQuestion();
	}, 1500);
}

function skipQuestion() {
	wrongAnswers++;
	currentTest++;
	updateTestUI();
	showNextQuestion();
}

function updateTestUI() {
	document.getElementById("currentNumber").textContent = currentTest + 1;
	document.getElementById("totalQuestions").textContent = testWords.length;
	document.getElementById("correctCount").textContent = correctAnswers;
	document.getElementById("wrongCount").textContent = wrongAnswers;
}

function endTest() {
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
                <div class="wrong-answer-word">${item.word.english}</div>
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
	}
}

// 파일 처리 관련 함수들
function showFormat(format) {
	const formatTabs = document.querySelectorAll(".format-tab");
	formatTabs.forEach((tab) => tab.classList.remove("active"));
	event.target.classList.add("active");

	const examples = {
		excel: `Excel 파일 형식:
┌─────────┬──────────┐
│    A    │    B     │
├─────────┼──────────┤
│ apple   │ 사과     │
│ banana  │ 바나나   │
│ orange  │ 오렌지   │
└─────────┴──────────┘

- A열: 영어 단어
- B열: 한국어 뜻
- 첫 번째 행부터 데이터 입력`,

		json: `JSON 파일 형식:
[
  {
    "english": "apple",
    "korean": "사과"
  },
  {
    "english": "banana", 
    "korean": "바나나"
  },
  {
    "english": "orange",
    "korean": "오렌지"
  }
]`,

		csv: `CSV 파일 형식:
apple,사과
banana,바나나
orange,오렌지

- 쉼표(,)로 구분
- 한 줄에 하나씩
- 따옴표 불필요`,

		txt: `TXT 파일 형식:
apple,사과
banana,바나나
orange,오렌지

또는

apple:사과
banana:바나나  
orange:오렌지

- 쉼표(,) 또는 콜론(:)으로 구분`,
	};

	document.getElementById("format-examples").textContent = examples[format];
}

function setupFileUpload() {
	document
		.getElementById("fileInput")
		.addEventListener("change", function (event) {
			const file = event.target.files[0];
			if (file) {
				document.getElementById("fileName").textContent = file.name;
				processFile(file);
			}
		});
}

function processFile(file) {
	const extension = file.name.split(".").pop().toLowerCase();
	const reader = new FileReader();

	switch (extension) {
		case "xlsx":
		case "xls":
			reader.onload = function (e) {
				processExcelFile(e.target.result);
			};
			reader.readAsArrayBuffer(file);
			break;

		case "json":
			reader.onload = function (e) {
				processJsonFile(e.target.result);
			};
			reader.readAsText(file);
			break;

		case "csv":
			reader.onload = function (e) {
				processCsvFile(e.target.result);
			};
			reader.readAsText(file);
			break;

		case "txt":
			reader.onload = function (e) {
				processTxtFile(e.target.result);
			};
			reader.readAsText(file);
			break;

		default:
			alert("지원하지 않는 파일 형식입니다.");
	}
}

function processExcelFile(arrayBuffer) {
	try {
		const workbook = XLSX.read(arrayBuffer, { type: "array" });
		const sheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[sheetName];
		const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

		const newWords = [];
		jsonData.forEach((row) => {
			if (row.length >= 2 && row[0] && row[1]) {
				const english = row[0].toString().trim();
				const korean = row[1].toString().trim();
				if (english && korean) {
					newWords.push({ english, korean });
				}
			}
		});

		addBulkWords(newWords);
	} catch (error) {
		alert("Excel 파일 처리 중 오류가 발생했습니다: " + error.message);
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
					});
				}
			});
		} else {
			alert("JSON 형식이 올바르지 않습니다. 배열 형태여야 합니다.");
			return;
		}

		addBulkWords(newWords);
	} catch (error) {
		alert("JSON 파일 처리 중 오류가 발생했습니다: " + error.message);
	}
}

function processCsvFile(text) {
	try {
		Papa.parse(text, {
			complete: function (results) {
				const newWords = [];
				results.data.forEach((row) => {
					if (row.length >= 2 && row[0] && row[1]) {
						const english = row[0].toString().trim();
						const korean = row[1].toString().trim();
						if (english && korean) {
							newWords.push({ english, korean });
						}
					}
				});
				addBulkWords(newWords);
			},
			error: function (error) {
				alert("CSV 파일 처리 중 오류가 발생했습니다: " + error.message);
			},
		});
	} catch (error) {
		alert("CSV 파일 처리 중 오류가 발생했습니다: " + error.message);
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
				if (line.includes(",")) {
					parts = line.split(",");
				} else if (line.includes(":")) {
					parts = line.split(":");
				} else {
					return;
				}

				if (parts.length >= 2) {
					const english = parts[0].trim();
					const korean = parts[1].trim();
					if (english && korean) {
						newWords.push({ english, korean });
					}
				}
			}
		});

		addBulkWords(newWords);
	} catch (error) {
		alert("TXT 파일 처리 중 오류가 발생했습니다: " + error.message);
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
			if (line.includes(",")) {
				parts = line.split(",");
			} else if (line.includes(":")) {
				parts = line.split(":");
			} else {
				return;
			}

			if (parts.length >= 2) {
				const english = parts[0].trim();
				const korean = parts[1].trim();
				if (english && korean) {
					newWords.push({ english, korean });
				}
			}
		}
	});

	addBulkWords(newWords);
	document.getElementById("bulkInput").value = "";
}

function addBulkWords(newWords) {
	if (newWords.length === 0) {
		alert("처리할 수 있는 단어가 없습니다.");
		return;
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

	let message = `${addedCount}개의 단어가 추가되었습니다.`;
	if (duplicateCount > 0) {
		message += `\n${duplicateCount}개의 중복 단어는 제외되었습니다.`;
	}
	alert(message);
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
				.map((word) => `${word.english},${word.korean}`)
				.join("\n");
			filename = `vocabulary_${timestamp}.csv`;
			mimeType = "text/csv";
			break;

		case "txt":
			content = words
				.map((word) => `${word.english},${word.korean}`)
				.join("\n");
			filename = `vocabulary_${timestamp}.txt`;
			mimeType = "text/plain";
			break;

		case "excel":
			const ws = XLSX.utils.json_to_sheet(
				words.map((word) => ({
					영어: word.english,
					한국어: word.korean,
				}))
			);
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, "Vocabulary");
			XLSX.writeFile(wb, `vocabulary_${timestamp}.xlsx`);
			return;
	}

	const blob = new Blob([content], { type: mimeType });
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
        <div class="test-word">${currentWord.english}</div>
        <div style="margin: 20px 0;" id="choicesContainer">
            ${choicesHTML}
        </div>
        <div class="test-controls">
            <button class="btn" onclick="skipQuestion()">건너뛰기</button>
            <button class="btn" onclick="endTest()">테스트 종료</button>
        </div>
        <div id="testResult"></div>
    `;

	// 선택지 버튼에 이벤트 리스너 추가
	const choiceButtons = document.querySelectorAll(".choice-btn");
	choiceButtons.forEach((btn) => {
		btn.addEventListener("click", function () {
			const index = parseInt(this.getAttribute("data-index"));
			const choice = decodeURIComponent(this.getAttribute("data-choice"));
			selectChoice(index, choice);
		});
	});
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

	const choiceBtns = document.querySelectorAll(".choice-btn");
	const resultDiv = document.getElementById("testResult");
	const isCorrect = choice === correctAnswer;

	selectedChoice = choice;

	// 모든 버튼 비활성화
	choiceBtns.forEach((btn) => {
		btn.classList.add("disabled");
		btn.onclick = null;
	});

	// 선택한 버튼 표시
	choiceBtns[index].classList.add("selected");

	// 정답/오답 표시
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

	// 1.5초 후 자동으로 다음 문제
	setTimeout(() => {
		currentTest++;
		showNextQuestion();
	}, 1500);
}
