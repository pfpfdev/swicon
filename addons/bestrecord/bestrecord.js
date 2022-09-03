console.log("bestrecord loaded")

const BestRecord = {
    parseIntOrZero: (str) => parseInt(str) || 0,
    isValid: (config, data) => {
        if (!(config.type) || config.type != "bestrecord") {
            return 0
        }
        return BestRecord._isValid(config, data).length === 0
    },
    abstruct: (config, data) => {
        const err = BestRecord._isValid(config, data)
        if (err.length !== 0) {
            return `${err.length}件のエラーがあります`
        }
        return `${data.input.length}件のデータを読み込み`
    },
    _calcTime: (min, sec, comma) => {
        const _min = parseInt(min)
        if (_min >= 60) {
            return -1
        }
        const _sec = parseInt(sec)
        if (_sec >= 60) {
            return -1
        }
        const _comma = parseInt(comma)
        if (_comma >= 100) {
            return -1
        }
        return _min * 60 + _sec + _comma * 0.01
    },
    parseTime: (timeStr) => {
        const times = `${timeStr}`.split(/[^0-9]/)
        if (times.length === 1) {
            if (timeStr.length >= 5) {
                return Result._calcTime(timeStr.slice(0, -4), timeStr.slice(-4, -2), timeStr.slice(-2))
            }
            if (timeStr.length >= 3) {
                return Result._calcTime(0, timeStr.slice(0, -2), timeStr.slice(-2))
            }
            return -1
        }
        if (times.length === 2) {
            return Result._calcTime(0, times[0], times[1])
        }
        if (times.length === 3) {
            return Result._calcTime(times[0], times[1], times[2])
        }
        return -1
    },
    parse: (config, data) => {
        if (!(config.type) || config.type != "bestrecord") {
            return null
        }
        const errors = BestRecord._isValid(config, data)
        const bestrecords = []
        if (!("input" in data)) {
            return {
                errors: ["「input」シートがありません"]
            }
        }
        for (const e of data.input) {
            const bestrecord = {
                style: e["種目"],
                time: BestRecord.parseTime(e["大会記録"]),
            }
            if (bestrecord.time === -1 || isNaN(bestrecord.time)) {
                errors.push(`異常な値が入力されています@${bestrecord.style}`)
            }
            bestrecords.push(bestrecord)
        }
        return {
            errors, bestrecords
        }
    },
    ui: async (files) => {
        await BestRecord.loadHTML(files)
    },
    _isValid: (config, data) => {
        let errors = []
        if (!("input" in data)) {
            errors.push("「input」シートが見つかりません")
        }
        const rows = data.input.filter(e => "種目" in e)
        for (e of rows) {
            const required = ["種目", "大会記録"]
            for (r of required) {
                if (!(r in e)) {
                    errors.push(`「${r}」が不足している行があります`)
                }
            }
        }
        return errors
    },
    loadHTML: async (files) => {
        files = files.filter(f => f.type == "bestrecord")
        const data = files.map(f => ({
            name: f.name,
            count: f.data.bestrecords.length,
            errorCount: f.data.errors.length,
            errors: f.data.errors
        }))
        const html = await (await fetch("./addons/bestrecord/index.html")).text()
        BestRecord.UI = Vue.component('bestrecord', {
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
            APP.extendUIs["bestrecord"] = BestRecord.UI
            APP.$forceUpdate()
        }
    },
    UI: {}
}

RegisterParser("bestrecord", BestRecord)