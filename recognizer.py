import cv2
import sys
import pymongo
import numpy as np
import tensorflow as tf

from functools import reduce
from os import path

trained_model = tf.keras.models.load_model('ml/remote.h5')
# client = pymongo.MongoClient('mongodb+srv://attempts_user:attempts_pass@attemptsstorage-l9ph0.mongodb.net')
# db = client['test']
# col = db['attempts']
# print(col.find_one({}, {"_id": sys.argv[1]})['_id'])


def handle_frame(frame_name):
    frame = cv2.imread(frame_name)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    ret, thresh = cv2.threshold(gray, 127, 255, 0)
    contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    digits = []

    for idx, contour in enumerate(contours):
        bounding_rect = cv2.boundingRect(contour)
        x, y, w, h = bounding_rect
        cropped = thresh[y: y + h, x: x + w]
        # cv2.imwrite("blobby" + str(idx) + ".png", cropped)

        if not idx or hierarchy[0, idx, 3]:
            continue

        rec_image = get_valid_image_from_contour(cropped)
        prediction = trained_model.predict(rec_image)

        digits.append((x, np.argmax(prediction)))

    result = reduce(
        lambda a, b: a + str(b[1]),
        sorted(digits, key=lambda d: d[0]),
        ''
    )

    return result


def get_valid_image_from_contour(contour):
    width, height = contour.shape
    descale = max(width, height) / 24
    dim = (round(height / descale), round(width / descale))

    resized = cv2.resize(contour, dim, interpolation=cv2.INTER_AREA)
    resized_h, resized_w = resized.shape

    offset_h = round((28 - resized_h) / 2)
    offset_w = round((28 - resized_w) / 2)

    roffset_w = offset_w + resized_w
    roffset_h = offset_h + resized_h

    blank_image = 255 * np.ones(shape=[28, 28], dtype=np.uint8)
    blank_image[offset_h:roffset_h, offset_w:roffset_w] = resized

    recognize = blank_image.reshape(1, 784)
    recognize = 255 - recognize
    recognize = recognize / 255

    return recognize


# frame = cv2.imread('629.png')
# with open("data_file.json", "w") as write_file:
#     json.dump(frame.tolist(), write_file)

if len(sys.argv) > 1:
    print(handle_frame('ml/data/' + sys.argv[1] + '.png'))
