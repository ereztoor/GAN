from utils import load_image, create_mask, apply_mask, load_model
import tensorflow as tf
import numpy as np
import cv2

IMAGE_SIZE = (128, 128)
MODEL_PATH = 'models/generator.keras'
generator = load_model(MODEL_PATH)


def inpaint_image(image, mask):

    mask = tf.image.resize(create_mask(mask, IMAGE_SIZE), IMAGE_SIZE)
    # Scale the original image
    original_image = load_image(image, IMAGE_SIZE)

    masked_image = apply_mask(original_image, mask)

    generated_image = generator(masked_image, training=False)

    blended_image = blend_images(original_image, generated_image, create_soft_mask(mask))

    return blended_image.numpy()


def create_soft_mask(mask, blur_size=17):
    """
    Applies Gaussian blur to the binary mask to create a soft mask.

    Parameters:
    - mask: Binary mask (0 or 1) with the same dimensions as the image.
    - blur_size: The size of the Gaussian kernel to create the soft edges.

    Returns:
    - soft_mask: A soft mask with values between 0 and 1.
    """

    # Convert TensorFlow tensor to NumPy array if necessary
    if isinstance(mask, tf.Tensor):
        mask = mask.numpy()

    # Apply Gaussian blur to the mask
    soft_mask = cv2.GaussianBlur(mask, (blur_size, blur_size), 0)

    # Ensure the mask values are between 0 and 1
    soft_mask = np.clip(soft_mask, 0, 1)

    return soft_mask


def blend_images(original_image, generated_image, soft_mask):
    """
    Blends the original and generated images using a soft mask.

    Parameters:
    - original_image: The original unmasked image.
    - generated_image: The inpainted/generated image.
    - soft_mask: The soft mask used for blending, values between 0 and 1.

    Returns:
    - blended_image: The blended image.
    """
    # Ensure the mask is applied to the right channels
    soft_mask = np.expand_dims(soft_mask, axis=0)

    # Blend the images using the soft mask
    blended_image = original_image * soft_mask + generated_image * (1 - soft_mask)

    return blended_image
