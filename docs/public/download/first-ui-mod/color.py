# -*- coding: utf-8 -*-
import math

# ---------- утилиты 0xRRGGBB ----------
def _hex_to_rgb8(c):
  c = int(c)
  return ((c >> 16) & 0xFF, (c >> 8) & 0xFF, c & 0xFF)

def _rgb8_to_hex(r, g, b):
  def q(v):
    if v < 0: v = 0
    if v > 255: v = 255
    return int(v + 0.5)
  return (q(r) << 16) | (q(g) << 8) | q(b)

# ---------- sRGB <-> линейный ----------
def _srgb8_to_linear(x):
  s = x / 255.0
  if s <= 0.04045:
    return s / 12.92
  return ((s + 0.055) / 1.055) ** 2.4

def _linear_to_srgb8(y):
  if y <= 0.0: return 0.0
  if y >= 1.0: return 255.0
  if y <= 0.0031308:
    s = 12.92 * y
  else:
    s = 1.055 * (y ** (1.0 / 2.4)) - 0.055
  return 255.0 * s

# ---------- линейный sRGB <-> XYZ (D65) ----------
_M_RGB2XYZ = (
  (0.4124564, 0.3575761, 0.1804375),
  (0.2126729, 0.7151522, 0.0721750),
  (0.0193339, 0.1191920, 0.9503041)
)
_M_XYZ2RGB = (
  ( 3.2404542, -1.5371385, -0.4985314),
  (-0.9692660,  1.8760108,  0.0415560),
  ( 0.0556434, -0.2040259,  1.0572252)
)

def _matmul3(M, v):
  return (
    M[0][0]*v[0] + M[0][1]*v[1] + M[0][2]*v[2],
    M[1][0]*v[0] + M[1][1]*v[1] + M[1][2]*v[2],
    M[2][0]*v[0] + M[2][1]*v[1] + M[2][2]*v[2],
  )

# ---------- XYZ <-> Lab (D65) и Lab <-> LCh ----------
_Xn, _Yn, _Zn = 0.95047, 1.0, 1.08883
_delta = 6.0/29.0
_delta2 = _delta*_delta
_delta3 = _delta2*_delta

def _f(t):
  if t > _delta3: return t ** (1.0/3.0)
  return t / (3.0*_delta2) + 4.0/29.0

def _finv(u):
  u3 = u*u*u
  if u3 > _delta3: return u3
  return 3.0*_delta2*(u - 4.0/29.0)

def _rgb8_to_lab(r8, g8, b8):
  rL, gL, bL = _srgb8_to_linear(r8), _srgb8_to_linear(g8), _srgb8_to_linear(b8)
  X, Y, Z = _matmul3(_M_RGB2XYZ, (rL, gL, bL))
  xr, yr, zr = X/_Xn, Y/_Yn, Z/_Zn
  fx, fy, fz = _f(xr), _f(yr), _f(zr)
  L = 116.0*fy - 16.0
  a = 500.0*(fx - fy)
  b = 200.0*(fy - fz)
  return (L, a, b)

def _lab_to_rgb8(L, a, b):
  fy = (L + 16.0) / 116.0
  fx = fy + a/500.0
  fz = fy - b/200.0
  X = _Xn * _finv(fx)
  Y = _Yn * _finv(fy)
  Z = _Zn * _finv(fz)
  rL, gL, bL = _matmul3(_M_XYZ2RGB, (X, Y, Z))
  return (_linear_to_srgb8(rL), _linear_to_srgb8(gL), _linear_to_srgb8(bL))

def _lab_to_lch(L, a, b):
  C = math.sqrt(a*a + b*b)
  h = math.degrees(math.atan2(b, a))
  if h < 0: h += 360.0
  return (L, C, h)

def _lch_to_lab(L, C, h):
  hr = math.radians(h)
  a = C * math.cos(hr)
  b = C * math.sin(hr)
  return (L, a, b)

# ---------- вспомогательные ----------
def _bump(t):
  # колокол 0..1 с максимумом в 0.5 (значение = 1)
  return 4.0 * t * (1.0 - t)

def _lerp(a, b, t):
  return a*(1.0 - t) + b*t

def _lerp_hue(h1, h2, t):
  d = h2 - h1
  if d > 180.0:  d -= 360.0
  if d < -180.0: d += 360.0
  h = h1 + t*d
  if h < 0: h += 360.0
  if h >= 360.0: h -= 360.0
  return h

# относительная яркость по WCAG (на линейном sRGB)
def _rel_luminance_rgb8(r8, g8, b8):
  rL, gL, bL = _srgb8_to_linear(r8), _srgb8_to_linear(g8), _srgb8_to_linear(b8)
  return 0.2126*rL + 0.7152*gL + 0.0722*bL

def _contrast_ratio_rgb(bg_hex, fg_hex):
  br, bg, bb = _hex_to_rgb8(bg_hex)
  fr, fg, fb = _hex_to_rgb8(fg_hex)
  Lb = _rel_luminance_rgb8(br, bg, bb)
  Lf = _rel_luminance_rgb8(fr, fg, fb)
  L1, L2 = (Lf, Lb) if Lf >= Lb else (Lb, Lf)
  return (L1 + 0.05) / (L2 + 0.05)

# ---------- публичные функции ----------
def lerpColor(c1, c2, t, mid_L_shift=0.0, mid_C_boost=1.0):
  """
  Градиент через CIE LCh с усилением контраста в середине.
    c1, c2: 0xRRGGBB
    t: 0..1
    mid_L_shift: добавка к L в середине (ед. Lab, + светлее, - темнее)
    mid_C_boost: множитель насыщенности C в середине (>=1.0)
  """
  if t < 0.0: t = 0.0
  if t > 1.0: t = 1.0
  r1, g1, b1 = _hex_to_rgb8(c1)
  r2, g2, b2 = _hex_to_rgb8(c2)

  L1, a1, b_1 = _rgb8_to_lab(r1, g1, b1)
  L2, a2, b_2 = _rgb8_to_lab(r2, g2, b2)
  l1, c1_, h1 = _lab_to_lch(L1, a1, b_1)
  l2, c2_, h2 = _lab_to_lch(L2, a2, b_2)

  b = _bump(t)
  # светлота: линейно + «бугор» в середине
  L = _lerp(l1, l2, t) + mid_L_shift * b
  # насыщенность: линейно и усиливаем в середине
  C_lin = _lerp(c1_, c2_, t)
  C = C_lin * (1.0 + (mid_C_boost - 1.0) * b)
  # оттенок по кратчайшей дуге
  h = _lerp_hue(h1, h2, t)

  Lm, am, bm = _lch_to_lab(L, C, h)
  r, g, b = _lab_to_rgb8(Lm, am, bm)
  return _rgb8_to_hex(r, g, b)

