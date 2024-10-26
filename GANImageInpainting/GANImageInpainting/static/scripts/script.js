let uploadedImageBase64 = "";
const imageInput = document.getElementById('image-input');
const imagePreview = document.getElementById('image-preview');
const uploadedImage = document.getElementById('uploaded-image');
const inpaintButton = document.getElementById('inpaint');
const inpaintedImage = document.getElementById('inpainted-image');
const result = document.getElementById('result');
const before = document.getElementById('before-image');
const drawingCanvas = document.getElementById('drawing-canvas');
const tools = document.getElementById('tools');
const context = drawingCanvas.getContext('2d');
const download = document.getElementById('download-button')
let isDrawing = false;
let points = [];
let currentTool = 'free-draw'; // Default to free draw
let brushSize = 2;

// Update canvas size and position
function updateCanvasSize() {
    const imageRect = imagePreview.getBoundingClientRect();
    drawingCanvas.width = imageRect.width;
    drawingCanvas.height = imageRect.height;
}

// Set up image and canvas
imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImageBase64 = e.target.result;
            imagePreview.src = uploadedImageBase64;
            before.src = uploadedImageBase64;
            imagePreview.style.display = 'block';
            inpaintButton.style.display = 'inline-block';
            uploadedImage.style.display = 'inline-block';
            tools.style.display = 'block';
            imagePreview.onload = updateCanvasSize;
        };
        reader.readAsDataURL(file);
    }
});

// Clear button functionality
document.getElementById('clear-canvas').addEventListener('click', () => {
    context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); // Clear the canvas
    points = []; // Clear any points
});

// Handle brush size change
document.getElementById('brush-size').addEventListener('input', (e) => {
    brushSize = e.target.value;
});

// Switch between tools
document.getElementById('free-draw').addEventListener('click', () => {
    currentTool = 'free-draw';
    context.globalCompositeOperation = 'source-over'; // Normal drawing
});

document.getElementById('lasso-tool').addEventListener('click', () => {
    currentTool = 'lasso-tool';
    context.globalCompositeOperation = 'source-over'; // Normal drawing
    points = []; // Clear previous points
});

document.getElementById('eraser').addEventListener('click', () => {
    currentTool = 'eraser';
    context.globalCompositeOperation = 'destination-out'; // Use destination-out to erase
});

// Enable drawing on the canvas
drawingCanvas.style.pointerEvents = 'auto';

// Start drawing
drawingCanvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    document.body.classList.add('no-select');
    const { offsetX, offsetY } = e;

    if (currentTool === 'lasso-tool') {
        points = []; // Clear previous points for a new lasso stroke
        points.push({ x: offsetX, y: offsetY });
        context.beginPath();
        context.moveTo(offsetX, offsetY);
    } else {
        context.beginPath();
        context.moveTo(offsetX, offsetY);
        context.lineWidth = brushSize;
        context.strokeStyle = 'red'; // Normal color for drawing
    }
});

// Continue drawing
drawingCanvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e;

    if (currentTool === 'free-draw') {
        context.lineTo(offsetX, offsetY);
        context.lineWidth = brushSize;
        context.strokeStyle = 'red'; // Normal color for drawing
        context.stroke();
    } else if (currentTool === 'eraser') {
        context.lineTo(offsetX, offsetY);
        context.lineWidth = brushSize; // Keep the brush size for eraser
        context.stroke();
    } else if (currentTool === 'lasso-tool') {
        points.push({ x: offsetX, y: offsetY });
        context.lineTo(offsetX, offsetY);
        context.lineWidth = 2;
        context.strokeStyle = 'red';
        context.stroke();
    }
});

// Finish drawing

function stopDrawing() {
    isDrawing = false;
    document.body.classList.remove('no-select');
    if (currentTool === 'lasso-tool' && points.length > 0) {
        context.closePath();

        // Fill the area inside the lasso points
        context.fillStyle = 'red'; // Fill color
        context.globalCompositeOperation = 'source-over';

        // Draw the filled shape for the current lasso stroke
        context.beginPath();
        context.moveTo(points[0].x, points[0].y); // Move to the first point
        points.forEach(point => {
            context.lineTo(point.x, point.y);
        });
        context.closePath();
        context.fill();
    }
}

// Slider functionality
const sliderHandle = document.querySelector('.slider-handle');
const afterImageContainer = document.querySelector('.after-image-container');
const sliderContainer = document.querySelector('.slider-container');

function slide(event) {
    const rect = sliderContainer.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    let percentage = (offsetX / sliderContainer.offsetWidth) * 100;

    if (percentage < 0) {
        percentage = 0;
    } else if (percentage > 100) {
        percentage = 100;
    }

    afterImageContainer.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    sliderHandle.style.left = 'calc(' + percentage + '% - 10px)'; // Adjust the position
}

function startDragging() {
    window.addEventListener('mousemove', slide);
    document.body.classList.add('no-select');
}

function stopDragging() {
    window.removeEventListener('mousemove', slide);
    document.body.classList.remove('no-select');
}

sliderHandle.addEventListener('mousedown', startDragging);
window.addEventListener('mouseup', stopDragging);
window.addEventListener('mouseup', stopDrawing);

download.addEventListener('click', function () {
    const img = inpaintedImage.src;
    const link = document.createElement('a');
    link.href = img;
    link.download = 'inpainted_image.png'; // Set the name for the downloaded file
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Handle form submission to send mask and image to the server
inpaintButton.addEventListener('click', () => {
    // Get the mask from the drawing canvas
    const maskCanvas = drawingCanvas.toDataURL('image/png');

    const formData = new FormData();
    formData.append("image_base64", uploadedImageBase64);
    formData.append("mask_base64", maskCanvas); // Send the mask

    fetch('/inpaint2', {
        method: 'POST',
        body: formData
    })
        .then(response => response.blob())
        .then(blob => {
            const url = URL.createObjectURL(blob);
            inpaintedImage.src = url;
            result.style.display = 'block';
            sliderContainer.style.display = 'inline-block';
            download.style.display = 'inline-block';
        });
});
