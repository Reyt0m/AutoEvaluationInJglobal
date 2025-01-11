// ページ読み込み時とハッシュ変更時に実行
window.addEventListener("load", main);
window.addEventListener("hashchange", main);

async function main() {
  const jsInitCheckTimer = setInterval(jsLoaded, 1000);

  async function jsLoaded() {
    if (document.querySelector("div.listbox_title > a, .t_105") != null) {
      clearInterval(jsInitCheckTimer);

      await processResearcherList();
      createSaveButton();
    }
  }
}

// リンクごとに要素を作成
async function processResearcherList() {
  const targetElements = Array.from(
    document.querySelectorAll("div.listbox_title > a, .t_105")
  );
  const targetLinks = targetElements.map((element) =>
    element.tagName === "A"
      ? element
      : element.closest(".listbox_info1")?.querySelector("a")
  );

  const promises = targetLinks.map(async (link, index) => {
    // console.log(researcherName)
    let researcherName = link.href;
    link = link.href;
    const url = new URL(link);
    const searchParams = new URLSearchParams(url.search);
    researcherName = searchParams.get("JGLOBAL_ID");

    // listboxTitle を取得し、存在しない場合はエラー処理
    let listboxTitle =
      document.querySelectorAll("div.listbox_info1")[index] ||
      document.querySelectorAll("div.box1 > table > tbody > tr")[index + 1];

    if (!listboxTitle) {
      console.error(`listboxTitle が取得できませんでした (index: ${index})`);
      return;
    }

    // 詳細ボタン、詳細情報コンテナ、コメントエリアを作成
    const toggleButton = createToggleButton(index);
	const displayDiv = createDisplayDiv(researcherName);
    const detailsDiv = createDetailsContainer();
    const commentTextArea = createCommentTextArea(researcherName);

    // 詳細情報の取得と表示
    if (link) {
      await fetchAndDisplayDetails(link, detailsDiv,displayDiv);
    } else {
      console.error("リンクが取得できませんでした。");
      detailsDiv.textContent = "詳細情報の取得に失敗しました。";
    }

    // 要素の追加
    appendElements(listboxTitle,   displayDiv,toggleButton, detailsDiv,commentTextArea);
    // appendElements(listboxTitle, detailsDiv, commentTextArea);
  });

  await Promise.all(promises);
}

// 詳細ボタンを作成する関数
function createToggleButton(index) {
  const toggleButton = document.createElement("button");
    // toggleButton.textContent = `詳細 ${index + 1}`;
    toggleButton.textContent = `開閉`;
    toggleButton.style.marginBottom = "10px";
    toggleButton.addEventListener("click", toggleDetails);
  return toggleButton;
}

// 詳細ボタンのクリックイベントハンドラ
function toggleDetails(event) {
  const detailsDiv = event.target.nextElementSibling;
  if (detailsDiv) {
    detailsDiv.style.display =
      detailsDiv.style.display === "none" ? "block" : "none";
  }
}
//　デフォルト情報を表示するコンテナを作成する関数
function createDisplayDiv() {

	const displayDiv = document.createElement("div");
	return displayDiv;
}


// 詳細情報のコンテナを作成する関数
function createDetailsContainer() {
  const detailsDiv = document.createElement("div");
    detailsDiv.style.display = "none";
  return detailsDiv;
}

// コメントエリアを作成し、データを読み込む関数
function createCommentTextArea(researcherName) {
  const commentTextArea = document.createElement("textarea");
  commentTextArea.placeholder = "コメントを入力...";
  commentTextArea.style.width = "80%";
  commentTextArea.style.height = "50px";
  commentTextArea.style.marginTop = "10px";

  const savedData = loadFromLocalStorage(researcherName) || {};
  commentTextArea.value = savedData["コメント"] || "";
  commentTextArea.addEventListener("input", () => {
    saveCommentToLocalStorage(researcherName, commentTextArea.value, savedData);
  });

  return commentTextArea;
}

// コメントをlocalStorageに保存する関数
function saveCommentToLocalStorage(researcherName, comment, savedData) {
  const dataToSave = { ...savedData, コメント: comment };
  saveToLocalStorage(researcherName, dataToSave);
}

// 詳細情報を取得して表示する関数
async function fetchAndDisplayDetails(link, detailsDiv,displayDiv) {
  try {
    const response = await fetch(link);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const result = extractResearcherDetails(doc, link);
    displayDetails(result, detailsDiv);
	displayDefaultDetails(result, displayDiv);
  } catch (error) {
    console.error(`リンク ${link} の取得に失敗しました:`, error);
    detailsDiv.textContent = "詳細情報の取得に失敗しました。";
  }
}

