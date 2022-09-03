console.log("relaydetail loaded")

const Relaydetail = {
    generate: async (startlist) => {
        await Relaydetail.loadConfigHTML(startlist)
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
    loadConfigHTML: async (startlist) => {
        const html = await (await fetch("./addons/relaydetail/index.html")).text()
        const excelData = {}
        for (const no in startlist) {
            if (!startlist[no].name.includes("リレー")) {
                continue
            }
            const style = `No.${no}${startlist[no].name}`
            excelData[style] = []
            for (const e of startlist[no].entries) {
                const x = {
                    "種目": style,
                    "組": e.race,
                    "レーン": e.rane,
                    "チーム": Relaydetail._encodePlayer(e.family, e.first),
                }
                for (let i = 0; i < 4; i++) {
                    const cur = i + 1
                    x[`第${cur}泳者(姓)`] = ""
                    x[`第${cur}泳者(名)`] = ""
                }
                excelData[style].push(x)
            }
        }

        Relaydetail.UI = Vue.component('relaydetail', {
            data: function () {
                return {
                }
            },
            methods: {
                excel() {
                    const data = []
                    for (const d of Object.values(excelData)) {
                        data.push(...d)
                    }
                    Relaydetail.export("泳者入力シート.xlsx", data)
                }
            },
            template: html
        })
        APP.extendUIs["relaydetail"] = Relaydetail.UI
        APP.$forceUpdate()
    },
    UI: {},
    export: async (filename, data) => {
        ExcelFile.simpleXlsx(filename, "relay", data)
    }
}

RegisterGenerator("relaydetail", Relaydetail)
