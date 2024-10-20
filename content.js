window.addEventListener("load", startCheck);
window.addEventListener("hashchange", startCheck); // ページ読み込み時

function startCheck() {
  const jsInitCheckTimer = setInterval(jsLoaded, 1000);
  function jsLoaded() {
    if (document.querySelector("div.listbox_title > a") != null) {
      clearInterval(jsInitCheckTimer);
      if (localStorage.getItem("checked") == null) {
        if (confirm("処理を開始しますか？")) {
          localStorage.setItem("checked", "true");
        } else {
          console.log("処理を中止しました。");
          return null;
        }
	}
	main();
	// navigateToNextPage();
    }
  }
}

async function main(e) {
  const jsInitCheckTimer = setInterval(jsLoaded, 1000);

  async function jsLoaded() {
    if (document.querySelector("div.listbox_title > a") != null) {
      clearInterval(jsInitCheckTimer);
      const targetLinks = Array.from(
        document.querySelectorAll("div.listbox_title > a")
      ).map((a) => a.href);

      const promises = targetLinks.map(async (link, index) => {
        const listboxTitle =
          document.querySelectorAll("div.listbox_info1")[index];

        const toggleButton = document.createElement("button");
        toggleButton.textContent = `詳細 ${index + 1}`;
        toggleButton.style.marginBottom = "10px";

        const detailsDiv = document.createElement("div");
        detailsDiv.style.display = "none";

        try {
          const response = await fetch(link);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const result = {};

          result["名前"] =
            doc
              .querySelector(".search_detail_topbox_title")
              ?.textContent.trim() || "情報なし";
          result["URL"] = link;
          result["所属機関・部署"] =
            doc.querySelector(".js_tooltip_search")?.textContent.trim() ||
            "情報なし";
          result["職名"] =
            doc
              .querySelector(
                "#detail_v > div.contents > div > div.contents_in_main > div > span:nth-child(5)"
              )
              ?.nextSibling?.textContent.trim() || "情報なし";
          const divElement = doc.querySelector(".indent_2line-1em");
          const aElements = divElement?.querySelectorAll("a");
          result["研究分野"] = [];
          aElements?.forEach((aElement) => {
            let previousNode = aElement.previousSibling;
            while (previousNode && previousNode.nodeType !== Node.TEXT_NODE) {
              previousNode = previousNode.previousSibling;
            }
            if (previousNode) {
              result["研究分野"].push(previousNode.textContent.trim());
            }
          });
          const keywordsDiv = doc.querySelector(
            "#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(8)"
          );
          const keywordsA = keywordsDiv?.querySelectorAll("a");
          result["研究キーワード"] = [];
          keywordsA?.forEach((aElement) => {
            let previousNode = aElement.previousSibling;
            while (previousNode && previousNode.nodeType !== Node.TEXT_NODE) {
              previousNode = previousNode.previousSibling;
            }
            if (previousNode) {
              result["研究キーワード"].push(previousNode.textContent.trim());
            }
          });
          result["論文"] = Array.from(doc.querySelectorAll(".mdisc li")).map(
            (item) => item.textContent.trim()
          );
          result["講演・口頭発表等"] = Array.from(
            doc.querySelectorAll(
              "#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(14) > ul"
            )
          ).map((item) => item.textContent.trim());
          result["学歴"] = Array.from(
            doc.querySelectorAll(
              "#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(17) > ul"
            )
          ).map((item) => item.textContent.trim());
          result["学位"] = Array.from(
            doc.querySelectorAll(
              "#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(20) > ul"
            )
          ).map((item) => item.textContent.trim());

          saveToLocalStorage(result["名前"], result);

          for (const key in result) {
            const value = result[key];
            const p = document.createElement("p");
            p.textContent = `${key}: ${
              Array.isArray(value) ? value.join(", ") : value
            }`;
            detailsDiv.appendChild(p);
          }
        } catch (error) {
          console.error(`リンク ${link} の取得に失敗しました:`, error);
          detailsDiv.textContent = "詳細情報の取得に失敗しました。";
        }

        toggleButton.addEventListener("click", () => {
          if (detailsDiv.style.display === "none") {
            detailsDiv.style.display = "block";
          } else {
            detailsDiv.style.display = "none";
          }
        });

        listboxTitle.appendChild(toggleButton);
        listboxTitle.appendChild(detailsDiv);
      });

      // すべての fetch が完了したら次の処理を実行
      await Promise.all(promises);

      CSVdownload(); // confirmDownload() から CSVdownload() に変更
      clearLocalStorage();
      navigateToNextPage();
    }
  }
}

