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
    }
}