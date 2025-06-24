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
	  sessionStorage.getItem("nextPage") == "true" ? saveAllResearchersData() : null;
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
    let researcherName = link.href;
    link = link.href;
    const url = new URL(link);
    const searchParams = new URLSearchParams(url.search);
    researcherName = searchParams.get("JGLOBAL_ID");

    let listboxTitle =
      document.querySelectorAll("div.listbox_info1")[index] ||
      document.querySelectorAll("div.box1 > table > tbody > tr")[index + 1];

    if (!listboxTitle) {
      console.error(`listboxTitle が取得できませんでした (index: ${index})`);
      return;
    }

    const toggleButton = createToggleButton(index);
    const displayDiv = createDisplayDiv(researcherName);
    const detailsDiv = createDetailsContainer();
    const commentTextArea = createCommentTextArea(researcherName);

    if (link) {
      result = await fetchAndDisplayDetails(link, detailsDiv, displayDiv);
      if (result) {
        const recentYears = checkRecentYears(result);
        if (!recentYears["競争的資金等の研究課題"] && !recentYears["論文"]) {
          listboxTitle.parentElement.parentElement.remove();
        }
      }
    } else {
      console.error("リンクが取得できませんでした。");
      detailsDiv.textContent = "詳細情報の取得に失敗しました。";
    }
    // appendElements(listboxTitle, detailsDiv, commentTextArea);
  });

  await Promise.all(promises);
}

// 詳細ボタンを作成する関数
function createToggleButton(index) {
  const toggleButton = document.createElement("button");
  toggleButton.textContent = `開閉`;
  toggleButton.style.marginBottom = "10px";
  toggleButton.addEventListener("click", toggleDetails);
  return toggleButton;
}

// 詳細ボタンのクリックイベントハンドラ
function toggleDetails(event) {
  const detailsDiv = event.target.previousSibling;
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
async function fetchAndDisplayDetails(link, detailsDiv, displayDiv) {
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
    return result;
  } catch (error) {
    console.error(`リンク ${link} の取得に失敗しました:`, error);
    return (displayDiv.textContent = "詳細情報の取得に失敗しました。");
  }
}

