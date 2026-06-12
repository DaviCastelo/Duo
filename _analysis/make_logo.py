# O arquivo "jpg" e na verdade um PNG RGBA: ja tem transparencia.
# Basta recortar a area util e salvar como PNG.
from PIL import Image
import os

SRC = r"D:\Duo\logo-duo2-TGBnRiNw.jpg"
DST = r"D:\Duo\assets\img\logo-duo.png"

im = Image.open(SRC).convert("RGBA")
alpha = im.getchannel("A")
bbox = alpha.point(lambda a: 255 if a > 8 else 0).getbbox()
if bbox:
    m = 14
    w, h = im.size
    bbox = (max(0, bbox[0] - m), max(0, bbox[1] - m), min(w, bbox[2] + m), min(h, bbox[3] + m))
    im = im.crop(bbox)

os.makedirs(os.path.dirname(DST), exist_ok=True)
im.save(DST)
print("ok", im.size)
