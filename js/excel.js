// https://qiita.com/okoppe8/items/995b57d4e3d6d512b916



const ExcelFile = {
    sheetjs: XLSX,
    parse: (f) => {
        return new Promise((ok, ng) => {
            var reader = new FileReader();
            reader.onload = function (e) {
                try {
                    var data = e.target.result;
                    var wb;
                    var arr = ExcelFile.fixdata(data);
                    wb = ExcelFile.sheetjs.read(btoa(arr), {
                        type: 'base64',
                        cellDates: true,
                    });

                    var output = "";
                    output = ExcelFile.sheet2json(wb);
                    return ok(output)
                } catch {
                    ok(new Error("file parse error"))
                }
            };
            reader.onerror = (e) => {
                return ok(new Error("file open error"))
            }
            reader.readAsArrayBuffer(f);
        })
    },
    fixdata: (data) => {
        var o = "",
            l = 0,
            w = 10240;
        for (; l < data.byteLength / w; ++l) o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w,
            l * w + w)));
        o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
        return o;
    },
    sheet2json: (workbook) => {
        var result = {};
        workbook.SheetNames.forEach(function (sheetName) {
            var roa = ExcelFile.sheetjs.utils.sheet_to_json(
                workbook.Sheets[sheetName],
                {
                    raw: true,
                });
            if (roa.length > 0) {
                result[sheetName] = roa;
            }
        });
        return result;
    },
    kv2obj: (kvarray) => {
        let ret = {}
        if (!Array.isArray(kvarray)) {
            return ret
        }
        kvarray.forEach(e => {
            if (("key" in e) && ("value" in e)) {
                ret[e.key] = e.value
            }
        })
        return ret
    },
    export: async (filename, obj) => {
        // obj = {
        //     "sheetname": {
        //         "data": ["arr of data"],
        //         "option": [],
        //     }
        // }
        const workbook = new ExcelFile.sheetjs.utils.book_new();; // workbookを作成
        const lenStr = (str) => {
            return Array.from(`${str}`).reduce((prev, c) => {
                return prev + (c.match(/[ -~]/) ? 1 : 2)
            }, 3)// 初期値をスペースとして3空ける
        }
        for (const sheetName in obj) {
            console.log(sheetName, obj)
            const ws = ExcelFile.sheetjs.utils.json_to_sheet(obj[sheetName].data, obj[sheetName].option);
            if (obj[sheetName].data.length != 0) {
                const maxLen = {}
                for (const col in obj[sheetName].data[0]) {
                    maxLen[col] = lenStr(col)
                }
                for (const e of obj[sheetName].data) {
                    for (const col in e) {
                        const len = lenStr(e[col])
                        maxLen[col] = len < maxLen[col] ? maxLen[col] : len;
                    }
                }
                const wscols = Object.values(maxLen).map(e => ({ wch: e }))
                ws["!cols"] = wscols;
            }
            ExcelFile.sheetjs.utils.book_append_sheet(workbook, ws, sheetName);
        }
        ExcelFile.sheetjs.writeFile(workbook, filename)
    },
    simpleXlsx: (filename, type, data) => {
        ExcelFile.export(filename, {
            input: {
                data
            },
            config: {
                data: [
                    {
                        key: "type",
                        value: type,
                    },
                ]
            },
        })
    },
    test: () => {
        ExcelFile.simpleXlsx("ok.xlsx", "result", [
            {
                "種目": "男子100m自由形",
                "組": 1,
                "レーン": 3,
                "氏名": "あいうえいかきく",
                "50m": "",
                "50m": "",
                "50m": "",
                "50m": "",
                "50m": "",
                "50m": "",
                "50m": "",
                "50m": "",
                "棄権": "",
                "失格": "",
            },
        ])
    }
}
