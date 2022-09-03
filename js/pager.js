
const Pager = {
    format: (data, colNum, doCentering, uniqPage = false) => {
        const headerTemplate = document.getElementById("pager-header")
        const unitTemplate = document.getElementById("pager-unit")
        let columns = []
        let column = Pager.createColumn(colNum, 0)
        const pageSize = Pager.getPageSize(doCentering)
        for (const e of data) {
            const header = Pager.createFromHTML(
                Pager.setPlaceholders(headerTemplate, e.header)
            )[0]
            console.log(header)
            const headerSize = Pager.getSize(header)
            let needHeader = true
            for (const d of e.children) {
                const unit = Pager.createFromHTML(
                    Pager.setPlaceholders(unitTemplate.cloneNode(true), d)
                )[0]
                const columnSize = Pager.getSize(column)
                const unitSize = Pager.getSize(unit)
                let isNewPage = false
                let isNewColumn = false
                if (needHeader) {
                    isNewColumn = pageSize.height <= columnSize.height + unitSize.height + headerSize.height
                } else {
                    isNewColumn = pageSize.height <= columnSize.height + unitSize.height
                }
                if (isNewColumn) {
                    columns.push(column.cloneNode(true))
                    column = Pager.createColumn(colNum, columns.length % colNum)
                    needHeader = true
                }
                isNewPage = isNewColumn && columns.length === colNum
                if (isNewPage) {
                    Pager.addPage(columns, doCentering)
                    columns = []
                }
                if (needHeader) {
                    column.appendChild(header.cloneNode(true))
                    needHeader = false
                }
                column.appendChild(unit)
            }
            console.log(Array.from(column.childNodes))
            //TODO 処理が決定的に怪しいので，後で直すこと
            if (uniqPage && Array.from(column.childNodes).length !== 0) {
                columns.push(column.cloneNode(true))
                Pager.addPage(columns, doCentering)
                columns = []
                column = Pager.createColumn(colNum, columns.length % colNum)
            }
        }
        columns.push(column.cloneNode(true))
        console.log(columns)
        while (columns.length % colNum != 0) {
            columns.push(Pager.createColumn(colNum, columns.length))
        }
        if (columns.length != 0) {
            Pager.addPage(columns, doCentering)
        }
    },
    getSize: (elm) => {
        const content = document.createElement("div")
        content.appendChild(elm)
        document.body.appendChild(content)
        const height = content.scrollHeight
        const width = content.scrollWidth
        document.body.removeChild(content)
        return { height, width }
    },
    addPage: (elms, doCentering) => {
        const grid = document.createElement("div")
        grid.classList.add("page-grid")
        if (Array.isArray(elms)) {
            elms.forEach(e => grid.appendChild(e))
        } else {
            grid.appendChild(elms)
        }
        const page = document.createElement("div")
        page.classList.add("page")
        page.appendChild(grid)
        document.body.appendChild(page)
        if (page.scrollHeight < grid.height || page.scrollWidth < grid.height) {
            console.log("overflow detected")
        }
        if (doCentering) {
            page.style.padding = "0px"
            grid.style.marginTop = `${page.scrollHeight / 2 - grid.scrollHeight / 2}px`
            grid.style.marginLeft = `${page.scrollWidth / 2 - grid.scrollWidth / 2}px`
        }
    },
    createColumn: (colNum, colIndex) => {
        const column = document.createElement("div")
        column.classList.add("page-column")
        column.classList.add(`col-${colIndex}`)
        column.style.width = `${210 / colNum}mm`
        return column
    },
    createFromHTML: (html) => {
        const template = document.createElement('template');
        template.innerHTML = html.replace(/[\r\n]/g, "").replace(/ {2,}/, " ").trim();
        return Array.from(template.content.childNodes)
    },
    setPlaceholders: (elm, obj) => {
        const keysArr = Object.keys(obj).filter(e => Array.isArray(obj[e]))
        for (const key of keysArr) {
            const template = elm.content.getElementById(`pager-for:${key}`)
            const newElm = template.parentNode
            for (const x of obj[key].reverse()) {
                const html = Pager.setPlaceholders(template.cloneNode(true), x)
                const nodes = Pager.createFromHTML(html)
                for (const node of nodes) {
                    newElm.insertBefore(node, template.nextSibling)
                }
            }
        }
        let html = elm.innerHTML
        if (typeof obj !== 'object') {
            html = html.replaceAll(/\{\{.*?\}\}/g, obj)
            return html
        }
        for (const key in obj) {
            if (keysArr.includes(key)) {
                continue
            }
            html = html.replaceAll(`{{${key}}}`, `${obj[key]}`)
        }
        return html
    },
    getPageSize: (isCentering = false) => {
        const page = document.createElement("div")
        page.classList.add("page")
        document.body.appendChild(page)
        const css = window.getComputedStyle(page);
        const padding = parseFloat(css.padding)
        const height = isCentering ? page.scrollHeight : page.scrollHeight - padding * 2
        const width = isCentering ? page.scrollWidth : page.scrollWidth - padding * 2
        document.body.removeChild(page)
        return { height, width }
    }
}