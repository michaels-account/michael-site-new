import { greetUser } from '$utils/greet';

window.Webflow ||= [];
window.Webflow.push(() => {
  window.onload = function () {
    const canvas = document.querySelector('.canvas_draw');
    const eraserRender = document.querySelector('.eraser');
    const linkBlocks = Array.from(document.getElementsByClassName('link-block'));
    //const image = document.querySelectorAll('.image');
    let erasable;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const context = canvas.getContext('2d');

    let mousePositions = [];

    let randomColor = function () {
      let colors = ['#3F3F3F', '#929292', '#00A3EE', '#F5D908', '#D80351'];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    context.lineWidth = 10;
    context.lineCap = 'round';

    let shouldPaint = false;
    let eraserSelected = false;
    let erase;

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
        erase();
        eraserSelected = true;
        pos3 = e.clientX;
        pos4 = e.clientY;
        eraserRender.onmouseup = closeDragElement;
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
          e.addEventListener('mouseover', function (e) {
            this.style.opacity = 0;
          });
        }
      }

      function closeDragElement() {
        // stop moving when mouse button is released:
        eraserSelected = false;
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }

    document.addEventListener('mousedown', function (event) {
      if (eraserSelected === true) return;
      shouldPaint = true;
      context.strokeStyle = randomColor();
      context.globalCompositeOperation = 'source-over';
      context.lineWidth = 10;
      context.beginPath();
      context.lineTo(event.pageX, event.pageY);
      context.stroke();
      erase(); //stop erase loop

      mousePositions.push({
        x: event.pageX,
        y: event.pageY,
      });
    });

    document.addEventListener('mouseup', function (event) {
      shouldPaint = false;
      erase = asyncEraseLoop(); //start erase loop
    });

    document.addEventListener('mousemove', function (event) {
      if (shouldPaint) {
        event.preventDefault();
        context.lineTo(event.pageX, event.pageY);
        context.stroke();

        mousePositions.push({
          x: event.pageX,
          y: event.pageY,
        });
      }
    });

    let counter = 0;

    const asyncErase = () =>
      new Promise((resolve) => {
        console.log('loop');
        setTimeout(resolve, 500); //affects rate of loop
        context.beginPath();
        context.lineTo(mousePositions[counter].x, mousePositions[counter].y);
        eraserRender.style.left = mousePositions[counter].x - eraserRender.offsetWidth / 2 + 'px';
        eraserRender.style.top = mousePositions[counter].y - eraserRender.offsetHeight / 2 + 'px';
        context.stroke();
        counter += 1;
      });

    const asyncEraseLoop = () => {
      let loop = true;
      eraserRender.style.display = 'block';
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = 100;
      const handler = () => {
        loop && asyncErase().then(handler);
      };
      handler();
      return () => (loop = false);
    };

    $('.text').each(function (index) {
      let characters = $(this).text().split('');
      let splitCharacters = $(this);
      splitCharacters.empty();
      $.each(characters, function (i, el) {
        //splitCharacters.append('<span class="letter-' + i + '">' + el + '</span>');
        splitCharacters.append('<span class="erasable">' + el + '</span>');
      });
      erasable = document.getElementsByClassName('erasable');
    });
  };
});
