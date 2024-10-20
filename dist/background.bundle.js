/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./background.js":
/*!***********************!*\
  !*** ./background.js ***!
  \***********************/
/***/ (() => {

eval("const API_KEY = 'AIzaSyB9FKqm44K9YIOq5g1ZMcirtLU7GtVzH6A'; // ここにGemini APIキーを入力\nasync function callGeminiAPI(prompt) {\n\tconsole.log(\"送信開始\");\n\n\tconst researcherElements = Array.from(document.querySelectorAll(\"div.listbox_title\"));\n\n\t// 各研究者ごとに処理\n\tfor (const element of researcherElements) {\n\t  const name = element.querySelector('a').textContent;\n\t  const result = localStorage.getItem(name);\n\n\t  if (result) { // localStorageにデータがある場合のみAPI呼び出し\n\t\ttry {\n\t\t  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + API_KEY, {\n\t\t\tmethod: 'POST',\n\t\t\theaders: {\n\t\t\t  'Content-Type': 'application/json'\n\t\t\t},\n\t\t\tbody: JSON.stringify({\n\t\t\t  contents: [\n\t\t\t\t{\n\t\t\t\t  parts: [\n\t\t\t\t\t{\n\t\t\t\t\t  text: `与えられたプロンプトと情報を比較して、達成度を1~100で評価してください。\\nプロンプト: {${prompt}}\\n情報: ${result}`\n\t\t\t\t\t}\n\t\t\t\t  ]\n\t\t\t\t}\n\t\t\t  ]\n\t\t\t})\n\t\t  });\n\n\t\t  if (!response.ok) {\n\t\t\tthrow new Error(`HTTP error! status: ${response.status}`);\n\t\t  }\n\n\t\t  const data = await response.json();\n\t\t  console.log(`${name} の評価: ${data.candidates[0].content.parts[0].text}`);\n\n\t\t} catch (error) {\n\t\t  console.error('Error:', error);\n\t\t}\n\t  } else {\n\t\tconsole.log(`${name} の情報はlocalStorageに保存されていません。`);\n\t  }\n\t}\n  }\n// callGeminiAPI(\"AI\",result[\"名前\"]).then(data => console.log(data));\n\n\nchrome.runtime.onMessage.addListener((request, sender, sendResponse) => {\n    if (request.action === 'generateContent') {\n        callGeminiAPI(request.prompt)\n            .then(data => sendResponse({ success: true, data: data }))\n            .catch(error => sendResponse({ success: false, error: error.message }));\n        return true; // 非同期応答を待つためにtrueを返す\n    }\n});\n\n\n//# sourceURL=webpack://evaluationjglobals/./background.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./background.js"]();
/******/ 	
/******/ })()
;