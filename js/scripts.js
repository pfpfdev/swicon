const InitializeRUNTIME = () => {
    return {
        Files: [],
        Parser: [],
        Register: [],
        Addons: [],
        Parsed: {}
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
    parse: (data) => {
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
        data: parser.parse(data),
        abstruct: parser.abstruct(config, data)
    }
}

const RegisterGenerator = (generator) => {
    RUNTIME.Generator.push(generator)
}