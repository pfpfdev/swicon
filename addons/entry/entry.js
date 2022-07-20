console.log("entry loaded")

const Entry = {
    parseIntOrZero: (str) => parseInt(str) || 0,
    isValid: (config, data) => {
        return Entry._isValid(config, data).length === 0
    },
    abstruct: (config, data) => {
        const err = Entry._isValid(config, data)
        if (err.length !== 0) {
            return `${err.length}件のエラーがあります`
        }
        const rows = data.entry.filter(e => "選手名(姓)" in e)
        return `${rows.length}件のデータを読み込み`
    },
    parse: (config, data) => {
        const errors = Entry._isValid(config, data)
        const rules = {}
        const entries = []
        if (!("entry" in data)) {
            return {
                errors: ["「entry」シートがありません"]
            }
        }
        const rows = data.entry.filter(e => "選手名(姓)" in e)

        for (const e of rows) {
            const no = e["No."]
            const rule = e["種目"]
            // parse the rule
            if (no in rules) {
                if (rule !== rules[no]) {
                    errors.push(`Noと種目に矛盾があります`)
                    continue
                }
            } else {
                rules[no] = rule
            }
            // parse player
            if (!["正", "OP"].includes(e["区分"])) {
                errors.push(`未定義の区分が入力されています「${e["区分"]}」@No.${no}`)
                continue
            }
            entries.push({
                no: no,
                family: e["選手名(姓)"],
                last: e["選手名(名)"],
                family_kana: e["フリガナ(セイ)"],
                last_kana: e["フリガナ(メイ)"],
                class: e["区分"],
                grade: e["学年"],
                time: Entry.parseIntOrZero(e["分"]) * 60 + parseInt(e["秒"]) + Entry.parseIntOrZero(e["00"]) / 100
            })
        }
        return {
            errors, rules, entries
        }
    },
    ui: (files) => {
        Entry.loadHTML(files)
        return
        document.getElementById("entry::group_stat").innerHTML = ""
        let template = document.getElementById("entry::group_stat_tmp")
        for (const g in groups) {
            let html = template.innerHTML
            html = html.replace("$GROUP", g)
            html = html.replace("$GROUP_STAT", groups[g].length)
            document.getElementById("entry::group_stat").insertAdjacentHTML("beforeend", html)
        }
        document.getElementById("entry::warnings").innerHTML = ""
        RUNTIME.Files.forEach(f => {
            template = document.getElementById("entry::warn_tmp")
            if (f.data.errors.length > 0) {
                for (const e of f.data.errors) {
                    let html = template.innerHTML
                    html = html.replace("$MSG", `${e} @ ${f.name}`)
                    document.getElementById("entry::warnings").insertAdjacentHTML("beforeend", html)
                }
            } else {
                let html = template.innerHTML
                html = html.replace("$MSG", `正常 @ ${f.name}`)
                document.getElementById("entry::warnings").insertAdjacentHTML("beforeend", html)
            }
        })
    },
    _isValid: (config, data) => {
        let errors = []
        if (!("団体名" in config)) {
            errors.push("団体名が空欄です")
        }
        if (!("記入責任者" in config)) {
            errors.push("記入責任者が空欄です")
        }
        if (!("責任者メールアドレス" in config)) {
            errors.push("責任者メールアドレスが空欄です")
        }
        if (!("entry" in data)) {
            errors.push("「entry」シートが見つかりません")
        }
        const rows = data.entry.filter(e => "選手名(姓)" in e)
        for (e of rows) {
            const required = ["No.", "種目", "区分", "選手名(姓)", "フリガナ(セイ)", "学年", "秒"]
            for (r of required) {
                if (!(r in e)) {
                    errors.push(`「${r}」が不足している行があります`)
                }
            }
            const mustNumber = ["No.", "分", "秒", "00"]
            for (r of mustNumber) {
                if (!isFinite(Entry.parseIntOrZero(e[r]))) {
                    errors.push(`「${r}」が異常値です：${e[r]}`)
                }
            }
        }
        return errors
    },
    loadHTML: async (files) => {
        const groups = {}
        const errorMap = {}
        files.forEach(f => {
            const group = f.config["団体名"]
            if (!(group in groups)) {
                groups[group] = f.data.entries
                errorMap[group] = f.data.errors
            } else {
                groups[group].push(...f.data.entries)
                errorMap[group].push(...f.data.errors)
            }
        })
        const data = Object.keys(groups).map(e => ({
            name: e,
            count: groups[e].length,
            errorCount: errorMap[e].length,
            errors: errorMap[e]
        }))
        const html = await (await fetch("./addons/entry/index.html")).text()
        Entry.UI = Vue.component('entry', {
            data: function () {
                return {
                    headers: [
                        {
                            text: '団体名',
                            align: 'start',
                            sortable: false,
                            value: 'name',
                        },
                        { text: 'エントリー数', value: 'count' },
                        { text: 'エラー数', value: 'errorCount' },
                        { text: '詳細', value: 'data-table-expand' },
                    ],
                    groups: data,
                    expanded: [],
                }
            },
            template: html
        })
        APP.extendUIs["entry"] = Entry.UI
        APP.$forceUpdate()
    },
    UI: {}
}

RegisterParser("entry", Entry)