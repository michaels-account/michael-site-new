import { greetUser } from '$utils/greet';

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
    canvasContainer.style.display = 'block';

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const context = canvas.getContext('2d');
    const colours = ['#F94432', '#8C8C54', '#8324CE', '#919AF9', '#F77514', '#3939D3'];
    let colourIndex = 0;

    let eraserSelected = false;
    let erasable;
    const eraserRender = document.querySelector('.eraser');

    const linkBlocks = Array.from(document.getElementsByClassName('link-block'));

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

    let erasePositions = [];
    let lines: Line[] = [];
    let currentLine: Line;
    let lastErasePosition = { x: 0, y: 0 }; //TO CHANGE

    context.lineCap = 'round';

    let isDrawing = false;
    let isErasing = false;
    let lastX = 0;
    let lastY = 0;
    let timeoutId: number | undefined;

    function handleMouseDown(event) {
      event.preventDefault();
      if (isErasing) {
        isErasing = false;
        context.clearRect(0, 0, canvas.width, canvas.height);
        erasePositions.length = 0;
      }
      isDrawing = true;
      [lastX, lastY] = [event.clientX, event.clientY];
      erasePositions.push({
        x: lastX,
        y: lastY,
      });
      // reset the current line
      currentLine = { points: [{ x: lastX, y: lastY }] };

      if (eraserSelected) return;
      clearTimeout(timeoutId);
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = colours[colourIndex];
      colourIndex = (colourIndex + 1) % colours.length;
      context.lineWidth = 10;

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
      erasePositions.push({
        x: lastX,
        y: lastY,
      });
    }

    function handleMouseUp() {
      isDrawing = false;
      context.closePath();
      // add the line to the list of lines to erase
      lines.push(currentLine);
      console.log({ lines });

      timeoutId = setTimeout(handleErase, 3000);
    }

    const deltaTime = 1000 / 20;
    let lastTimestamp = 0;

    const handleErase = () => {
      // if there are no more lines left to erase, we're done, so return immediately.
      if (lines.length <= 0) return;
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
      context.lineWidth = 75;
      context.beginPath();

      /**
       * Recursively called with `setAnimationFrame`.
       */
      function erase(timestamp: number) {
        console.log({ lineBeingErased });
        if (isDrawing && !eraserSelected) {
          eraserRender.style.display = 'none';
          isErasing = false;
          return;
        }
        const elapsed = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        //if (elapsed > deltaTime) {
        const erasePosition = lineBeingErased?.points.shift();
        // if erasePosition is undefined, there are no more points remaining in the line to be erased.
        // wait for 2 seconds and then erase the next line.
        if (erasePosition === undefined) {
          lineBeingErased = lines.shift();
          if (lineBeingErased === undefined) {
            // no more lines left to erase
            eraserRender.style.display = 'none';
            return;
          }
          console.log('finishedline');
          timeoutId = setTimeout(() => {
            requestAnimationFrame(erase);
          }, 2000);
          // lastErasePosition = erasePosition;
          return;
        }

        // const distanceErasePositionX = Math.abs(erasePosition.x - lastErasePosition.x);
        // const distanceErasePositionY = Math.abs(erasePosition.y - lastErasePosition.y);
        // const averageDistance = (distanceErasePositionX + distanceErasePositionY) / 2;
        // if (averageDistance >= 100) {
        //   console.log('average distance > 100');
        //   timeoutId = setTimeout(() => {
        //     requestAnimationFrame(erase);
        //   }, 2000);
        //   lastErasePosition = erasePosition;
        //   return;
        // }
        eraserRender.style.left = erasePosition.x - eraserRender.offsetWidth / 2 + 'px';
        eraserRender.style.top = erasePosition.y - eraserRender.offsetHeight / 2 + 'px';
        context.lineTo(erasePosition.x, erasePosition.y);
        context.stroke();
        lastErasePosition = erasePosition;
        //}
        if (!eraserSelected) requestAnimationFrame(erase);
      }
      // call the erase function to kick off the animation
      requestAnimationFrame(function (timestamp) {
        lastTimestamp = timestamp;
        erase(timestamp);
      });
    };

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
        eraserRender.style.zIndex = '-1'; //needs to be under for mouseover to affect spans and images
        linkBlocks.forEach((element) => {
          element.style.zIndex = '-1';
        });
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
        eraserRender.style.display = 'none';
        canvasContainer.style.display = 'block';
        for (let e of erasable) {
          e.style.opacity = 1;
          e.removeEventListener('mouseover', setOpacity);
        }
        linkBlocks.forEach((element) => {
          element.style.zIndex = '2';
        });
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }
  };
});
