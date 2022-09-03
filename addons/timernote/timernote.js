console.log("timernote loaded")

const Timernote = {
    generate: async (startlist) => {
        await Timernote.loadConfigHTML(startlist)
    },
    _encodePlayer: (family, first) => {
        if (!first) {
            return family
        }
        return `${family}　${first}`
    },
    loadConfigHTML: async (startlist) => {
        const html = await (await fetch("./addons/timernote/index.html")).text()
        const timernote = []
        // // NaN対応のmax関数，NaNがどこからくるのか?
        // const max = (arr) => arr.reduce((cur, prev) => Math.max(cur, prev) || prev, -1)
        // // NaN対応のmax関数，NaNがどこからくるのか?
        // const min = (arr) => arr.reduce((cur, prev) => Math.min(cur, prev) || prev, 1e9)
        // const minCourse = min(Object.values(startlist).map(e => min(e.entries.map(ee => ee.rane))))
        // const maxCourse = max(Object.values(startlist).map(e => max(e.entries.map(ee => ee.rane))))
        // const races = {}
        // for (const i in startlist) {
        //     races[i] = {}
        //     for (const x of startlist[i].entries) {
        //         if (!races[i][x.race]) {
        //             races[i][x.race] = {}
        //         }
        //         races[i][x.race][x.rane] = x
        //     }
        // }
        console.log(startlist[2])
        const dig2 = (num) => ("000" + num).slice(-2)
        for (const i in startlist) {
            const entries = []
            for (const e of startlist[i].entries) {
                let timeStr = `${Math.floor(e.time / 60)}:${dig2(Math.floor(e.time % 60))}.${dig2(e.time - Math.floor(e.time))}`
                if (Math.floor(e.time / 60) == 0) {
                    timeStr = `${dig2(Math.floor(e.time % 60))}.${dig2(e.time - Math.floor(e.time))}`
                }
                entries.push({
                    class: e.class,
                    grade: e.grade,
                    race: e.race,
                    rane: e.rane,
                    style: startlist[i].name,
                    no: i,
                    group: e.group,
                    time: timeStr,
                    name: `${Timernote._encodePlayer(e.family, e.first)}／${Timernote._encodePlayer(e.family_kana, e.first_kana)}`
                })
            }
            timernote.push({
                header: {},
                children: entries
            })
        }
        Timernote.UI = Vue.component('timernote', {
            data: function () {
                return {
                }
            },
            methods: {
                pdf() {
                    Timernote.print(timernote)
                }
            },
            template: html
        })
        APP.extendUIs["timernote"] = Timernote.UI
        APP.$forceUpdate()
    },
    UI: {},
    print: async (data) => {
        const html = await (await fetch("./addons/timernote/page.html")).text()
        nwin = window.open("", "Newwindow")
        nwin.document.open()
        nwin.document.write(html)
        nwin.document.write(`<script>var data=JSON.parse('${JSON.stringify(data)}')</script>`)
        nwin.document.write(`<script>Pager.format(data, 2, true)</script>`)
        nwin.document.close()
    }
}

RegisterGenerator("timernote", Timernote)
