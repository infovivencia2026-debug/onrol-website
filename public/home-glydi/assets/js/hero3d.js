/* =========================================================================
   ONROL — hero 3D loader.  Poster-first, lazy, mobile/saveData/reduced-motion
   skipped.  Zero layout shift (the .hero3d box reserves aspect-ratio space).

   USAGE — drop this into a hero:
     <div class="hero3d" data-spline="SPLINE_SCENE_URL_HERE">
       <img class="hero3d-poster" src="hero3d-poster.webp" alt=""
            width="600" height="600" decoding="async">
     </div>
   Paste your Spline scene URL into data-spline (export → "spline-viewer" URL).
   ========================================================================= */
(function () {
  "use strict";
  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SAVE = !!(navigator.connection && navigator.connection.saveData);
  var MOBILE = window.matchMedia("(max-width: 767px)").matches;

  document.querySelectorAll(".hero3d[data-spline]").forEach(function (box) {
    var url = box.getAttribute("data-spline");
    if (!url || url.indexOf("HERE") > -1) return;                 /* placeholder not filled */
    if (REDUCE || SAVE || MOBILE) return;                          /* poster only */
    if (!("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.disconnect();
        /* load the <spline-viewer> web component once, on demand */
        if (!window.customElements || !customElements.get("spline-viewer")) {
          var s = document.createElement("script");
          s.type = "module";
          s.src = "https://unpkg.com/@splinetool/viewer@1.9.48/build/spline-viewer.js";
          document.head.appendChild(s);
        }
        var v = document.createElement("spline-viewer");
        v.setAttribute("url", url);
        v.setAttribute("loading-anim-type", "none");
        v.style.width = "100%"; v.style.height = "100%";
        v.addEventListener("load", function () { box.classList.add("is-live"); });
        box.appendChild(v);
        /* safety: reveal even if the load event never fires */
        setTimeout(function () { box.classList.add("is-live"); }, 4000);
      });
    }, { rootMargin: "200px" });
    io.observe(box);
  });
})();

/* =========================================================================
   ALTERNATIVE — self-hosted three.js orb (uncomment to use instead of Spline).
   Needs: <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
   Renders a slowly rotating orange checkerboard cube matching the ONROL mark.
   Same guardrails apply (skip on mobile / saveData / reduced-motion).
   -------------------------------------------------------------------------
(function () {
  "use strict";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (navigator.connection && navigator.connection.saveData) return;
  if (window.matchMedia("(max-width: 767px)").matches) return;
  var box = document.querySelector(".hero3d[data-three]");
  if (!box || !window.THREE) return;

  var THREE = window.THREE, w = box.clientWidth, h = box.clientHeight;
  var scene = new THREE.Scene();
  var cam = new THREE.PerspectiveCamera(45, w / h, 0.1, 100); cam.position.z = 4;
  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h); box.appendChild(renderer.domElement);

  var group = new THREE.Group();
  var geo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
  var on = new THREE.MeshStandardMaterial({ color: 0xF46718, roughness: 0.25, metalness: 0.1, emissive: 0x2a0e02 });
  for (var x = -1; x <= 1; x++) for (var y = -1; y <= 1; y++) for (var z = -1; z <= 1; z++) {
    if ((x + y + z + 3) % 2 === 0) {                 // checkerboard
      var m = new THREE.Mesh(geo, on);
      m.position.set(x * 0.48, y * 0.48, z * 0.48);
      group.add(m);
    }
  }
  scene.add(group);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  var key = new THREE.DirectionalLight(0xffd8b0, 1.4); key.position.set(3, 4, 5); scene.add(key);

  (function loop() { requestAnimationFrame(loop); group.rotation.y += 0.004; group.rotation.x += 0.0015; renderer.render(scene, cam); })();
  box.classList.add("is-live");
  addEventListener("resize", function () {
    w = box.clientWidth; h = box.clientHeight; cam.aspect = w / h; cam.updateProjectionMatrix(); renderer.setSize(w, h);
  });
})();
   ========================================================================= */
