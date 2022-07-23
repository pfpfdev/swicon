console.log("playerlist loaded")

const Playerlist = {
    generate: async (files) => {
        await Playerlist.loadConfigHTML(files)
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
    _encodePlayerName: (entry) => {
        return `${entry.family}${entry.first}::${entry.family_kana}${entry.first_kana}::${entry.grade}`
    },
    loadConfigHTML: async (files) => {
        const list = []
        for (const x of Object.values(files)) {
            const players = {}
            for (const y of x.data.entries) {
                const hash = Playerlist._encodePlayerName(y)
                if (!players[hash]) {
                    players[hash] = {
                        name: Playerlist._encodePlayer(y.family, y.first),
                        grade: y.grade,
                        kana: y.family_kana,
                        races: 0
                    }
                }
                players[hash].races++
            }
            const playerlist = Object.values(players)
                .sort((a, b) => a.kana.localeCompare(b.kana, "jp"))
                .sort((a, b) => a.grade.localeCompare(b.grade, "jp"))
            list.push({
                header: {
                    name: x.config["団体名"],
                    players: playerlist.length
                },
                children: playerlist 
            })
        }
        const html = await (await fetch("./addons/playerlist/index.html")).text()
        Playerlist.UI = Vue.component('playerlist', {
            data: function () {
                return {
                }
            },
            methods: {
                pdf() {
                    Playerlist.print(list)
                }
            },
            template: html
        })
        APP.extendUIs["playerlist"] = Playerlist.UI
        APP.$forceUpdate()
    },
    UI: {},
    print: async (data) => {
        const html = await (await fetch("./addons/playerlist/page.html")).text()
        nwin = window.open("", "Newwindow")
        nwin.document.open()
        nwin.document.write(html)
        nwin.document.write(`<script>var data=JSON.parse('${JSON.stringify(data)}')</script>`)
        nwin.document.write(`<script>Pager.format(data, 3, false)</script>`)
        nwin.document.close()
    }
}

RegisterGenerator("playerlist", Playerlist)
