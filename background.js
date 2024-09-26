/*
リンクをすべて取得
リンク先情報を取得
リンクがあるdivの一番したに取得した情報を掲載する、

*/


window.addEventListener("load", main, false);
function main(e) {
  const jsInitCheckTimer = setInterval(jsLoaded, 1000);
  function jsLoaded() {
    if (document.querySelector("div.listbox_title > a") != null) {
      clearInterval(jsInitCheckTimer);
      const targetLinks = Array.from(
        document.querySelectorAll("div.listbox_title > a")
      ).map((a) => a.href);
      console.log(targetLinks);
      // 各リンクに対して処理を行う
      targetLinks.forEach((link, index) => {
        // 対応する div.listbox_title 要素を取得
        const listboxTitle =
          document.querySelectorAll("div.listbox_info1")[index];

        // トグルボタンの作成
        const toggleButton = document.createElement("button");
        toggleButton.textContent = `詳細 ${index + 1}`;
        toggleButton.style.marginBottom = "10px";

        // 詳細情報格納用のdivを作成 (初期状態は非表示)
        const detailsDiv = document.createElement("div");
        detailsDiv.style.display = "none";

        // トグルボタンクリック時のイベントを設定 (変更なし)
        // ... (fetch の処理も変更なし)
        toggleButton.addEventListener("click", () => {
          if (detailsDiv.style.display === "none") {
            detailsDiv.style.display = "block";
            // 詳細情報を取得して表示 (fetch の結果を表示)
            if (detailsDiv.textContent === "") {
              // 詳細情報がまだ取得されていない場合のみ fetch を実行
              fetch(link)
                .then((response) => {
                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }
                  return response.text();
                })
                .then((html) => {
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, "text/html");
                  const result = {};

                  // 所属機関・部署
                  result["所属機関・部署"] =
                    doc
                      .querySelector(".js_tooltip_search")
                      ?.textContent.trim() || "情報なし";
                  // 職名
                  result["職名"] =
                    doc
                      .querySelector(
                        "#detail_v > div.contents > div > div.contents_in_main > div > span:nth-child(5)"
                      )
                      ?.nextSibling?.textContent.trim() || "情報なし";
                  // 研究分野
                  const divElement = doc.querySelector(".indent_2line-1em");
                  const aElements = divElement?.querySelectorAll("a");
                  result["研究分野"] = [];
                  aElements?.forEach((aElement) => {
                    let previousNode = aElement.previousSibling;
                    while (
                      previousNode &&
                      previousNode.nodeType !== Node.TEXT_NODE
                    ) {
                      previousNode = previousNode.previousSibling;
                    }
                    if (previousNode) {
                      result["研究分野"].push(previousNode.textContent.trim());
                    }
                  });
                  // 研究キーワード取得
                  const keywordsDiv = doc.querySelector(
                    "#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(8)"
                  );
                  const keywrodsA = keywordsDiv?.querySelectorAll("a");
                  result["研究キーワード"] = [];
                  keywrodsA?.forEach((aElement) => {
                    let previousNode = aElement.previousSibling;
                    while (
                      previousNode &&
                      previousNode.nodeType !== Node.TEXT_NODE
                    ) {
                      previousNode = previousNode.previousSibling;
                    }
                    if (previousNode) {
                      result["研究キーワード"].push(
                        previousNode.textContent.trim()
                      );
                    }
                  });
                  // 論文
                  result["論文"] = Array.from(
                    doc.querySelectorAll(".mdisc li")
                  ).map((item) => item.textContent.trim());
                  // 講演・口頭発表等
                  result["講演・口頭発表等"] = Array.from(
                    doc.querySelectorAll(
                      "#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(14) > ul"
                    )
                  ).map((item) => item.textContent.trim());
                  // 学歴
                  result["学歴"] = Array.from(
                    doc.querySelectorAll(
                      "#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(17) > ul"
                    )
                  ).map((item) => item.textContent.trim());
                  // 学位
                  result["学位"] = Array.from(
                    doc.querySelectorAll(
                      "#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(20) > ul"
                    )
                  ).map((item) => item.textContent.trim());

                  // result オブジェクトの内容を表示
                  for (const key in result) {
                    const value = result[key];
                    const p = document.createElement("p");
                    p.textContent = `${key}: ${
                      Array.isArray(value) ? value.join(", ") : value
                    }`;
                    detailsDiv.appendChild(p);
                  }
                })
                .catch((error) => {
                  console.error(`リンク ${link} の取得に失敗しました:`, error);
                  detailsDiv.textContent = "詳細情報の取得に失敗しました。";
                });
            }
          } else {
            detailsDiv.style.display = "none";
          }
        });

        // トグルボタンと詳細情報divを listboxTitle に追加
        listboxTitle.appendChild(toggleButton);
        listboxTitle.appendChild(detailsDiv);
      });
    }
  }
}
