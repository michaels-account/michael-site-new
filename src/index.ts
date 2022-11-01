import { greetUser } from '$utils/greet';

window.Webflow ||= [];
window.Webflow.push(() => {
  window.onload = function () {
    const canvas = document.querySelector('.canvas_draw');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const context = canvas.getContext('2d');

    let mousePositions = [];
    let erasePositions = [];

    context.strokeStyle = '#ff4141';
    context.lineWidth = 10;
    context.lineCap = 'round';

    let shouldPaint = false;
    let erasing = false;

    document.addEventListener('mousedown', function (event) {
      console.log(erasing);
      if (erasing) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        mousePositions.length = 0;
        erasePositions.length = 0;
        erasing = false;
      }
      shouldPaint = true;
      context.globalCompositeOperation = 'source-over';
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
      mousePositions.length = 0;
      waitErase();
    });

    document.addEventListener('mousemove', function (event) {
      if (shouldPaint == true) {
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
        for (let i = 1; i < mousePositions.length; i++)
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
        console.log(`Waiting ${i} seconds...`);
        await sleep(i * 1000);
      }
      if (shouldPaint === true) return;
      startErase();
      console.log('Done');
    };

    const startErase = async () => {
      erasing = true;
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = 20;
      context.beginPath();
      for (let i = 0; i < erasePositions.length; i++) {
        await sleep(50);
        context.lineTo(erasePositions[i].x, erasePositions[i].y);
        context.stroke();
      }
    };
    animate();
  };
});
