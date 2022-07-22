console.log("timetable loaded")

const Timetable = {
    config: {
        beginAt: "9:30",
        interval: 30,
        rests: {}
    },
    generate: async (startlist) => {
        await Timetable.loadConfigHTML(startlist)
    },
    _str2Time: (timeStr) => {
        const ret = new Date()
        // TODO:異常値チェック
        const args = timeStr.split(":")
        ret.setHours(args[0])
        ret.setMinutes(args[1])
        return ret
    },
    _time2Str: (time) => {
        const format = "hh:mm"
        return format
            .replace("hh", ("00" + time.getHours()).slice(-2))
            .replace("mm", ("00" + time.getMinutes()).slice(-2))
    },
    loadConfigHTML: async (startlist) => {
        const html = await (await fetch("./addons/timetable/index.html")).text()
        const program = []
        let startAt = Timetable._str2Time(Timetable.config.beginAt)
        for (const i in startlist) {
            const races = startlist[i].entries.map(e => parseFloat(e.race)).slice(-1)[0]
            let time = 0
            for (let j = 1; j <= races; j++) {
                const race = startlist[i].entries.filter(e => e.race == j)
                // NaN対応のmax関数，NaNがどこからくるのか?
                const max = (arr) => arr.reduce((cur, prev) => Math.max(cur, prev) || prev, -1)
                time += max(race.map(e => e.time)) + Timetable.config.interval
            }
            let endAt = new Date(startAt.getTime() + 1000 * time)
            program.push({
                no: i,
                name: startlist[i].name,
                participants: startlist[i].entries.length,
                races: races,
                startAt: Timetable._time2Str(startAt),
                endAt: Timetable._time2Str(endAt),
            })
            startAt = endAt
            if (i in Timetable.config.rests) {
                const rest = Timetable.config.rests[i]
                endAt = new Date(startAt.getTime() + 1000 * 60 * rest.interval)
                program.push({
                    restAfter: rest.after,
                    no: "",
                    name: rest.name,
                    participants: "",
                    races: "",
                    startAt: Timetable._time2Str(startAt),
                    endAt: Timetable._time2Str(endAt),
                })
                startAt = endAt
            }
        }
        Timetable.UI = Vue.component('timetable', {
            data: function () {
                return {
                    program: program,
                    time: Timetable.config.beginAt,
                    menu2: false,
                    modal2: false,
                    interval: Timetable.config.interval,
                    restName: '休憩',
                    restInterval: 10,
                    restAfter: 1,
                    rests: Timetable.config.rests,
                }
            },
            methods: {
                regen() {
                    Timetable.config = {
                        beginAt: this.time,
                        interval: this.interval,
                        rests: this.rests
                    }
                    Timetable.generate(startlist)
                },
                addRest() {
                    if (this.restAfter in startlist) {
                        this.rests[this.restAfter] = {
                            after: this.restAfter,
                            interval: this.restInterval,
                            name: this.restName,
                        }
                        this.regen()
                    } else {
                        alert("No.XXの後が異常値です")
                    }
                },
                delRest(after) {
                    delete this.rests[after]
                    this.regen()
                },
                pdf() {
                    const data = [
                        {
                            header: {
                                title: "タイムテーブル"
                            },
                            children: this.program
                        }
                    ]
                    Timetable.print(data)
                }
            },
            template: html
        })
        APP.extendUIs["timetable"] = Timetable.UI
        APP.$forceUpdate()
    },
    UI: {},
    print: async (data) => {
        const html = await (await fetch("./addons/timetable/page.html")).text()
        nwin = window.open("", "Newwindow")
        nwin.document.open()
        nwin.document.write(html)
        nwin.document.write(`<script>var data=JSON.parse('${JSON.stringify(data)}')</script>`)
        nwin.document.write(`<script>console.log(data)</script>`)
        nwin.document.write(`<script>Pager.format(data, 1, true)</script>`)
        nwin.document.close()
    }
}

RegisterGenerator("timetable", Timetable)
