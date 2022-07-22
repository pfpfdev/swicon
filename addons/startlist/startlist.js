console.log("startlist loaded")

const Startlist = {
    COURSE: 5,
    generate: async (files) => {
        console.log(files)
        rules = {}
        entries = []
        errors = []
        for (f of files) {
            for (i of Object.keys(f.data.rules)) {
                if (!(i in rules)) {
                    rules[i] = f.data.rules[i]
                } else if (rules[i] !== f.data.rules[i]) {
                    errors.push(`競技内容に矛盾があります：No${i} @ ${f.name}`)
                }
            }
            entries.push(...f.data.entries)
        }
        startlist = {}
        for (i of Object.keys(rules)) {
            startlist[i] = {
                name: rules[i],
                entries: Array.from(entries.filter(e => e.no == i))
            }
            startlist[i].entries.sort((a, b) => -(a.time - b.time))
            for (let j in startlist[i].entries) {
                const order = Startlist._makeOrder(startlist[i].entries.length, parseInt(j) + 1, Startlist.COURSE)
                startlist[i].entries[j].race = order.race
                startlist[i].entries[j].rane = order.rane
            }
        }
        await Startlist.loadConfigHTML(files, errors)
        Propagate("startlist", startlist)
    },
    _makeOrder(total, index, maxCource) {
        // ほぼ魔術
        let race, rane, pos
        offset = total % maxCource
        if (index <= maxCource + offset && offset > 0 && offset < maxCource / 2) {
            if (index <= (maxCource + offset) / 2) {
                race = 1
                pos = Math.floor((maxCource + offset) / 2) - index
            } else {
                race = 2
                pos = (maxCource + offset) - index
            }
        } else {
            if (offset == 0) {
                race = Math.ceil((index - offset) / maxCource)
            } else {
                race = Math.ceil((index - offset) / maxCource) + 1
            }
            if (index <= offset) {
                pos = offset - index
            } else {
                pos = ((offset - index + 1) % maxCource) + maxCource - 1
            }
        }
        rane = Math.ceil(maxCource / 2) - 2 * (((pos + 1) % 2) - 0.5) * Math.floor((pos + 1) / 2)
        return {
            race, rane, pos
        }
    },
    loadConfigHTML: async (files, errors) => {
        const html = await (await fetch("./addons/startlist/index.html")).text()
        Startlist.UI = Vue.component('startlist', {
            data: function () {
                return {
                    headers: [
                        {
                            text: 'No',
                            align: 'start',
                            sortable: false,
                            value: 'no',
                        },
                        { text: '競技', value: 'name' },
                        { text: '参加者', value: 'participants' },
                        { text: '組数', value: 'races' },
                    ],
                    errors: errors,
                    count: Startlist.COURSE,
                    calced: Startlist.COURSE,
                }
            },
            methods: {
                regen() {
                    Startlist.COURSE = this.count
                    Startlist.generate(files)
                }
            },
            template: html
        })
        APP.extendUIs["startlist"] = Startlist.UI
        APP.$forceUpdate()
    },
    UI: {}
}

RegisterGenerator("startlist", Startlist)