function clearLocalStorage() {
  // localStorageを消すかの確認ダイアログを表示
  // OKが押されたらlocalStorageを消去
  localStorage.clear("Researchers");
  console.log("LocalStorageを消去しました。");
}

// function CSVdownload() {
//   const researchers = JSON.parse(localStorage.getItem("Researchers")); // Researchers データを取得
//   const result = researchers.map((researcher) => researcher); // 研究者データのみを抽出

//   // CSV データを構築するための配列
//   const csvRows = [];

//   // ヘッダー行を追加
//   csvRows.push(["name", "data"]);

//   // 各研究者のデータを処理
//   result.forEach((researcher) => {
//     const name = researcher.name;
//     const data = researcher.data;

//     // data オブジェクト内の各プロパティを文字列に変換

//     // data オブジェクト内の各プロパティを文字列に変換
//     const dataValues = Object.values(data).map((value) => {
//       if (Array.isArray(value)) {
//         // 配列の場合は要素をカンマ区切りで結合
//         return value.map((item) => item.replace(/\t|\n/g, "")); // \tと\nを削除
//       } else {
//         // 文字列の場合はそのまま返す
//         return value.replace(/\t|\n/g, ""); // \tと\nを削除
//       }
//     });

//     // name と dataValues を結合して CSV 行を作成
//     const csvRow = [name, ...dataValues];
//     csvRows.push(csvRow);
//   });

//   // CSV 文字列を作成
//   const csvString = csvRows.map((row) => row.join(",")).join("\n");

//   // 確認ダイアログを表示
//   // Blobオブジェクトを作成
//   const blob = new Blob(["\ufeff" + csvString], {
//     type: "text/csv;charset=utf-8;",
//   });
//   // ダウンロードリンクを作成
//   const link = document.createElement("a");
//   const url = URL.createObjectURL(blob);
//   link.setAttribute("href", url);
//   link.setAttribute("download", "localStorage.csv");
//   link.style.visibility = "hidden";
//   document.body.appendChild(link);

//   // リンクをクリックしてダウンロード
//   link.click();
//   document.body.removeChild(link);
// }
function CSVdownload() {
	const researchers = JSON.parse(localStorage.getItem("Researchers"));
	const result = researchers.map((researcher) => researcher);

	const csvRows = [];
	csvRows.push(["name", "data"]); // ヘッダー行

	result.forEach((researcher) => {
	  const name = researcher.name;
	  const dataString = JSON.stringify(researcher.data, null, 2).replace(/\\t|\\n|\t|\n/g, ""); // 整形されたJSON文字列

	  // name と dataString を結合して CSV 行を作成 (ダブルクォートで囲み、エスケープ)
	  csvRows.push([
		`"${name.replace(/"/g, '""')}"`, // name をダブルクォートで囲み、エスケープ
		`"${dataString.replace(/"/g, '""')}"`, // dataString をダブルクォートで囲み、エスケープ
	  ]);
	});

	const csvString = csvRows.join("\n"); // 行を改行で結合

	const blob = new Blob(["\ufeff" + csvString], { type: "text/csv;charset=utf-8;" });
	const link = document.createElement("a");
	const url = URL.createObjectURL(blob);
	link.href = url;
	link.download = "localStorage.csv";
	link.style.visibility = "hidden";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
  }

function navigateToNextPage() {
  const nextPageLink = document.querySelector(
    ".paging .pagination li:nth-last-child(2) a"
  );

  if (nextPageLink) {
    nextPageLink.click();
  } else {
    console.error("「次へ」へのリンクが見つかりませんでした。");
    localStorage.clear("checked");
	alert("処理を終了しました。");
	return null;
  }
}

// localStorage にデータを保存する関数
function saveToLocalStorage(researcherName, data) {
  let researchers = JSON.parse(localStorage.getItem("Researchers")) || []; // Researchers データを取得 (なければ空の配列)

  // name がユニークになるように重複を削除
  const seenNames = new Set();
  const uniqueResearchers = researchers.filter((researcher) => {
    if (!seenNames.has(researcher.name)) {
      seenNames.add(researcher.name);
      return true;
    }
    return false;
  });

  uniqueResearchers.push({ name: researcherName, data: data }); // 研究者名とデータをオブジェクトとして追加
  localStorage.setItem("Researchers", JSON.stringify(uniqueResearchers)); // Researchers データを更新
}
