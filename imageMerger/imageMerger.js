function createCanvas(width, height) {
    let canvas = document.createElement("canvas")
    let ctx = canvas.getContext("2d")
    canvas.width = width;
    canvas.height = height;
    return [canvas, ctx]
}

input.onchange = async function(event) {
    let previousCanvas = null;
    let previousCtx = null;
    let filesLoaded = 0;
    let maxWidth = 5000;
    let currWidth = 0;
    let currHeight = 0;
    let nextHeight = 0;
    for (let file of event.target.files) {
        filesLoaded += 1;
        console.log(filesLoaded + " / " + event.target.files.length)
        if (!file.name.endsWith(".png")) {
            continue;
        }
        var img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve, reject) => {
            img.onload = function() {
                resolve();
            }
        })
        if (previousCanvas == null) {
            let canvases = createCanvas(0, 0);
            previousCanvas = canvases[0];
            previousCtx = canvases[1];
            nextHeight += img.height;
        }
        if (img.width + currWidth > maxWidth) {
            currWidth = 0;
            currHeight = nextHeight;
        }
        nextHeight = Math.max(nextHeight, currHeight + img.height)
        currWidth = Math.ceil(currWidth / 16) * 16
        currHeight = Math.ceil(currHeight / 16) * 16
        let canvases2 = createCanvas(Math.max(img.width + currWidth, previousCanvas.width), nextHeight);
        let canvas = canvases2[0];
        let ctx = canvases2[1];
        if (previousCanvas.width > 0) {     
            ctx.drawImage(previousCanvas, 0, 0);
        }
        // ctx.fillStyle = "rgb(" + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + "," + Math.floor(Math.random() * 256) + ")"
        // console.log(currWidth, currHeight)
        // ctx.fillRect(currWidth, currHeight, img.width, img.height)
        ctx.drawImage(img, currWidth, currHeight);
        currWidth += img.width
        previousCanvas = canvas;
        previousCtx = ctx;
    }
    // console.log(previousCanvas.toDataURL("image/png"))
    var link = document.createElement('a');
    link.download = 'test.png';
    link.href = previousCanvas.toDataURL()
    link.click();
}