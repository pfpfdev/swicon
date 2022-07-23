const InitializeRUNTIME = () => {
    return {
        Files: [],
        Parser: {},
        Generator: {},
        Register: [],
        Addons: [],
    }
}
var RUNTIME = InitializeRUNTIME()

const BaseParser = {
    isValid: (config, data) => {
        return true
    },
    abstruct: (data) => {
        return ""
    },
    parse: (config, data) => {
        return {}
    },
    ui: (RUNTIME) => {
        return
    }
}

const RegisterParser = (key, parser) => {
    for (const fn in BaseParser) {
        if (!(fn in parser)) {
            console.log(`ignored: invalid parser(${fn} not found in ${key})`)
        }
    }
    RUNTIME.Parser[key] = parser
}

const Parse = (RUNTIME, fileinfo, data) => {
    const config = ExcelFile.kv2obj(data.config)
    if (data instanceof Error) {
        return {
            name: fileinfo.name,
            config: {},
            type: "",
            validness: {
                canRead: false,
                hasConfig: false,
                hasType: false,
                typeDefined: false,
                canParse: false,
            },
            data: {},
            abstruct: data.message
        }
    }
    const parser = config.type in RUNTIME.Parser ? RUNTIME.Parser[config.type] : BaseParser
    return {
        name: fileinfo.name,
        config: config,
        type: config.type,
        validness: {
            canRead: true,
            hasConfig: "config" in data,
            hasType: "type" in config,
            typeDefined: config.type in RUNTIME.Parser,
            canParse: parser.isValid(config, data)
        },
        data: parser.parse(config, data),
        abstruct: parser.abstruct(config, data)
    }
}

const BaseGenerator = {
    generate: (RUNTIME) => {
        return
    }
}

const RegisterGenerator = (key, generator) => {
    for (const fn in BaseGenerator) {
        if (!(fn in generator)) {
            console.log(`ignored: invalid parser(${fn} not found in ${key})`)
        }
    }
    RUNTIME.Generator[key] = generator
}

const Generate = (RUNTIME) => {
    for (const p of Object.values(RUNTIME.Generator)) {
        p.generate(RUNTIME.Files)
    }
}

const Propagate = (from, data) => {
    const afters = RUNTIME.Addons.filter(e => "chain" in e.config && e.config.chain.includes(from))
    for (const after of afters) {
        if (RUNTIME.Generator[after.name]) {
            RUNTIME.Generator[after.name].generate(data)
        }
    }
}