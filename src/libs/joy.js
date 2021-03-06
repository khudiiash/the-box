export var JoyStick = function (t, e) {
  var i = void 0 === (e = e || {}).title ? "joystick" : e.title,
    n = void 0 === e.width ? 0 : e.width,
    o = void 0 === e.height ? 0 : e.height,
    r = void 0 === e.internalFillColor ? "#ffffff" : e.internalFillColor,
    h = void 0 === e.internalLineWidth ? 2 : e.internalLineWidth,
    a = void 0 === e.internalStrokeColor ? "#ffffff" : e.internalStrokeColor,
    d = void 0 === e.externalLineWidth ? 2 : e.externalLineWidth,
    f = void 0 === e.externalStrokeColor ? "#ffffff" : e.externalStrokeColor,
    l = void 0 === e.autoReturnToCenter || e.autoReturnToCenter,
    s = document.getElementById(t),
    c = document.createElement("canvas");
  (c.id = i),
    0 === n && (n = s.clientWidth),
    0 === o && (o = s.clientHeight),
    (c.width = n),
    (c.height = o),
    s.appendChild(c);
  var u = c.getContext("2d"),
    g = 0,
    v = 2 * Math.PI,
    p = (c.width - (c.width / 2 + 10)) / 2,
    C = p + 5,
    w = p + 30,
    m = c.width / 2,
    L = c.height / 2,
    E = c.width / 10,
    P = -1 * E,
    S = c.height / 10,
    k = -1 * S,
    W = m,
    T = L;
  function G() {
    u.beginPath(),
      u.arc(m, L, w, 0, v, !1),
      (u.lineWidth = d),
      (u.strokeStyle = f),
      u.stroke();
  }
  function x() {
    u.beginPath(),
      W < p && (W = C),
      W + p > c.width && (W = c.width - C),
      T < p && (T = C),
      T + p > c.height && (T = c.height - C),
      u.arc(W, T, p, 0, v, !1);
    var t = u.createRadialGradient(m, L, 5, m, L, 200);
    t.addColorStop(0, r),
      t.addColorStop(1, a),
      (u.fillStyle = t),
      u.fill(),
      (u.lineWidth = h),
      (u.strokeStyle = a),
      u.stroke();
  }
  "ontouchstart" in document.documentElement
    ? (c.addEventListener(
        "touchstart",
        function (t) {
          g = 1;
        },
        !1
      ),
      c.addEventListener(
        "touchmove",
        function (t) {
          t.preventDefault(),
            1 === g &&
              t.targetTouches[0].target === c &&
              ((W = t.targetTouches[0].pageX - 40),
              (T = t.targetTouches[0].pageY),

              "BODY" === c.offsetParent.tagName.toUpperCase()
                ? ((W -= c.offsetLeft), (T -= c.offsetTop))
                : ((W -= c.offsetParent.offsetLeft),
                  (T -= c.offsetParent.offsetTop)),
              u.clearRect(0, 0, c.width, c.height),
              G(),
              x());
        },
        !1
      ),
      c.addEventListener(
        "touchend",
        function (t) {
          (g = 0), l && ((W = m), (T = L));
          u.clearRect(0, 0, c.width, c.height), G(), x();
        },
        !1
      ))
    : (c.addEventListener(
        "mousedown",
        function (t) {
          g = 1;
        },
        !1
      ),
      c.addEventListener(
        "mousemove",
        function (t) {
          1 === g &&
            ((W = t.pageX),
            (T = t.pageY),
            "BODY" === c.offsetParent.tagName.toUpperCase()
              ? ((W -= c.offsetLeft), (T -= c.offsetTop))
              : ((W -= c.offsetParent.offsetLeft),
                (T -= c.offsetParent.offsetTop)),
            u.clearRect(0, 0, c.width, c.height),
            G(),
            x());
        },
        !1
      ),
      c.addEventListener(
        "mouseup",
        function (t) {
          (g = 0), l && ((W = m), (T = L));
          u.clearRect(0, 0, c.width, c.height), G(), x();
        },
        !1
      )),
    G(),
    x(),
    (this.getWidth = function () {
      return c.width;
    }),
    (this.getHeight = function () {
      return c.height;
    }),
    (this.getPosX = function () {
      return W;
    }),
    (this.getPosY = function () {
      return T;
    }),
    (this.getX = function () {
      return (((W - m) / C) * 100).toFixed();
    }),
    (this.getY = function () {
      return (((T - L) / C) * 100 * -1).toFixed();
    }),
    (this.getDir = function () {
      var t = "",
        e = W - m,
        i = T - L;
      return (
        i >= k && i <= S && (t = ""),
        i < k && (t = "W"),
        i > S && (t = "S"),
        e < P && ("" === t ? (t = "A") : (t += "A")),
        e > E && ("" === t ? (t = "D") : (t += "D")),
        t
      );
    });
};
