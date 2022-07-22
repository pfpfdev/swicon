
const Pager = {
    format: (data, colNum, doCentering) => {
        const headerTemplate = document.getElementById("pager-header")
        const unitTemplate = document.getElementById("pager-unit")
        let columns = []
        let column = Pager.createColumn()
        const pageSize = Pager.getPageSize()
        for (const e of data) {
            const header = Pager.createFromHTML(
                Pager.setPlaceholders(headerTemplate.innerHTML, e.header)
            )
            console.log(headerTemplate.innerHTML,)
            const headerSize = Pager.getSize(header)
            let needHeader = true
            for (const d of e.children) {
                const unit = Pager.createFromHTML(
                    Pager.setPlaceholders(unitTemplate.innerHTML, d)
                )
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
                    column = Pager.createColumn()
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
        }
        columns.push(column.cloneNode(true))
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
    createColumn: (elm) => {
        const column = document.createElement("div")
        column.classList.add("page-column")
        if (elm) {
            column.appendChild(elm)
        }
        return column
    },
    createFromHTML: (html) => {
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        return div.firstChild;
    },
    setPlaceholders: (html, obj) => {
        for (const key in obj) {
            html = html.replaceAll(`{{${key}}}`, `${obj[key]}`)
        }
        return html
    },
    getPageSize: () => {
        const page = document.createElement("div")
        page.classList.add("page")
        document.body.appendChild(page)
        const css = window.getComputedStyle(page);
        const padding = parseFloat(css.padding)
        const height = page.scrollHeight - padding * 2
        const width = page.scrollWidth - padding * 2
        document.body.removeChild(page)
        return { height, width }
    }
}