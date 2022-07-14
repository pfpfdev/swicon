const Addon = {
    load: async () => {
        // get config json
        const config = await (await fetch("./addons/config.json")).json()
        let addons = []
        const ui = document.getElementById("loaded_addons")
        const template = document.getElementById("_loaded_addon")
        // for each addons
        Object.keys(config).forEach(key => {
            // check validness
            if (!Addon.isValidConfig(config[key])) {
                console.log("invalid config", config[key])
            }
            // add into addons list
            addons.push({ name: key, config: config[key] })
            // load js in context
            var el = document.createElement("script")
            el.src = `${config[key].path}/${config[key].entrypoint}`
            document.body.appendChild(el)

            // create UI list 
            let html = template.innerHTML
            html = html.replace("$TITLE", key)
            if ("icon" in config[key]) {
                html = html.replace("$ICON", config[key].icon)
            } else {
                html = html.replace("$ICON", "extension")
            }
            if ("description" in config[key]) {
                html = html.replace("$DESCRIPTION", config[key].description)
            } else {
                html = html.replace("$DESCRIPTION", "説明はありません")
            }
            ui.insertAdjacentHTML("beforeend", html)
        })
        return addons
    },
    isValidConfig: (config) => {
        const flags = [
            "path" in config,
            "entrypoint" in config,
            "type" in config,
        ]
        return flags.reduce((prev, cur) => prev && cur, true)
    }
}