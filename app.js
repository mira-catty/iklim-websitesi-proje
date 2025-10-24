// Climate Roast Studio - app logic

const images = [
  // Unsplash photos (public images). If any CORS issues occur when exporting, try running via a local server.
  { id: 'factory', url: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=1200&q=80', alt: 'Factory smoke and pollution' },
  { id: 'car', url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80', alt: 'Traffic and car exhaust' },
  { id: 'deforest', url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80', alt: 'Deforested land' },
  { id: 'oil', url: 'https://images.unsplash.com/photo-1496284045406-d3e0b918dbe3?auto=format&fit=crop&w=1200&q=80', alt: 'Oil industry and rigs' },
  { id: 'ice', url: 'https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1200&q=80', alt: 'Melting ice and glacier' },
  { id: 'wildfire', url: 'https://images.unsplash.com/photo-1501706362039-c6e809a4d0b3?auto=format&fit=crop&w=1200&q=80', alt: 'Wildfire smoke' }
];

const mainImage = document.getElementById('mainImage');
const thumbList = document.getElementById('thumbList');
const overlays = document.getElementById('overlays');
const captionInput = document.getElementById('captionInput');
const addCaptionBtn = document.getElementById('addCaptionBtn');
const fontSizeControl = document.getElementById('fontSize');
const fontColorControl = document.getElementById('fontColor');
const boldBtn = document.getElementById('boldBtn');
const italicBtn = document.getElementById('italicBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const canvasRoot = document.getElementById('canvasRoot');

let selectedCaption = null;

// populate thumbnails
images.forEach((it, idx) => {
  const thumb = document.createElement('button');
  thumb.className = 'thumb';
  thumb.setAttribute('aria-label', `Select image ${idx+1}: ${it.alt}`);
  thumb.tabIndex = 0;

  const img = document.createElement('img');
  img.src = it.url;
  img.alt = it.alt;
  img.loading = 'lazy';

  thumb.appendChild(img);
  thumb.addEventListener('click', () => selectImage(it));
  thumbList.appendChild(thumb);

  // set first image initially
  if (idx === 0) selectImage(it);
});

function selectImage(it){
  mainImage.src = it.url + '&' ; // leave query so cached; don't modify heavily
  mainImage.alt = it.alt;
  // ensure overlays container size matches the image once loaded
  mainImage.onload = () => {
    positionOverlaysContainer();
  }
}

function positionOverlaysContainer(){
  const rect = canvasRoot.getBoundingClientRect();
  overlays.style.width = rect.width + 'px';
  overlays.style.height = rect.height + 'px';
  overlays.style.left = canvasRoot.offsetLeft + 'px';
  overlays.style.top = canvasRoot.offsetTop + 'px';
}

// caption creation and editing
addCaptionBtn.addEventListener('click', () => {
  const text = captionInput.value.trim();
  if (!text) {
    alert('Please type a caption to add.');
    return;
  }
  const caption = document.createElement('div');
  caption.className = 'caption';
  caption.textContent = text;
  caption.style.left = '50%';
  caption.style.top = '50%';
  caption.style.fontSize = fontSizeControl.value + 'px';
  caption.style.color = fontColorControl.value;
  caption.style.fontWeight = boldBtn.classList.contains('active') ? '700' : '400';
  caption.style.fontStyle = italicBtn.classList.contains('active') ? 'italic' : 'normal';

  caption.setAttribute('tabindex', '0');

  // enable dragging
  enableDrag(caption);

  // select on click
  caption.addEventListener('click', (e) => {
    e.stopPropagation();
    selectCaption(caption);
  });

  // keyboard delete when selected
  caption.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      caption.remove();
      selectedCaption = null;
    }
  });

  overlays.appendChild(caption);
  selectCaption(caption);
  captionInput.value = '';
});

function selectCaption(el){
  if (selectedCaption) {
    selectedCaption.style.outline = 'none';
  }
  selectedCaption = el;
  el.style.outline = '2px dashed rgba(255,255,255,0.12)';
  // update controls to reflect selection
  const currentSize = parseInt(window.getComputedStyle(el).fontSize || '28px', 10);
  fontSizeControl.value = currentSize;
  fontColorControl.value = rgbToHex(window.getComputedStyle(el).color);
  if (window.getComputedStyle(el).fontWeight >= 700) boldBtn.classList.add('active'); else boldBtn.classList.remove('active');
  if (window.getComputedStyle(el).fontStyle === 'italic') italicBtn.classList.add('active'); else italicBtn.classList.remove('active');
}

// global click to deselect
document.addEventListener('click', (e) => {
  if (selectedCaption) {
    selectedCaption.style.outline = 'none';
    selectedCaption = null;
  }
});

// control bindings
fontSizeControl.addEventListener('input', () => {
  if (selectedCaption) selectedCaption.style.fontSize = fontSizeControl.value + 'px';
});

fontColorControl.addEventListener('input', () => {
  if (selectedCaption) selectedCaption.style.color = fontColorControl.value;
});

boldBtn.addEventListener('click', () => {
  boldBtn.classList.toggle('active');
  if (selectedCaption) {
    selectedCaption.style.fontWeight = boldBtn.classList.contains('active') ? '700' : '400';
  }
});

italicBtn.addEventListener('click', () => {
  italicBtn.classList.toggle('active');
  if (selectedCaption) {
    selectedCaption.style.fontStyle = italicBtn.classList.contains('active') ? 'italic' : 'normal';
  }
});

clearBtn.addEventListener('click', () => {
  if (confirm('Remove all captions?')) overlays.innerHTML = '';
});

// download/export using html2canvas
downloadBtn.addEventListener('click', async () => {
  // Temporarily remove outlines so they don't show in export
  const outlines = overlays.querySelectorAll('.caption');
  outlines.forEach(c => c.style.outline = 'none');

  // set width to image display size for more accurate export
  const exportTarget = canvasRoot;

  try {
    const canvas = await html2canvas(exportTarget, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      scale: Math.min(2, window.devicePixelRatio || 1)
    });
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'climate-roast.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error(err);
    alert('Export failed. If you see a CORS error, try running this page via a local server (e.g., "npx http-server" or "python -m http.server") or replace images with local files.');
  } finally {
    // restore outlines for selected caption
    if (selectedCaption) selectedCaption.style.outline = '2px dashed rgba(255,255,255,0.12)';
  }
});

