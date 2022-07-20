const Addon = {
    load: async () => {
        // get config json
        const config = await (await fetch("./addons/config.json")).json()
        let addons = []
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