// 研究者の詳細情報を抽出する関数
function extractResearcherDetails(doc, link) {

//   link = link.substring(0, link.indexOf("&"));
  const result = {
    "J-GLOBAL ID": extractTextContent(doc, ".info_number"),
    名前: extractTextContent(doc, ".search_detail_topbox_title"),
    URL: removeQueryStringAndFragment(link),
    ホームページURL: extractHrefAfterSpan(doc, "ホームページURL"),
    "所属機関・部署": extractAffiliation(doc),
    職名: extractJobTitle(doc),
    研究分野: extractTextContentFromLinks(
      doc.querySelector(".indent_2line-1em")
    ),
    研究キーワード: extractKeywords(doc), // 修正
    論文: extractListItemsAfterSpan(doc, "論文"),
    "講演・口頭発表等": extractListItemsAfterSpan(doc, "講演・口頭発表等"),
    学歴: extractListItemsAfterSpan(doc, "学歴"),
    学位: extractListItemsAfterSpan(doc, "学位"),
    Works: [], // 必要に応じて取得処理を追加
    競争的資金等の研究課題: extractListItemsAfterSpan(
      doc,
      "競争的資金等の研究課題"
    ),
    MISC: extractListItemsAfterSpan(doc, "MISC"),
    書籍: extractListItemsAfterSpan(doc, "書籍"),
    特許: extractListItemsAfterSpan(doc, "特許"),
    経歴: extractListItemsAfterSpan(doc, "経歴"),
    受賞: extractListItemsAfterSpan(doc, "受賞"),
    委員歴: extractListItemsAfterSpan(doc, "委員歴"),
    所属学会: extractTextFromDivAfterSpanAndBr(doc, "所属学会"),
  };
  return result;
}

function removeQueryStringAndFragment(url) {

	const questionIndex = url.indexOf('&');
	if (questionIndex !== -1) {
        return url.substring(0, questionIndex);
	  }
    const fragmentIndex = url.indexOf('#', questionIndex);
        if(fragmentIndex !== -1){

        return url.substring(0, fragmentIndex);
	}
	return url;
  }

// 研究キーワードを取得する関数
function extractKeywords(doc) {
  const spanElement = Array.from(
    doc.querySelectorAll("span.detail_item_title")
  ).find((span) => span.textContent.includes("研究キーワード"));

  if (!spanElement) {
    // console.error("研究キーワードを含むspanが見つかりませんでした");
    return [];
  }

  const divElement = spanElement.closest("div.indent_2line-1em");
  if (!divElement) {
    console.error("spanを包含するdivが見つかりませんでした");
    return [];
  }

  // 子ノードをすべて取得し、テキストノードのみを抽出
  const textNodes = Array.from(divElement.childNodes)
    .filter(
      (node) =>
        node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ""
    )
    .map((node) => node.textContent.trim().replace(/[\t\n,]/g, "")); // タブ、改行、カンマを削除

  return textNodes;
}

// リンク要素からテキストコンテンツを抽出する関数（変更なし）
function extractTextContentFromLinks(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll("a"))
    .map((aElement) => {
      let previousNode = aElement.previousSibling;
      while (previousNode && previousNode.nodeType !== Node.TEXT_NODE) {
        previousNode = previousNode.previousSibling;
      }
      return previousNode ? previousNode.textContent.trim() : "";
    })
    .filter((item) => item !== "");
}

// 特定のspanの後のbrの次のdivの中のulのリスト項目を抽出するヘルパー関数（変更なし）
function extractListItemsAfterSpan(doc, spanStartText) {
  const spanElement = Array.from(
    doc.querySelectorAll("span.detail_item_title")
  ).find((span) => span.textContent.trim().startsWith(spanStartText));

  if (!spanElement) {
    // console.error(
    //   `指定されたテキストで始まるspanが見つかりませんでした:`,
    //   spanStartText
    // );
    return [];
  }

  const brElement = spanElement.nextElementSibling;
  if (!brElement || brElement.tagName !== "BR") {
    console.error("spanの次の要素がbrタグではありません");
    return [];
  }

  const divElement = brElement.nextElementSibling;
  if (!divElement || divElement.tagName !== "DIV") {
    console.error("brタグの次の要素がdivタグではありません");
    return [];
  }

  const ulElement = divElement.querySelector("ul");
  if (!ulElement) {
    console.error("divの中のulが見つかりませんでした");
    return [];
  }

  return Array.from(ulElement.querySelectorAll("li")).map((li) =>
    li.textContent.trim().replace(/[\t\n]/g, "")
  );
}

