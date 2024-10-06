const API_KEY = 'AIzaSyB9FKqm44K9YIOq5g1ZMcirtLU7GtVzH6A'; // ここにGemini APIキーを入力
async function callGeminiAPI(prompt) {
	console.log("送信開始");

	const researcherElements = Array.from(document.querySelectorAll("div.listbox_title"));

	// 各研究者ごとに処理
	for (const element of researcherElements) {
	  const name = element.querySelector('a').textContent;
	  const result = localStorage.getItem(name);

	  if (result) { // localStorageにデータがある場合のみAPI呼び出し
		try {
		  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + API_KEY, {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json'
			},
			body: JSON.stringify({
			  contents: [
				{
				  parts: [
					{
					  text: `与えられたプロンプトと情報を比較して、達成度を1~100で評価してください。\nプロンプト: {${prompt}}\n情報: ${result}`
					}
				  ]
				}
			  ]
			})
		  });

		  if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		  }

		  const data = await response.json();
		  console.log(`${name} の評価: ${data.candidates[0].content.parts[0].text}`);

		} catch (error) {
		  console.error('Error:', error);
		}
	  } else {
		console.log(`${name} の情報はlocalStorageに保存されていません。`);
	  }
	}
  }
// callGeminiAPI("AI",result["名前"]).then(data => console.log(data));


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateContent') {
        callGeminiAPI(request.prompt)
            .then(data => sendResponse({ success: true, data: data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // 非同期応答を待つためにtrueを返す
    }
});
