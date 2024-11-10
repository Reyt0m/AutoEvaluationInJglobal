// 現在の課題
// 処理状況が見えない
// ダウンロードせずに飛ばしているページがあるので、ちゃんとダウンロードまでさせたい。
// Unchecked runtime.lastError: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received
let jsInitCheckTimer;

async function executeOnFirstPage() {
  clearInterval(jsInitCheckTimer);

  jsInitCheckTimer = setInterval(() => {
    if (document.querySelector("div.listbox_title > a") != null) {
      clearInterval(jsInitCheckTimer);

      const firstPageCheck = sessionStorage.getItem("checked");

      if (!firstPageCheck && confirm("処理を開始しますか？")) {
        sessionStorage.setItem("checked", true);
        main();
      } else if (firstPageCheck) {
        main();
      }
    }
  }, 1000);
}

window.addEventListener("hashchange", executeOnFirstPage);

async function main() {
  console.log("抽出を開始します");
  const allResults = await  extract();
  console.log("CSVダウンロードを開始します");
  if (allResults.length > 0) {
    CSVdownload(allResults);
    setTimeout(navigateToNextPage, 8000); // 5秒後にページ遷移
  } else {
    console.log("抽出結果がありませんでした。");
  }
}

async function extract() {
  let allResults = [];
  let isLastPage = false;

  while (!isLastPage) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const targetLinks = Array.from(
      document.querySelectorAll("div.listbox_title > a")
    ).map((a) => a.href);

    const pageResults = await Promise.all(
      targetLinks.map(async (link) => {
        try {
          const response = await fetch(link);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const html = await response.text();
          const doc = new DOMParser().parseFromString(html, "text/html");
          return extractResearcherData(doc, link);
        } catch (error) {
          console.error(`リンク ${link} の取得に失敗しました:`, error);
          return null;
        }
      })
    );

    allResults = allResults.concat(
      pageResults.filter((result) => result !== null)
    );

  }
  return allResults;
}

function extractResearcherData(doc, link) {
  const result = {};
  result["名前"] =
    doc.querySelector(".search_detail_topbox_title")?.textContent.trim() ||
    "情報なし";
  result["URL"] = link;
  result["所属機関・部署"] =
    doc.querySelector(".js_tooltip_search")?.textContent.trim() || "情報なし";
  result["職名"] =
    doc
      .querySelector(
        "#detail_v > div.contents > div > div.contents_in_main > div > span:nth-child(5)"
      )
      ?.nextSibling?.textContent.trim() || "情報なし";
  const divElement = doc.querySelector(".indent_2line-1em");
  result["研究分野"] = Array.from(divElement?.querySelectorAll("a") || []).map(
    (a) => a.previousSibling?.textContent.trim() || ""
  );
  const keywordsDiv = doc.querySelector(
    "#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(8)"
  );
  result["研究キーワード"] = Array.from(
    keywordsDiv?.querySelectorAll("a") || []
  ).map((a) => a.previousSibling?.textContent.trim() || "");
  result["論文"] = Array.from(doc.querySelectorAll(".mdisc li")).map((item) =>
    item.textContent.trim()
  );
  result["講演・口頭発表等"] = Array.from(
    doc.querySelectorAll(
      "#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(14) > ul > li"
    )
  ).map((item) => item.textContent.trim());
  result["学歴"] = Array.from(
    doc.querySelectorAll(
      "#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(17) > ul > li"
    )
  ).map((item) => item.textContent.trim());
  result["学位"] = Array.from(
    doc.querySelectorAll(
      "#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(20) > ul > li"
    )
  ).map((item) => item.textContent.trim());
  return result;
}

function CSVdownload(results) {
  const csvRows = [];
  csvRows.push(Object.keys(results[0]));

  results.forEach((result) => {
    const row = Object.values(result).map((value) =>
      JSON.stringify(value).replace(/\\t|\\n|\t|\n/g, "")
    );
    csvRows.push(row);
  });

  const csvString = csvRows.join("\n");
  const blob = new Blob(["\ufeff" + csvString], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = "researchers.csv";
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
    console.log("「次へ」へのリンクが見つかりませんでした。処理を終了します。");
    sessionStorage.removeItem("checked");
    // alert("処理を終了しました。");
  }
}
