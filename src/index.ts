import { greetUser } from '$utils/greet';

window.Webflow ||= [];
window.Webflow.push(() => {
  window.onload = function () {
    if ('ontouchstart' in window) {
      return;
    }
    const canvas = document.querySelector('.canvas_draw');
    const canvasContainer = document.querySelector('.canvas');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const context = canvas.getContext('2d');
    const colours = ['#F94432', '#8C8C54', '#8324CE', '#919AF9', '#F77514', '#3939D3'];
    let colourIndex = 0;

    let mousePositions = [];
    let erasePositions = [];

    //context.strokeStyle = '#ff4141';
    context.lineWidth = 10;
    context.lineCap = 'round';

    let shouldPaint = false;
    let erasingLines = false;

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

    document.addEventListener('mousedown', function (event) {
      if (erasingLines) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (eraserSelected === false) {
          eraserRender.style.display = 'none';
        }
        mousePositions.length = 0;
        erasePositions.length = 0;
        erasingLines = false;
      }
      if (eraserSelected === true) return;
      shouldPaint = true;
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = colours[colourIndex];
      colourIndex = (colourIndex + 1) % colours.length;
      context.lineWidth = 10;
      mousePositions.push({
        x: event.pageX,
        y: event.pageY,
      });
      erasePositions.push({
        x: event.pageX,
        y: event.pageY,
      });
    });

    document.addEventListener('mouseup', function (event) {
      shouldPaint = false;
      console.log(mousePositions);
      console.log(erasePositions);
      mousePositions.length = 0;
      waitErase();
    });

    document.addEventListener('mousemove', function (event) {
      if (shouldPaint == true) {
        event.preventDefault();
        mousePositions.push({
          x: event.pageX,
          y: event.pageY,
        });
        erasePositions.push({
          x: event.pageX,
          y: event.pageY,
        });
      }
    });

    function animate() {
      requestAnimationFrame(animate);
      if (shouldPaint === true) {
        context.beginPath();
        context.moveTo(mousePositions[0].x, mousePositions[0].y);
        for (let i = 0; i < mousePositions.length; i++)
          context.lineTo(mousePositions[i].x, mousePositions[i].y);
        context.stroke();
      }
    }
    const sleep = (time) => {
      return new Promise((resolve) => setTimeout(resolve, time));
    };

    const waitErase = async () => {
      for (let i = 0; i < 3; i++) {
        if (shouldPaint === true) return;
        await sleep(i * 1000);
      }
      if (shouldPaint === true || eraserSelected) return;
      if (
        erasePositions !== null &&
        typeof erasePositions !== 'undefined' &&
        erasePositions.length > 0
      ) {
        startErase();
      }
    };

    const startErase = async () => {
      erasingLines = true;
      eraserRender.style.display = 'block';
      eraserRender.style.left = erasePositions[0].x - eraserRender.offsetWidth / 2 + 'px';
      eraserRender.style.top = erasePositions[0].y - eraserRender.offsetHeight / 2 + 'px';
      eraserRender.style.zIndex = '3';
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = 20;
      context.beginPath();

      for (let i = 0; i < erasePositions.length; i++) {
        await sleep(100);
        eraserRender.style.left = erasePositions[i].x - eraserRender.offsetWidth / 2 + 'px';
        eraserRender.style.top = erasePositions[i].y - eraserRender.offsetHeight / 2 + 'px';
        context.lineTo(erasePositions[i].x, erasePositions[i].y);
        context.stroke();
      }
      eraserRender.style.display = 'none';
    };
    animate();

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
