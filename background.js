// GASのウェブアプリケーションのURL

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("データ受取");
  if (message.action === "sendToGAS") {
    let sendData = message.data;
    // console.log("データ送信");
	console.log("データ送信", sendData); // ログを追加
    // Gasにデータ送信
    const gasWebAppUrl =
      "https://script.google.com/macros/s/AKfycbwVPARkQhiATS9FDDofa1uIFZ78FXFXI7kll-nfiHDxkNm6nIAqARv-t2albmyOx3EGUQ/exec";



    if (sendData) {      // Fetch API を使ってPOSTリクエストを送信
      fetch(gasWebAppUrl, {
        method: "POST",
        headers: {
          //   'Content-Type': 'text/tab-separated-values; charset=utf-8',
          "Content-Type": "application/json",
        },
        body: sendData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Success:", data);
        })
        .catch((error) => {
          console.log("送信失敗", error);
          // console.error('Error:', error);
          return false;
        });
    }
  }
  return true;
});
