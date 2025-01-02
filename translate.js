function CSVdownload() {
	const researchers = JSON.parse(localStorage.getItem("Researchers"));
	const result = researchers.map((researcher) => researcher);

	const csvRows = [];
	csvRows.push(["name", "data"]); // ヘッダー行

	result.forEach((researcher) => {
	  const name = researcher.name;
	  const dataString = JSON.stringify(researcher.data, null, 2).replace(
		/\\t|\\n|\t|\n/g,
		""
	  ); // 整形されたJSON文字列

	  // name と dataString を結合して CSV 行を作成 (ダブルクォートで囲み、エスケープ)
	  csvRows.push([
		`"${name.replace(/"/g, '""')}"`, // name をダブルクォートで囲み、エスケープ
		`"${dataString.replace(/"/g, '""')}"`, // dataString をダブルクォートで囲み、エスケープ
	  ]);
	});

	const csvString = csvRows.join("\n"); // 行を改行で結合

	const blob = new Blob(["\ufeff" + csvString], {
	  type: "text/csv;charset=utf-8;",
	});
	const link = document.createElement("a");
	const url = URL.createObjectURL(blob);
	link.href = url;
	link.download = "localStorage.csv";
	link.style.visibility = "hidden";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
  }
