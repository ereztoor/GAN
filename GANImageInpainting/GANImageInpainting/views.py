
from flask import Flask, request, send_file, render_template
import base64
import numpy as np
from io import BytesIO
from PIL import Image
from GANImageInpainting import app
from utils import load_model, inpaint_image

MODEL_PATH = '/models/inpainting_model.pth'
IMAGE_SIZE = (128, 128)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/inpaint', methods=['POST'])
def inpaint():
    # Get the base64 image data and the selection coordinates
    image_base64 = request.form['image_base64']
    x = int(request.form['x'])
    y = int(request.form['y'])
    width = int(request.form['width'])
    height = int(request.form['height'])
    
    # Decode the base64 image
    image_data = base64.b64decode(image_base64.split(",")[1])
    image = Image.open(BytesIO(image_data)).convert("RGB")
    image = np.array(image)

    # Perform inpainting
    result = inpaint_image(image, IMAGE_SIZE, MODEL_PATH, (x, y, width, height))

    # Convert the result to an image and send it back
    result = ((result + 1) * 127.5).clip(0, 255).astype(np.uint8)
    result = result[0]
    result_image = Image.fromarray(result)
    byte_io = BytesIO()
    result_image.save(byte_io, 'PNG')
    byte_io.seek(0)

    return send_file(byte_io, mimetype='image/png')

@app.route('/inpaint2', methods=['POST'])
def inpaint2():
    # Get the base64 image data
    image_base64 = request.form['image_base64']
    mask_base64 = request.form['mask_base64']  # Get the mask
    
    # Decode the base64 image
    image_data = base64.b64decode(image_base64.split(",")[1])
    image = Image.open(BytesIO(image_data)).convert("RGB")
    image = np.array(image)

    # Decode the mask
    mask_data = base64.b64decode(mask_base64.split(",")[1])
    mask = Image.open(BytesIO(mask_data)).convert("RGB")
    mask = np.array(mask)

    # Perform inpainting
    result = inpaint_image(image, IMAGE_SIZE, MODEL_PATH, mask, test=True)

    # Convert the result to an image and send it back
    result = ((result + 1) * 127.5).clip(0, 255).astype(np.uint8)
    result = result[0]
    result_image = Image.fromarray(result)
    byte_io = BytesIO()
    result_image.save(byte_io, 'PNG')
    byte_io.seek(0)

    return send_file(byte_io, mimetype='image/png')