console.log("result loaded")

const Result = {
    parseIntOrZero: (str) => parseInt(str) || 0,
    isValid: (config, data) => {
        if (!(config.type) || config.type != "result") {
            return 0
        }
        return Result._isValid(config, data).length === 0
    },
    abstruct: (config, data) => {
        const err = Result._isValid(config, data)
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
        if (!(config.type) || config.type != "result") {
            return null
        }
        const errors = Result._isValid(config, data)
        const results = []
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
                player: e["氏名"],
                group: e["所属"],
                grade: e["グレード"],
                class: e["区分"],
                absent: e["棄権"] != Resultnote.CONST.JOINED,
                disqualified: e["失格"] != Resultnote.CONST.QUALIFIED,
                time: []
            }
            const distances = Object.keys(e)
                .filter(e => e.endsWith("m"))
                .map(e => parseInt(e.replace("m", "")))
                .sort((a, b) => a - b)
            const times = distances.map(d => Result.parseTime(e[`${d}m`]))
            if (!(record.absent || record.disqualified) && times.includes(-1)) {
                console.log(times)
                console.log(e)
                errors.push(`異常なタイムが入力されています@${record.style}[${record.race}組${record.rane}レーン]:${record.player}`)
            }
            const distanceStr = record.style.match(/[0-9]{2,3}m/)
            const distance = parseInt(distanceStr[0].replace("m", ""))
            const parsed = times.filter(e => e !== NaN).length
            if (parsed.length !== 8 && parsed.length < distance / 50) {
                errors.push(`入力した数が足りていません@${record.style}[${record.race}組${record.rane}レーン]:${record.player}`)
            }
            record.time = times
            results.push(record)
        }
        return {
            errors, results
        }
    },
    ui: async (files) => {
        await Result.loadHTML(files)
    },
    _isValid: (config, data) => {
        let errors = []
        if (!("input" in data)) {
            errors.push("「input」シートが見つかりません")
        }
        const rows = data.input.filter(e => "選手名(姓)" in e)
        for (e of rows) {
            const required = ["組", "種目", "氏名", "レーン", "出場", "失格なし", "50m", "100m", "150m", "200m", "250m", "300m", "350m", "400m"]
            for (r of required) {
                if (!(r in e)) {
                    errors.push(`「${r}」が不足している行があります`)
                }
            }
        }
        return errors
    },
    loadHTML: async (files) => {
        files = files.filter(f => f.type == "result")
        const data = files.map(f => ({
            name: f.name,
            count: f.data.results.length,
            errorCount: f.data.errors.length,
            errors: f.data.errors
        }))
        const html = await (await fetch("./addons/result/index.html")).text()
        Result.UI = Vue.component('result', {
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
        APP.extendUIs["result"] = Result.UI
        APP.$forceUpdate()
    },
    UI: {}
}

RegisterParser("result", Result)