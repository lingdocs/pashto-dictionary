function hitBottom(): boolean {
    const windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
    const body = document.body;
    const html = document.documentElement;
    const docHeight = Math.max(
      body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight,
    );
    const windowBottom = Math.round(windowHeight + window.pageYOffset);
    return (windowBottom + 3) >= docHeight;
}

export default hitBottom;