// 研究者の詳細情報を抽出する関数
function extractResearcherDetails(doc, link) {
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
    研究キーワード: extractKeywords(doc),
    論文: extractListItemsAfterSpan(doc, "論文"),
    "講演・口頭発表等": extractListItemsAfterSpan(doc, "講演・口頭発表等"),
    学歴: extractListItemsAfterSpan(doc, "学歴"),
    学位: extractListItemsAfterSpan(doc, "学位"),
    Works: [],
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

function checkRecentYears(result) {
  const currentYear = new Date().getFullYear();
  const targetYears = [
    currentYear,
    currentYear - 1,
    currentYear - 2,
    currentYear - 3,
    currentYear - 4,
  ];
  const output = {
    競争的資金等の研究課題: false,
    論文: false,
  };

  if (
    result.競争的資金等の研究課題 &&
    result.競争的資金等の研究課題.length > 0
  ) {
    const fundingText = result.競争的資金等の研究課題.join(" ");
    output["競争的資金等の研究課題"] = targetYears.some((year) =>
      fundingText.includes(year.toString())
    );
  }

  if (result.論文 && result.論文.length > 0) {
    const paperText = result.論文.join(" ");
    output["論文"] = targetYears.some((year) =>
      paperText.includes(year.toString())
    );
  }

  return output;
}

function removeQueryStringAndFragment(url) {
  const questionIndex = url.indexOf("&");
  if (questionIndex !== -1) {
    return url.substring(0, questionIndex);
  }
  const fragmentIndex = url.indexOf("#", questionIndex);
  if (fragmentIndex !== -1) {
    return url.substring(0, fragmentIndex);
  }
  return url;
}

function extractKeywords(doc) {
  const spanElement = Array.from(
    doc.querySelectorAll("span.detail_item_title")
  ).find((span) => span.textContent.includes("研究キーワード"));

  if (!spanElement) {
    return [];
  }

  const divElement = spanElement.closest("div.indent_2line-1em");
  if (!divElement) {
    return [];
  }

  const textNodes = Array.from(divElement.childNodes)
    .filter(
      (node) =>
        node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ""
    )
    .map((node) => node.textContent.trim().replace(/[\t\n,]/g, ""));

  return textNodes;
}

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

function extractListItemsAfterSpan(doc, spanStartText) {
  const spanElement = Array.from(
    doc.querySelectorAll("span.detail_item_title")
  ).find((span) => span.textContent.trim().startsWith(spanStartText));

  if (!spanElement) {
    return [];
  }

  const brElement = spanElement.nextElementSibling;
  if (!brElement || brElement.tagName !== "BR") {
    return [];
  }

  const divElement = brElement.nextElementSibling;
  if (!divElement || divElement.tagName !== "DIV") {
    return [];
  }

  const ulElement = divElement.querySelector("ul");
  if (!ulElement) {
    return [];
  }

  return Array.from(ulElement.querySelectorAll("li")).map((li) =>
    li.textContent.trim().replace(/[\t\n]/g, "")
  );
}

function extractHrefAfterSpan(doc, spanText) {
  const spanElement = Array.from(doc.querySelectorAll("span")).find((span) =>
    span.textContent.includes(spanText)
  );

  if (!spanElement) {
    return "情報なし";
  }

  const aElement = spanElement.nextElementSibling;
  if (!aElement || aElement.tagName !== "A") {
    return "情報なし";
  }

  return aElement.href;
}

function extractTextFromDivAfterSpanAndBr(doc, spanStartText) {
  const spanElement = Array.from(
    doc.querySelectorAll("span.detail_item_title")
  ).find((span) => span.textContent.trim().startsWith(spanStartText));

  if (!spanElement) {
    return "情報なし";
  }

  const brElement = spanElement.nextElementSibling;
  if (!brElement || brElement.tagName !== "BR") {
    return "情報なし";
  }

  const divElement = brElement.nextElementSibling;
  if (!divElement || divElement.tagName !== "DIV") {
    return "情報なし";
  }

  return divElement.textContent.trim().replace(/[\t\n]/g, "");
}

function extractTextContent(doc, selector) {
  return doc.querySelector(selector)?.textContent.trim() || "情報なし";
}

function extractAffiliation(doc) {
  let affiliation =
    doc.querySelector(".js_tooltip_search")?.textContent.trim() || "情報なし";
  const aboutIndex = affiliation.indexOf("について");
  if (aboutIndex !== -1) {
    affiliation = affiliation.substring(0, aboutIndex);
  }
  return affiliation;
}

function extractJobTitle(doc) {
  const element = doc.querySelector(
    "#detail_v > div.contents > div > div.contents_in_main > div > span:nth-child(5)"
  );
  return element?.nextSibling?.textContent.trim() || "情報なし";
}

function extractListItems(doc, selector) {
  return Array.from(doc.querySelectorAll(selector)).map((item) =>
    item.textContent.trim()
  );
}

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

function displayDetails(result, detailsDiv) {
  result = {
    URL: result.URL,
    職名: result.職名,
    研究分野: result.研究分野,
    研究キーワード: result.研究キーワード,
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

function loadFromLocalStorage(researcherName) {
  const researchers = JSON.parse(localStorage.getItem("Researchers")) || [];
  const researcherData = researchers.find(
    (researcher) => researcher.name === researcherName
  );
  return researcherData ? researcherData.data : null;
}

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

function appendElements(parent, ...elements) {
  elements.forEach((element) => {
    parent.appendChild(element);
  });
}

// --------------------------------------------------
// ▼▼▼ ここからマージ＆変更されたコード ▼▼▼
// --------------------------------------------------

/**
 * 「全ページを保存」ボタンを作成する関数 (変更後)
 */
async function createSaveButton() {
  const saveButton = document.createElement("button");
  saveButton.textContent = "全ページを保存";
  saveButton.style.marginBottom = "10px";

  saveButton.addEventListener("click", async () => {
    // 処理開始時にページカウンターを初期化する
    sessionStorage.setItem('processedPageCount', '0');

    // すべての研究者情報を取得して保存
    await saveAllResearchersData();
    console.log("保存処理を開始");
  });

  const targetContainer = document.querySelector("div.box1,.contents_in_main");
  if (targetContainer) {
    targetContainer.parentNode.insertBefore(saveButton, targetContainer);
  } else {
    console.error("ボタンの挿入先が見つかりません。");
  }
}

/**
 * すべての研究者情報を取得して保存する関数 (変更後)
 */
async function saveAllResearchersData() {
  const targetLinks = Array.from(
    document.querySelectorAll("div.listbox_title > a, .t_105")
  ).map((element) =>
    element.tagName === "A"
      ? element.href
      : element.closest(".listbox_info1")?.querySelector("a")?.href
  );

  let currentPageData = []; // このページのデータのみを一時的に保持

  for (const link of targetLinks) {
    await new Promise((resolve) => setTimeout(resolve, 0));

    if (link) {
      try {
        const response = await fetch(link);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const researcherData = extractResearcherDetails(doc, link);

        // タブ文字と改行文字を削除する処理
        for (const key in researcherData) {
          if (typeof researcherData[key] === "string") {
            researcherData[key] = researcherData[key].replace(/[\t\n]/g, "");
          } else if (Array.isArray(researcherData[key])) {
            researcherData[key] = researcherData[key].map((item) =>
              typeof item === "string" ? item.replace(/[\t\n]/g, "") : item
            );
          }
        }

        currentPageData.push(researcherData);
      } catch (error) {
        console.error(`リンク ${link} の取得に失敗しました:`, error);
      }
    } else {
      console.error("リンクが取得できませんでした。");
    }
  }

  // 1. 蓄積データとページカウンターをsessionStorageから読み込む
  let processedPageCount = parseInt(sessionStorage.getItem('processedPageCount') || '0');

  // 2. ページカウンターを更新
  processedPageCount++;

  // 3. 更新されたページカウンターをsessionStorageに保存
  sessionStorage.setItem('processedPageCount', processedPageCount.toString());

  console.log(`ページ ${processedPageCount} の処理完了。`);

  const isFinalPage = checkFinalPage();

  // 4. データを送信する条件をチェック (1ページごと、または最終ページの場合)
  if (isFinalPage) {
    console.log(`最終ページです。データをバックグラウンドに送信します。`);

    if (currentPageData.length > 0) {
      // background.js にデータを送信
      chrome.runtime.sendMessage({
        action: "sendToGAS",
        data: JSON.stringify(currentPageData),
      });
      console.log('データの送信が完了しました。');
    }
  } else {
    // 最終ページでない場合は毎回送信
    console.log(`ページ ${processedPageCount} のデータをバックグラウンドに送信します。`);

    if (currentPageData.length > 0) {
      // background.js にデータを送信
      chrome.runtime.sendMessage({
        action: "sendToGAS",
        data: JSON.stringify(currentPageData),
      });
      console.log('データの送信が完了しました。');
    }
  }

  // 5. ページ遷移の処理
  if (!isFinalPage) {
    console.log("次ページに移動");
    sessionStorage.setItem("nextPage", true);
    goToNextPage();
  } else {
    console.log("最終ページです。すべての処理が完了しました。");
    alert("最終ページです");
    // 全ての処理が終わったらストレージをきれいにする
    sessionStorage.clear();
  }
}

// --------------------------------------------------
// ▲▲▲ ここまでがマージ＆変更されたコード ▲▲▲
// --------------------------------------------------


// 最終ページかどうかを判定する関数
function checkFinalPage() {
	const pagination = document.querySelector(".pagination");
	if (!pagination) {
	  console.error("Pagination element not found.");
	  return false;
	}

	const lastLi = pagination.querySelector("li:nth-last-child(1)");
	if (!lastLi) {
	  console.error("Last <li> element not found.");
	  return false;
	}

	const computedStyle = window.getComputedStyle(lastLi);
	const pointerEventsValue = computedStyle.getPropertyValue('pointer-events');

	return pointerEventsValue == 'none';
}

// ページ番号を変更してURLを更新
function goToNextPage() {
  const currentPage = getCurrentPage();
  const nextPage = currentPage + 1;
  const pageNumber = nextPage;
  const params = getSearchParams();
  if (params) {
    params.page = pageNumber;
    const newHash = encodeURIComponent(JSON.stringify(params));
    window.location.hash = newHash; // ハッシュを変更することでページ遷移
  }
}

// 現在のページ番号を取得
function getCurrentPage() {
  const params = getSearchParams();
  if (params && params.page) {
    return parseInt(params.page, 10);
  } else {
    return 1; //デフォルトは1ページ目
  }
}

// 現在のURLからハッシュフラグメントを取得し、JSONとしてパース
function getSearchParams() {
  try {
    const hash = window.location.hash.substring(1); // '#' を削除
    const decodedHash = decodeURIComponent(hash);
    return JSON.parse(decodedHash);
  } catch (error) {
    console.error("Error parsing URL hash:", error);
    return null;
  }
}
