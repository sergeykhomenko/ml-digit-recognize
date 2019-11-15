// import axios from 'axios';

const canvas = document.getElementById('draw_tool_area');
const context = canvas.getContext('2d');

const valueWrapper = document.getElementById('recognizedValue');
const approveStep = document.querySelector('.recognize--approve');
const correctionStep = document.querySelector('.recognize--correct');

let currentHash = '';

let canvasTop = calculateOffset(canvas, 'offsetTop'), canvasLeft = calculateOffset(canvas);
window.onresize = () => {
    canvasTop = calculateOffset(canvas, 'offsetTop'), canvasLeft = calculateOffset(canvas);
};

let paint, clickX = [], clickY = [], drag = [];

document.addEventListener('DOMContentLoaded', () => {

    canvas.onmousedown = function(e) {
        paint = true;
        addClick(e.pageX - canvasLeft, e.pageY - canvasTop);
        redraw();
    };

    canvas.onmouseup = e => {
        paint = false;
    };

    canvas.onmouseleave = e => {
        paint = false;
    };

    canvas.onmousemove = function(e) {
        if(paint){
            addClick(e.pageX - canvasLeft, e.pageY - canvasTop, true);
            redraw();
        }
    }

    $('.action--recognize').click(() => {
        axios.post('/api/recognize', {image: canvas.toDataURL('image/png')}).then(
            ({data}) => {
                currentHash = data.hash;
                valueWrapper.innerText = data.value;

                approveStep.classList.toggle('d-none');
            }
        );
    });

    $('.action--approve').click(() => {
        axios.post('/api/recognize/approve', {hash: currentHash}).then(
            () => approveStep.classList.toggle('d-none')
        );
    });

});

function addClick(x, y, dragging) {
    clickX.push(x);
    clickY.push(y);
    drag.push(dragging);
}

function redraw() {
    context.clearRect(0, 0, 200, 400); // Clears the canvas

    context.strokeStyle = "#000000";
    context.lineJoin = "round";
    context.lineWidth = 5;

    for(var i=0; i < clickX.length; i++) {
        context.beginPath();
        if(drag[i] && i){
            context.moveTo(clickX[i-1], clickY[i-1]);
        }else{
            context.moveTo(clickX[i]-1, clickY[i]);
        }
        context.lineTo(clickX[i], clickY[i]);
        context.closePath();
        context.stroke();
    }
}

function calculateOffset($el, offsetType = 'offsetLeft', offset = 0) {
    if($el === document.body) {
        return offset;
    }

    return calculateOffset($el.offsetParent, offsetType, offset + $el[offsetType]);
}
