const UI = {
    files: (RUNTIME) => {
        const ui = document.getElementById("loaded_files")
        const template = document.getElementById("_loaded_file")
        ui.innerHTML = ""
        for (const f of RUNTIME.Files) {
            let html = template.innerHTML
            html = html.replace("$TITLE", f.name)

            if (f.validness.canRead) {
                html = html.replace("$STATUS", "OK")
            } else {
                html = html.replace("$STATUS", "NG")
            }
            html = html.replace("$TYPE", f.type)
            html = html.replace("$MORE", f.abstruct)
            if (Object.values(f.validness).every(e => e)) {
                html = html.replace("$ICON", "done")
            } else {
                html = html.replace("$ICON", "error")
            }
            ui.insertAdjacentHTML("beforeend", html)
        }
    }
}