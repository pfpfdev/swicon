console.log("relay loaded")

const Relay = {
    parseIntOrZero: (str) => parseInt(str) || 0,
    isValid: (config, data) => {
        if (!(config.type) || config.type != "relay") {
            return 0
        }
        return Relay._isValid(config, data).length === 0
    },
    abstruct: (config, data) => {
        const err = Relay._isValid(config, data)
        if (err.length !== 0) {
            return `${err.length}件のエラーがあります`
        }
        return `${data.input.length}件のデータを読み込み`
    },
    parse: (config, data) => {
        if (!(config.type) || config.type != "relay") {
            return null
        }
        const errors = Relay._isValid(config, data)
        const relays = []
        if (!("input" in data)) {
            return {
                errors: ["「input」シートがありません"]
            }
        }
        for (const e of data.input) {
            // parse player
            const record = {
                race: e["組"],
                rane: e["レーン"],
                style: e["種目"],
                team: e["チーム"],
                players: []
            }
            for (let i = 0; i < 4; i++) {
                const cur = i + 1
                record.players.push({
                    family: e[`第${cur}泳者(姓)`],
                    first: e[`第${cur}泳者(名)`],
                })
            }
            relays.push(record)
        }
        return {
            errors, relays
        }
    },
    ui: async (files) => {
        await Relay.loadHTML(files)
    },
    _isValid: (config, data) => {
        let errors = []
        if (!("input" in data)) {
            errors.push("「input」シートが見つかりません")
        }
        const rows = data.input.filter(e => "選手名(姓)" in e)
        for (e of rows) {
            const required = ["種目", "組", "レーン", "チーム", "第1泳者(姓)", "第1泳者(名)", "第2泳者(姓)", "第2泳者(名)", "第3泳者(姓)", "第3泳者(名)", "第4泳者(姓)", "第4泳者(名)"]
            for (r of required) {
                if (!(r in e)) {
                    errors.push(`「${r}」が不足している行があります`)
                }
            }
        }
        return errors
    },
    loadHTML: async (files) => {
        files = files.filter(f => f.type == "relay")
        const data = files.map(f => ({
            name: f.name,
            count: f.data.relays.length,
            errorCount: f.data.errors.length,
            errors: f.data.errors
        }))
        const html = await (await fetch("./addons/relay/index.html")).text()
        Relay.UI = Vue.component('relay', {
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
        APP.extendUIs["relay"] = Relay.UI
        APP.$forceUpdate()
    },
    UI: {}
}

RegisterParser("relay", Relay)