// 特定のテキストを含むspanタグの次のaタグのhref属性を抽出するヘルパー関数（変更なし）
function extractHrefAfterSpan(doc, spanText) {
  const spanElement = Array.from(doc.querySelectorAll("span")).find((span) =>
    span.textContent.includes(spanText)
  );

  if (!spanElement) {
    // console.error(
    //   `指定されたテキストを含むspanが見つかりませんでした:`,
    //   spanText
    // );
    return "情報なし";
  }

  const aElement = spanElement.nextElementSibling;
  if (!aElement || aElement.tagName !== "A") {
    console.error("spanの次の要素がaタグではありません");
    return "情報なし";
  }

  return aElement.href;
}

// 特定のspanタグの後のbrタグの次のdivタグのテキスト内容を抽出する関数
function extractTextFromDivAfterSpanAndBr(doc, spanStartText) {
  const spanElement = Array.from(
    doc.querySelectorAll("span.detail_item_title")
  ).find((span) => span.textContent.trim().startsWith(spanStartText));

  if (!spanElement) {
    // console.error(
    //   `指定されたテキストで始まるspanが見つかりませんでした:`,
    //   spanStartText
    // );
    return "情報なし";
  }

  const brElement = spanElement.nextElementSibling;
  if (!brElement || brElement.tagName !== "BR") {
    console.error("spanの次の要素がbrタグではありません");
    return "情報なし";
  }

  const divElement = brElement.nextElementSibling;
  if (!divElement || divElement.tagName !== "DIV") {
    console.error("brタグの次の要素がdivタグではありません");
    return "情報なし";
  }

  return divElement.textContent.trim().replace(/[\t\n]/g, "");
}
// テキストコンテンツを抽出するヘルパー関数
function extractTextContent(doc, selector) {
  return doc.querySelector(selector)?.textContent.trim() || "情報なし";
}

// 所属機関・部署を抽出するヘルパー関数
function extractAffiliation(doc) {
  let affiliation =
    doc.querySelector(".js_tooltip_search")?.textContent.trim() || "情報なし";
  const aboutIndex = affiliation.indexOf("について");
  if (aboutIndex !== -1) {
    affiliation = affiliation.substring(0, aboutIndex);
  }
  return affiliation;
}

// 職名を抽出するヘルパー関数
function extractJobTitle(doc) {
  const element = doc.querySelector(
    "#detail_v > div.contents > div > div.contents_in_main > div > span:nth-child(5)"
  );
  return element?.nextSibling?.textContent.trim() || "情報なし";
}

// リスト項目を抽出するヘルパー関数
function extractListItems(doc, selector) {
  return Array.from(doc.querySelectorAll(selector)).map((item) =>
    item.textContent.trim()
  );
}

// リンク要素からテキストコンテンツを抽出する関数
function extractTextContentFromLinks(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll("a"))
    .map((aElement) => {
      let previousNode = aElement.previousSibling;
      while (previousNode && previousNode.nodeType !== Node.TEXT_NODE) {
        previousNode = previousNode.previousSibling;
      }
      return previousNode ? previousNode.textContent.trim() : "";
    })
    .filter((item) => item !== "");
}
// デフォルト情報を表示する関数
function displayDefaultDetails(result, detailsDiv) {
  result = {
	  競争的資金等の研究課題: result.競争的資金等の研究課題,
    論文: result.論文,
  };
  for (const key in result) {
    const value = result[key];
    const p = document.createElement("p");
    p.innerHTML = Array.isArray(value)
      ? `<br><strong>${key}:</strong> <br>${value.join("<br>")}`
      : `<br><strong>${key}:</strong> <br>${value}`;
    detailsDiv.appendChild(p);
  }
}

// 詳細情報を表示する関数
function displayDetails(result, detailsDiv) {
  result = {
    URL: result.URL,
    職名: result.職名,
    研究分野: result.研究分野,
    研究キーワード: result.研究キーワード,
    論文: result.論文,
    MISC: result.MISC,
    書籍: result.書籍,
    受賞: result.受賞,
    委員歴: result.委員歴,
    所属学会: result.所属学会,
  };
  for (const key in result) {
    const value = result[key];
    const p = document.createElement("p");
    p.innerHTML = Array.isArray(value)
      ? `<br><strong>${key}:</strong> <br>${value.join("<br>")}`
      : `<br><strong>${key}:</strong> <br>${value}`;
    detailsDiv.appendChild(p);
  }
}

// localStorage からデータを読み込む関数
function loadFromLocalStorage(researcherName) {
  const researchers = JSON.parse(localStorage.getItem("Researchers")) || [];
  const researcherData = researchers.find(
    (researcher) => researcher.name === researcherName
  );
  return researcherData ? researcherData.data : null;
}

