class Router {
    static navigate(pageName) {
        const frame = window.parent.document.getElementById('app-viewport') || document.getElementById('app-viewport');
        if (frame) {
            frame.src = `pages/${pageName}.html`;
        } else {
            window.location.href = `${pageName}.html`;
        }
    }
}

window.Router = Router;