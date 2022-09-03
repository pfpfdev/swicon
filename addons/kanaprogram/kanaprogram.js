console.log("kanaprogram loaded")

const Kanaprogram = {
    generate: async (startlist) => {
        await Kanaprogram.loadConfigHTML(startlist)
    },
    _encodePlayer: (family, first) => {
        if (!first) {
            return family
        }
        return `${family}　${first}`
    },
    loadConfigHTML: async (startlist) => {
        const html = await (await fetch("./addons/kanaprogram/index.html")).text()
        const kanaprogram = []
        // NaN対応のmax関数，NaNがどこからくるのか?
        const max = (arr) => arr.reduce((cur, prev) => Math.max(cur, prev) || prev, -1)
        // NaN対応のmax関数，NaNがどこからくるのか?
        const min = (arr) => arr.reduce((cur, prev) => Math.min(cur, prev) || prev, 1e9)
        const minCourse = min(Object.values(startlist).map(e => min(e.entries.map(ee => ee.rane))))
        const maxCourse = max(Object.values(startlist).map(e => max(e.entries.map(ee => ee.rane))))
        const races = {}
        for (const i in startlist) {
            races[i] = {}
            for (const x of startlist[i].entries) {
                if (!races[i][x.race]) {
                    races[i][x.race] = {}
                }
                races[i][x.race][x.rane] = x
            }
        }
        for (const i in startlist) {
            const entries = []
            for (const j in races[i]) {
                const race = []
                for (let k = minCourse; k <= maxCourse; k++) {
                    const x = races[i][j][k] || {}
                    race.push({
                        race: k == 1 ? j : "", //1レーン目だけ
                        rane: k,
                        player: Kanaprogram._encodePlayer(x.family, x.first) || "",
                        kana: Kanaprogram._encodePlayer(x.family_kana, x.first_kana) || "",
                        group: x.group || "",
                        grade: x.grade || "",
                        class: x.class || "",
                    })
                }
                entries.push({ race })
            }
            kanaprogram.push({
                header: {
                    no: i,
                    name: startlist[i].name,
                },
                children: entries
            })
        }
        Kanaprogram.UI = Vue.component('kanaprogram', {
            data: function () {
                return {
                }
            },
            methods: {
                pdf() {
                    Kanaprogram.print(kanaprogram)
                }
            },
            template: html
        })
        APP.extendUIs["kanaprogram"] = Kanaprogram.UI
        APP.$forceUpdate()
    },
    UI: {},
    print: async (data) => {
        const html = await (await fetch("./addons/kanaprogram/page.html")).text()
        nwin = window.open("", "Newwindow")
        nwin.document.open()
        nwin.document.write(html)
        nwin.document.write(`<script>var data=JSON.parse('${JSON.stringify(data)}')</script>`)
        nwin.document.write(`<script>Pager.format(data, 1, false)</script>`)
        nwin.document.close()
    }
}

RegisterGenerator("kanaprogram", Kanaprogram)
