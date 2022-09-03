console.log("point loaded")

const Point = {
    parseIntOrZero: (str) => parseInt(str) || 0,
    isValid: (config, data) => {
        if (!(config.type) || config.type != "point") {
            return 0
        }
        return Point._isValid(config, data).length === 0
    },
    abstruct: (config, data) => {
        const err = Point._isValid(config, data)
        if (err.length !== 0) {
            return `${err.length}件のエラーがあります`
        }
        return `${data.input.length}件のデータを読み込み`
    },
    parse: (config, data) => {
        if (!(config.type) || config.type != "point") {
            return null
        }
        const errors = Point._isValid(config, data)
        const points = {}
        if (!("input" in data)) {
            return {
                errors: ["「input」シートがありません"]
            }
        }
        for (const e of data.input) {
            const rule = e["条件"]
            if (!(rule in points)) {
                points[rule] = {}
            }
            if (e["順位"] < 0 || isNaN(e["順位"])) {
                errors.push(`異常な値が入力されています@「${rule}：${e["順位"]}」`)
            }
            if (e["得点"] < 0 || isNaN(e["得点"])) {
                errors.push(`異常な値が入力されています@「${rule}：${e["順位"]}」`)
            }
            try {
                new RegExp(rule)
            } catch {
                errors.push(`ルールが正規表現として成立しません@「${rule}：${e["順位"]}」`)
            }
            points[rule][e["順位"]] = e["得点"]
        }
        return {
            errors, points
        }
    },
    ui: async (files) => {
        await Point.loadHTML(files)
    },
    _isValid: (config, data) => {
        let errors = []
        if (!("input" in data)) {
            errors.push("「input」シートが見つかりません")
        }
        const rows = data.input.filter(e => "種目" in e)
        for (e of rows) {
            const required = ["条件", "順位", "得点"]
            for (r of required) {
                if (!(r in e)) {
                    errors.push(`「${r}」が不足している行があります`)
                }
            }
            const mustNumber = ["順位", "得点"]
            for (r of mustNumber) {
                if (!isFinite(Point.parseIntOrZero(e[r]))) {
                    errors.push(`「${r}」が異常値です：${e[r]}`)
                }
            }
        }
        return errors
    },
    loadHTML: async (files) => {
        files = files.filter(f => f.type == "point")
        const data = files.map(f => ({
            name: f.name,
            count: f.data.points.length,
            errorCount: f.data.errors.length,
            errors: f.data.errors
        }))
        const html = await (await fetch("./addons/point/index.html")).text()
        Point.UI = Vue.component('point', {
            data: function () {
                return {
                    headers: [
                        {
                            text: 'ファイル名',
                            align: 'start',
                            sortable: false,
                            value: 'name',
                        },
                        { text: '結果数', value: 'count' },
                        { text: 'エラー数', value: 'errorCount' },
                        { text: '詳細', value: 'data-table-expand' },
                    ],
                    groups: data,
                    expanded: [],
                }
            },
            template: html
        })
        if (files.length > 0) {
            APP.extendUIs["point"] = Point.UI
            APP.$forceUpdate()
        }
    },
    UI: {}
}

RegisterParser("point", Point)