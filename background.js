chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.action === "scrapeJGLOBAL") {
	  fetch(request.url)
		.then(response => response.text())
		.then(html => {
		  const parser = new DOMParser();
		  const doc = parser.parseFromString(html, 'text/html');
		  const result = {};

		  // Project Details (from popup)
		  result['Project Details'] = request.projectDetails;

		  // 所属機関・部署
		  result['所属機関・部署'] = doc.querySelector('.js_tooltip_search').textContent.trim();

		  // 職名
		  result['職名'] = doc.querySelector("#detail_v > div.contents > div > div.contents_in_main > div > span:nth-child(5)").nextSibling.textContent;

		  // 研究分野
		  const divElement = doc.querySelector('.indent_2line-1em');
		  const aElements = divElement.querySelectorAll('a');
		  result['研究分野'] = [];
		  aElements.forEach(aElement => {
			let previousNode = aElement.previousSibling;
			while (previousNode && previousNode.nodeType !== Node.TEXT_NODE) {
			  previousNode = previousNode.previousSibling;
			}
			if (previousNode) {
			  result['研究分野'].push(previousNode.textContent.trim());
			}
		  });

		  // 研究キーワード取得
		  const keywordsDiv = doc.querySelector("#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(8)");
		  const keywrodsA = keywordsDiv.querySelectorAll('a');
		  result['研究キーワード'] = [];
		  keywrodsA.forEach(aElement => {
			let previousNode = aElement.previousSibling;
			while (previousNode && previousNode.nodeType !== Node.TEXT_NODE) {
			  previousNode = previousNode.previousSibling;
			}
			if (previousNode) {
			  result['研究キーワード'].push(previousNode.textContent.trim());
			}
		  });

		  // 論文
		  result['論文'] = Array.from(doc.querySelectorAll('.mdisc li')).map(item => item.textContent.trim());

		  // 講演・口頭発表等
		  result['講演・口頭発表等'] = Array.from(doc.querySelectorAll('#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(14) > ul'))
			.map(item => item.textContent.trim());

		  // 学歴
		  result['学歴'] = Array.from(doc.querySelectorAll("#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(17) > ul"))
			.map(item => item.textContent.trim());

		  // 学位
		  result['学位'] = Array.from(doc.querySelectorAll("#detail_v > div.contents > div > div.contents_in_main > div > div:nth-child(20) > ul"))
			.map(item => item.textContent.trim());

		  // Related URLs
		  const urls = Array.from(doc.querySelectorAll("#search_v > div.contents > div > div.contents_in_main > div:nth-child(1) > div > div.listbox_title > a"))
			.map(a => a.href);
		  result['Related URLs'] = urls;

		  sendResponse(result);
		});

	  return true;
	}
  });
