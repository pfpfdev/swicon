console.log("ranking loaded")

const Ranking = {
    RUNTIME: {
    },
    generate: async (files) => {
        const types = ["result", "relay", "bestrecord", "point"]
        for (const t of types) {
            let v = files.filter(f => f.type == t) || []
            if (v.length != 0) {
                Ranking.RUNTIME[t] = v
            }
            if (!Ranking.RUNTIME[t]) {
                Ranking.RUNTIME[t] = []
            }
        }
        await Ranking.loadConfigHTML(Ranking.RUNTIME)
    },
    _encodeTime: (t) => {
        const mins = Math.floor(t / 60)
        const sec = Math.floor((t % 60))
        const comma = Math.round((t * 100)) % 100
        if (mins == 0) {
            const format = "SS.ss"
            return format
                .replace("SS", sec)
                .replace("ss", ("00" + comma).slice(-2))
        }
        const format = "MM:SS.ss"
        return format
            .replace("MM", mins)
            .replace("SS", ("00" + sec).slice(-2))
            .replace("ss", ("00" + comma).slice(-2))
    },
    _fillTable: (arr) => {
        const TOTAL = 8
        const ret = ",".repeat(TOTAL - 1).split(",")
        return ret.concat(arr).slice(-8)
    },
    _fillRelayTable: (arr) => {
        const TOTAL = 8
        const ret = ",".repeat(TOTAL - 1).split(",")
        const inc = TOTAL / arr.length
        for (i = 0; i < arr.length; i++) {
            ret[inc * (i + 1) - 1] = arr[i]
        }
        return ret
    },
    _encodePlayer: (family, first) => {
        if (!first) {
            return family
        }
        if (family.length + first.length <= 4) {
            return `${family}　${first}`
        }
        return `${family}${first}`
    },
    relayDetailHash: (style, race, rane, team) => `${style}::${rane}::${race}::${team}`,
    loadConfigHTML: async (files) => {
        const html = await (await fetch("./addons/ranking/index.html")).text()
        const relayDetail = {}
        for (const f of files.relay) {
            for (const e of f.data.relays) {
                const team = []
                for (const x of e.players) {
                    team.push(Ranking._encodePlayer(x.family, x.first))
                    team.push('')
                }
                relayDetail[Ranking.relayDetailHash(e.style, e.race, e.rane, e.team)] = team
            }
        }
        const bestRecords = {}
        for (const f of files.bestrecord) {
            for (const e of f.data.bestrecords) {
                bestRecords[e.style] = e.time
            }
        }
        const pointRules = {}
        for (const f of files.point) {
            for (const e in f.data.points) {
                pointRules[e] = f.data.points[e]
            }
        }
        const results = []
        for (const f of files.result) {
            for (const e of f.data.results) {
                results.push(e)
            }
        }
        const groups = Array.from(new Set(results.map(e => e.group)))
        const tmp = {}
        for (const e of results) {
            if (!tmp[e.style]) {
                tmp[e.style] = []
            }
            let relay = null
            if (e.style.includes("リレー") && Object.keys(relayDetail).length != 0) {
                relay = relayDetail[Ranking.relayDetailHash(e.style, e.rane, e.rane, e.player)]
            }
            if (e.absent) {
                tmp[e.style].push({
                    ranking: "棄権",
                    race: e.race,
                    rane: e.rane,
                    player: e.player,
                    group: e.group,
                    grade: e.grade,
                    class: e.class,
                    time: Ranking._fillTable([]),
                    result: "ー",
                    resultSec: 3e9, // 失格よりも遅くする
                    info: "",
                    point: "",
                })
                continue
            }
            if (e.disqualified) {
                tmp[e.style].push({
                    ranking: "失格",
                    race: e.race,
                    rane: e.rane,
                    player: e.player,
                    group: e.group,
                    grade: e.grade,
                    class: e.class,
                    time: Ranking._fillTable([]),
                    result: "ー",
                    relay: relay,
                    resultSec: 2e9,
                    info: "",
                    point: "",

                })
                continue
            }
            const secs = e.time.filter(e => !isNaN(e))
            let time = Ranking._fillTable(secs.map(e => Ranking._encodeTime(e)))
            const result = time.slice(-1)[0]
            if (e.style.includes("リレー") && Object.keys(relayDetail).length != 0) {
                const distanceStr = e.style.match(/[0-9]{2,3}m/) || ["400m"]
                const distance = parseInt(distanceStr[0].replace("m", ""))
                const increment = Math.min(distance / 4 / 50, 2)
                for (let i = 0; i < 4; i++) {
                    if (i == 0) {
                        relay[2 * i + 1] = Ranking._encodeTime(secs[increment * (i + 1) - 1])
                    } else {
                        relay[2 * i + 1] = Ranking._encodeTime(secs[increment * (i + 1) - 1] - secs[increment * (i) - 1])
                    }
                }
                time = Ranking._fillRelayTable(secs.map(e => Ranking._encodeTime(e)))
            }
            time[time.length - 1] = ""
            if (e.class != "正") {
                tmp[e.style].push({
                    ranking: e.class,
                    race: e.race,
                    rane: e.rane,
                    player: e.player,
                    group: e.group,
                    grade: e.grade,
                    class: e.class,
                    time: time,
                    result: result,
                    relay: relay,
                    resultSec: 1e9 + secs.slice(-1)[0], //sortはしたい
                    info: "",
                    point: "",

                })
                continue
            }
            tmp[e.style].push({
                ranking: 0,
                race: e.race,
                rane: e.rane,
                player: e.player,
                group: e.group,
                grade: e.grade,
                class: e.class,
                result: result,
                relay: relay,
                resultSec: secs.slice(-1)[0],
                time: time,
                info: "",
                point: "",
            })

        }
        for (const key of Object.keys(tmp)) {
            tmp[key] = tmp[key].sort((a, b) => a.resultSec - b.resultSec)
            tmp[key].forEach((_, i) => {
                if (tmp[key][i].ranking != 0) {
                    return
                }
                if (i > 1 && tmp[key][i].resultSec == tmp[key][i - 1].resultSec) {
                    tmp[key][i].ranking = ""
                    return
                }
                tmp[key][i].ranking = `${i + 1}`
            })
        }
        const scoreLog = []
        for (const key of Object.keys(tmp)) {
            for (const s of Object.keys(pointRules)) {
                const re = new RegExp(s)
                console.log(key, s)
                if (!key.match(re)) {
                    continue
                }
                console.log(s)
                const points = pointRules[s]
                for (const i in tmp[key]) {
                    //同率があるのでちょっと面倒
                    const ranking = tmp[key][i].ranking == "" ? tmp[key][i - 1].ranking : tmp[key][i].ranking
                    if (ranking in points) {
                        tmp[key][i].point = points[ranking]
                        scoreLog.push({
                            key,
                            group: tmp[key][i].group,
                            point: points[ranking]
                        })
                    }
                }
                break
            }
        }
        const score = []
        for (const g of groups) {
            const sum = (arr) => arr.reduce((prev, cur) => prev + cur, 0)
            const target = scoreLog.filter(e => e.group == g)
            const log = []
            for (const key of Object.keys(tmp)) {
                const diff = sum(target.filter(e => e.key == key).map(e => e.point))
                log.push({
                    sum: (log.slice(-1)[0] || { sum: 0 }).sum + diff,
                    diff: diff
                })
            }
            score.push({
                group: g,
                total: sum(target.map(e => e.point)),
                log: log,
            })
        }
        const ranking = []
        for (const key of Object.keys(tmp)) {
            let record = ""
            let recordTime = -1
            for (const s of Object.keys(bestRecords)) {
                if (key.includes(s)) {
                    record = "大会記録 : " + Ranking._encodeTime(bestRecords[s])
                    recordTime = bestRecords[s]
                    break
                }
            }
            tmp[key].forEach((_, i) => {
                if (tmp[key][i].class == "正" && tmp[key][i].resultSec < recordTime) {
                    tmp[key][i].info = "大会新"
                }
            })
            ranking.push({
                header: {
                    style: key,
                    bestrecord: record,
                },
                children: tmp[key]
            })
        }
        Ranking.UI = Vue.component('ranking', {
            data: function () {
                return {
                    results,
                    ranking,
                    title: "大会速報",
                    scoring: Object.keys(bestRecords).length > 0,
                    headers: [
                        {
                            text: '団体名',
                            align: 'start',
                            sortable: true,
                            value: 'group',
                        },
                        { text: '総得点', value: 'total', sortable: true, },
                        { text: '詳細', value: 'data-table-expand' },
                    ],
                    score: score,
                    expanded: [],
                    style: Object.keys(tmp)
                }
            },
            methods: {
                pdf() {
                    for (const i in ranking) {
                        ranking[i].header.title = this.title
                    }
                    Ranking.print(ranking)
                }
            },
            template: html
        })
        APP.extendUIs["ranking"] = Ranking.UI
        APP.$forceUpdate()

    },
    UI: {},
    print: async (data) => {
        const html = await (await fetch("./addons/ranking/page.html")).text()
        nwin = window.open("", "Newwindow")
        nwin.document.open()
        nwin.document.write(html)
        nwin.document.write(`<script>var data=JSON.parse('${JSON.stringify(data)}')</script>`)
        nwin.document.write(`<script>Pager.format(data, 1, false, true)</script>`)
        nwin.document.close()
    }
}

RegisterGenerator("ranking", Ranking)
