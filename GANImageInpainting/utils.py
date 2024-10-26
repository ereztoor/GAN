
import tensorflow as tf
import numpy as np

def load_model(model_path):
    return tf.keras.models.load_model(model_path)

def load_image(image, image_size):
    #image = tf.keras.preprocessing.image.load_img(file_path, target_size=(IMAGE_SIZE, IMAGE_SIZE))
    image = tf.image.resize(image, image_size)
    image = tf.keras.preprocessing.image.img_to_array(image)
    image = image / 127.5 - 1.0  # Rescale to [-1, 1]
    image = tf.expand_dims(image, axis=0)
    return image

def create_mask(mask_array, image_size):
    # Resize the mask to the specified image_size
    mask_array = tf.image.resize(mask_array, image_size)  # (height, width, channels)

    # Create a mask of ones with the same height and width as the input image
    mask = np.ones((image_size[1], image_size[0], 3), dtype=np.float32)  # Shape: (height, width, 3)

    # Identify pixels where the red channel is not zero
    red_pixels = mask_array[:, :, 0] != 0  # Non-zero red channel

    # Set those pixels to (0, 0, 0)
    mask[red_pixels] = (0, 0, 0)  # Set identified red pixels to (0, 0, 0)

    return mask

def apply_mask(image, mask):
    return image * mask

def inpaint_image(image, image_size, model_path, mask, test=False):
    # Ensure the mask is the right size
    mask = tf.image.resize(create_mask(mask, image_size), image_size)

    # Scale the original image
    original_image = load_image(image, image_size)

    # Apply the mask to the original image
    masked_image = apply_mask(original_image, mask)

    if test:
        generated_image = masked_image
    else:
        generator = tf.keras.models.load_model(model_path)
        generated_image = generator(masked_image, training=False)

    return generated_image.numpy()