// localStorage にデータを保存する関数
function saveToLocalStorage(researcherName, data) {
  const researchers = JSON.parse(localStorage.getItem("Researchers")) || [];
  const seenNames = new Set();
  const uniqueResearchers = researchers.filter((researcher) => {
    if (!seenNames.has(researcher.name)) {
      seenNames.add(researcher.name);
      return true;
    }
    return false;
  });

  const existingIndex = uniqueResearchers.findIndex(
    (researcher) => researcher.name === researcherName
  );
  if (existingIndex > -1) {
    uniqueResearchers[existingIndex].data = data;
  } else {
    uniqueResearchers.push({ name: researcherName, data: data });
  }

  localStorage.setItem("Researchers", JSON.stringify(uniqueResearchers));
}

// 要素を追加する関数
function appendElements(parent, ...elements) {
  elements.forEach((element) => {
    parent.appendChild(element);
  });
}

// 「全ページを保存」ボタンを作成する関数
async function createSaveButton() {
  const saveButton = document.createElement("button");
  saveButton.textContent = "全ページを保存";
  saveButton.style.marginBottom = "10px";

  saveButton.addEventListener("click", async () => {
    // すべての研究者情報を取得して保存
    await saveAllResearchersData();
    console.log("保存処理を実行");
  });

  const targetContainer = document.querySelector("div.box1");
  if (targetContainer) {
    targetContainer.parentNode.insertBefore(saveButton, targetContainer);
  } else {
    console.error("ボタンの挿入先が見つかりません。");
  }
}

// すべての研究者情報を取得して保存する関数
async function saveAllResearchersData() {
  const targetLinks = Array.from(
    document.querySelectorAll("div.listbox_title > a, .t_105")
  ).map((element) =>
    element.tagName === "A"
      ? element.href
      : element.closest(".listbox_info1")?.querySelector("a")?.href
  );

  let allResearchersData = [];

  for (const link of targetLinks) {
    if (link) {
      try {
        const response = await fetch(link);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const researcherData = extractResearcherDetails(doc, link);
        const url = new URL(link);
        const searchParams = new URLSearchParams(url.search);
        researcherName = searchParams.get("JGLOBAL_ID");
        // コメントを取得して研究者データに追加
        const savedData = loadFromLocalStorage(researcherName) || {};
        researcherData["コメント"] = savedData["コメント"] || "";

        // タブ文字と改行文字を削除する処理を追加
        for (const key in researcherData) {
          if (typeof researcherData[key] === "string") {
            researcherData[key] = researcherData[key].replace(/[\t\n]/g, "");
          } else if (Array.isArray(researcherData[key])) {
            researcherData[key] = researcherData[key].map((item) =>
              typeof item === "string" ? item.replace(/[\t\n]/g, "") : item
            );
          }
        }

        allResearchersData.push(researcherData);
      } catch (error) {
        console.error(`リンク ${link} の取得に失敗しました:`, error);
      }
    } else {
      console.error("リンクが取得できませんでした。");
    }
  }

  // セッションストレージに保存
  sessionStorage.setItem("saving", JSON.stringify(allResearchersData));

  // コンソールにデータを出力
  console.log("保存されたデータ:", allResearchersData);
  // 1. sessionStorageからデータを取得
  //   const allResearchersData = JSON.parse(sessionStorage.getItem("saving"));

  if (!allResearchersData || allResearchersData.length === 0) {
    console.error("保存されたデータが見つかりません");
    return;
  }

  // 2. TSVのヘッダー行を作成
  const header = Object.keys(allResearchersData[0]).join("\t"); // タブで区切る

  // 3. TSVのデータ行を作成
  const tsvRows = allResearchersData.map(
    (researcher) =>
      Object.values(researcher)
        .map((value) => {
          // 配列の場合は要素を"|"で結合
          if (Array.isArray(value)) {
            return `"${value.join("|")}"`;
          } else if (typeof value === "string") {
            // 文字列の場合はエスケープ処理（タブをスペースに置き換え）
            return `"${value.replace(/"/g, '""').replace(/\t/g, " ")}"`;
          } else {
            return value;
          }
        })
        .join("\t") // タブで区切る
  );

  // 4. ヘッダー行とデータ行を結合してTSVデータを作成
  const tsvData = [header, ...tsvRows].join("\n");

  // 5. TSVデータをBlobオブジェクトに変換
  const blob = new Blob([tsvData], {
    type: "text/tab-separated-values;charset=utf-8;",
  });

  // 6. Blobオブジェクトからダウンロード用のURLを作成
  const url = URL.createObjectURL(blob);

  // 7. リンク要素を作成してダウンロードを実行
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "researchers_data.tsv"); // ダウンロードするファイル名を指定
  document.body.appendChild(link);
  link.click();

  // 8. 作成したリンク要素とURLを削除
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  if (confirm("このページのクリップを削除してもよいですか?")) {
    clickAllBtnClear();
  }
}
// すべての btn_clear をクリックする関数
function clickAllBtnClear() {
  const buttons = document.querySelectorAll("button.btn_clear");
  buttons.forEach((button) => {
    button.click();
  });
}