// dragging implementation (mouse + touch)
function enableDrag(el){
  el.addEventListener('mousedown', startDrag);
  el.addEventListener('touchstart', startDrag, {passive:false});
  function startDrag(e){
    e.preventDefault();
    selectCaption(el);
    const start = getEventPoint(e);
    const rect = el.getBoundingClientRect();
    const parentRect = canvasRoot.getBoundingClientRect();
    const offsetX = start.x - rect.left;
    const offsetY = start.y - rect.top;

    function moveHandler(ev){
      const p = getEventPoint(ev);
      let left = p.x - parentRect.left - offsetX;
      let top = p.y - parentRect.top - offsetY;
      // clamp inside canvas
      left = Math.max(0, Math.min(left, parentRect.width - rect.width));
      top = Math.max(0, Math.min(top, parentRect.height - rect.height));
      const percentX = ((left + rect.width/2) / parentRect.width) * 100;
      const percentY = ((top + rect.height/2) / parentRect.height) * 100;
      el.style.left = percentX + '%';
      el.style.top = percentY + '%';
    }

    function upHandler(){
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', upHandler);
      window.removeEventListener('touchmove', moveHandler);
      window.removeEventListener('touchend', upHandler);
    }

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', upHandler);
    window.addEventListener('touchmove', moveHandler, {passive:false});
    window.addEventListener('touchend', upHandler);
  }
}

function getEventPoint(e){
  if (e.touches && e.touches[0]) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else {
    return { x: e.clientX, y: e.clientY };
  }
}

function rgbToHex(rgb){
  // rgb like "rgba(255, 255, 255, 1)" or "rgb(255,255,255)"
  const m = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '#ffffff';
  const r = parseInt(m[1]).toString(16).padStart(2,'0');
  const g = parseInt(m[2]).toString(16).padStart(2,'0');
  const b = parseInt(m[3]).toString(16).padStart(2,'0');
  return `#${r}${g}${b}`;
}

// adjust overlays size on resize
window.addEventListener('resize', positionOverlaysContainer);
positionOverlaysContainer();