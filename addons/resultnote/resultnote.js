console.log("resultnote loaded")

const Resultnote = {
    CONST: {
        JOINED: "出場",
        QUALIFIED: "違反なし",
    },
    generate: async (startlist) => {
        await Resultnote.loadConfigHTML(startlist)
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
        const html = await (await fetch("./addons/resultnote/index.html")).text()
        console.log(startlist)
        const excelData = {}
        for (const no in startlist) {
            const style = `No.${no} ${startlist[no].name}`
            const distanceStr = startlist[no].name.match(/[0-9]{2,3}m/) || ["400m"]
            const distance = parseInt(distanceStr[0].replace("m", ""))
            excelData[style] = []
            for (const e of startlist[no].entries) {
                const x = {
                    "種目": style,
                    "組": e.race,
                    "レーン": e.rane,
                    "氏名": Resultnote._encodePlayer(e.family, e.first),
                    "所属": e.group,
                    "グレード": e.grade,
                    "区分": e.class
                }
                for (let i = 0; i < 8; i++) {
                    const cur = (i + 1) * 50
                    x[`${cur}m`] = cur > distance ? "ー" : ""
                }
                x["棄権"] = Resultnote.CONST.JOINED
                x["失格"] = Resultnote.CONST.QUALIFIED
                excelData[style].push(x)
            }
        }
        Resultnote.UI = Vue.component('resultnote', {
            data: function () {
                return {
                    oneFile: true,
                }
            },
            methods: {
                excel() {
                    if (this.oneFile) {
                        const data = []
                        for (const d of Object.values(excelData)) {
                            data.push(...d)
                        }
                        Resultnote.export("タイム入力シート.xlsx", data)
                    } else {
                        for (const style of Object.keys(excelData)) {
                            Resultnote.export(`タイム入力シート-${style}.xlsx`, excelData[style])
                        }
                    }
                }
            },
            template: html
        })
        APP.extendUIs["resultnote"] = Resultnote.UI
        APP.$forceUpdate()
    },
    UI: {},
    export: async (filename, data) => {
        ExcelFile.simpleXlsx(filename, "result", data)
    }
}

RegisterGenerator("resultnote", Resultnote)
