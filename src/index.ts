interface Point {
  x: number;
  y: number;
}

interface Line {
  points: Point[];
}

window.Webflow ||= [];
window.Webflow.push(() => {
  window.onload = function () {
    if ('ontouchstart' in window) {
      return;
    }

    const canvas = document.querySelector('.canvas_draw');
    const canvasContainer = document.querySelector('.canvas');
    const context = canvas.getContext('2d');
    const starDivs = document.querySelectorAll('.star-div');
    canvasContainer.style.display = 'block';
    canvasContainer.style.pointerEvents = 'none';

    // Set the canvas width and height to the size of the container element
    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;

    // Scale the canvas by the device pixel ratio
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    canvas.width *= window.devicePixelRatio;
    canvas.height *= window.devicePixelRatio;

    // Set the canvas scaling for the context
    context.scale(window.devicePixelRatio, window.devicePixelRatio);

    const colours = ['#F24B3A', '#577A3A', '#8324CE', '#919AF9', '#F77514', '#3939D3'];
    context.translate(0.5, 0.5);
    let colourIndex = 0;

    // canvasContainer.style.width = window.innerWidth + 'px';
    // canvasContainer.style.width = window.innerHeight + 'px';

    // const scale = window.devicePixelRatio;
    // canvas.width = window.innerWidth * scale;
    // canvas.height = window.innerHeight * scale;
    // context.scale(scale, scale);

    let eraserSelected = false;
    let erasable;
    const eraserRender = document.querySelector('.eraser');
    eraserRender.style.display = 'none';

    const linkBlocks = Array.from(document.getElementsByClassName('link-block'));
    //puts spans between each character for text on page so it they can be erased individually
    $('.text-erasable').each(function (index) {
      let characters = $(this).text().split('');
      let splitCharacters = $(this);
      splitCharacters.empty();
      $.each(characters, function (i, el) {
        //splitCharacters.append('<span class="letter-' + i + '">' + el + '</span>');
        splitCharacters.append('<span class="erasable">' + el + '</span>');
      });
      erasable = document.getElementsByClassName('erasable');
    });

    let lines: Line[] = [];
    let currentLine: Line;

    context.lineCap = 'round';
    context.imageSmoothingEnabled = false;
    context.mozImageSmoothingEnabled = false;

    let isDrawing = false;
    let isErasing = false;
    let lastX = 0;
    let lastY = 0;
    let timeoutId: number | undefined;

    function handleMouseDown(event) {
      event.preventDefault();
      //if erasing, delete all brush strokes on page and reset eraser
      if (isErasing) {
        isErasing = false;
        context.clearRect(0, 0, canvas.width, canvas.height);
        //erasePositions.length = 0;
        lines.length = 0;
        currentLine.points.length = 0;
      }
      //removes eraser if clicking while the eraser is pausing
      if (timeoutId !== undefined && !eraserSelected) {
        eraserRender.style.display = 'none';
      }
      clearTimeout(timeoutId);
      if (eraserSelected) return;
      isDrawing = true;
      [lastX, lastY] = [event.clientX, event.clientY];
      // reset the current line
      currentLine = { points: [{ x: lastX, y: lastY }] };
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = colours[colourIndex];
      colourIndex = (colourIndex + 1) % colours.length;
      context.lineWidth = 9;

      //to draw dots on click instead of needing to drag
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      context.beginPath();
      context.moveTo(lastX, lastY);
      context.lineTo(x, y);
      context.stroke();
    }

    function handleMouseMove(event) {
      event.preventDefault();
      if (!isDrawing || eraserSelected) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      context.beginPath();
      context.moveTo(lastX, lastY);
      context.lineTo(x, y);
      context.stroke();
      [lastX, lastY] = [x, y];
      // add a new point to the current line
      currentLine.points.push({ x, y });
    }

    function handleMouseUp() {
      if (!isDrawing || eraserSelected) return;
      isDrawing = false;
      context.closePath();
      // add the line to the list of lines to erase
      lines.push(currentLine);
      //time in between brush strokes before eraser is activated
      timeoutId = setTimeout(handleErase, 1750);
    }

    let lastTimestamp;
    let deltaLoop = 0;

    const handleErase = () => {
      // if there are no more lines left to erase, we're done, so return immediately.
      if (lines.length === 0 && currentLine.points.length === 0) {
        return;
      }
      isErasing = true;
      // display the eraser on the HTML page
      eraserRender.style.display = 'block';
      eraserRender.style.position = 'fixed';
      let lineBeingErased = lines.shift();
      if (lineBeingErased === undefined) {
        // no more lines left to erase
        eraserRender.style.display = 'none';
        return;
      }
      // set the position of the eraser to be the first point on the first line
      eraserRender.style.left = lineBeingErased.points[0].x - eraserRender.offsetWidth / 2 + 'px';
      eraserRender.style.top = lineBeingErased.points[0].y - eraserRender.offsetHeight / 2 + 'px';
      eraserRender.style.zIndex = '3';
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = 20;
      context.beginPath();
      /**
       * Recursively called with `setAnimationFrame`.
       */
      function erase(timestamp: number) {
        if (isDrawing && !eraserSelected) {
          eraserRender.style.display = 'none';
          isErasing = false;
          return;
        }
        if (lastTimestamp === undefined) {
          lastTimestamp = timestamp;
        }
        // Calculate the elapsed time since the last frame
        const elapsed = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        // Calculate the desired frame rate, in frames per second
        const frameRate = 60;
        // Calculate the desired frame duration, in milliseconds
        const frameDuration = 1000 / frameRate;
        // Calculate the desired amount of work to do each frame, based on the frame duration and the elapsed time
        const deltaTime = Math.min(elapsed / frameDuration, 1);
        deltaLoop += deltaTime;
        if (deltaLoop > 1) {
          deltaLoop = 0;
          const erasePosition = lineBeingErased?.points.shift();
          // if erasePosition is undefined, there are no more points remaining in the line to be erased.
          // wait for a set amount of time and then erase the next line.
          if (erasePosition === undefined) {
            lineBeingErased = lines.shift();
            if (lineBeingErased === undefined && !eraserSelected) {
              // no more lines left to erase
              timeoutId = setTimeout(() => {
                eraserRender.style.display = 'none';
              }, 750);
              return;
            }
            timeoutId = setTimeout(() => {
              requestAnimationFrame(erase);
            }, 500);
            return;
          }
          eraserRender.style.left = erasePosition.x - eraserRender.offsetWidth / 2 + 'px';
          eraserRender.style.top = erasePosition.y - eraserRender.offsetHeight / 2 + 'px';
          context.lineTo(erasePosition.x, erasePosition.y);
          context.stroke();
        }
        if (!eraserSelected) requestAnimationFrame(erase);
      }
      // call the erase function to kick off the animation
      window.requestAnimationFrame(function (timestamp) {
        lastTimestamp = timestamp;
        erase(timestamp);
      });
    };
    //set cursor to pencil after draw function has loaded
    document.body.style.cursor =
      ' url(https://uploads-ssl.webflow.com/633e177d0f2820c16e144992/63b63e3f6e90d840a1798c7a_pencil.png), auto';
    // if someone dragged and selected items before canvas loaded in remove the selection
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    dragEraser(eraserRender);

    function dragEraser(element) {
      let pos1 = 0;
      let pos2 = 0;
      let pos3 = 0;
      let pos4 = 0;
      element.onmousedown = dragMouseDown;

      function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        document.body.style.cursor = 'pointer';
        eraserSelected = true;
        canvasContainer.style.display = 'none';
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
      }
      function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        element.style.top = element.offsetTop - pos2 + 'px';
        element.style.left = element.offsetLeft - pos1 + 'px';
        eraserRender.style.pointerEvents = 'none';
        linkBlocks.forEach((element) => {
          element.style.zIndex = '-1';
        });
        eraseStars(e.clientX, e.clientY);
        for (let e of erasable) {
          e.addEventListener('mouseover', setOpacity);
        }
      }

      function setOpacity() {
        this.style.opacity = 0;
      }

      function closeDragElement() {
        // stop moving when mouse button is released:
        eraserSelected = false;
        document.body.style.cursor =
          ' url(https://uploads-ssl.webflow.com/633e177d0f2820c16e144992/63b63e3f6e90d840a1798c7a_pencil.png), auto';
        eraserRender.style.display = 'none';
        canvasContainer.style.display = 'block';
        for (let e of erasable) {
          e.style.opacity = 1;
          e.removeEventListener('mouseover', setOpacity);
        }
        for (let div of starDivs) {
          div.style.opacity = 1;
        }
        linkBlocks.forEach((element) => {
          element.style.zIndex = '2';
        });
        eraserRender.style.pointerEvents = 'auto';
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }
    // Detect when the mouse moves
    function eraseStars(x, y) {
      // Loop through the divs and check if the mouse is over each one
      starDivs.forEach((div) => {
        const rect = div.getBoundingClientRect();
        const mouseX = x;
        const mouseY = y;

        if (
          mouseX >= rect.left &&
          mouseX <= rect.right &&
          mouseY >= rect.top &&
          mouseY <= rect.bottom
        ) {
          div.style.opacity = 0;
        }
      });
    }
  };
});
